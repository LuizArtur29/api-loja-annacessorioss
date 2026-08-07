#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?Defina SOURCE_DATABASE_URL com a URL PostgreSQL somente leitura/origem}"

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL#jdbc:}"
SOURCE_DATABASE_USER="${SOURCE_DATABASE_USER:-}"
SOURCE_DATABASE_PASSWORD="${SOURCE_DATABASE_PASSWORD:-}"
export SOURCE_DATABASE_URL SOURCE_DATABASE_USER SOURCE_DATABASE_PASSWORD

RUN_ID="anna-erp-rehearsal-$$"
NETWORK_NAME="$RUN_ID-net"
DB_CONTAINER="$RUN_ID-db"
API_CONTAINER="$RUN_ID-api"
IMAGE_NAME="anna-erp-rehearsal:local"
WORK_DIR=$(mktemp -d /tmp/anna-erp-rehearsal.XXXXXX)
DUMP_FILE="$WORK_DIR/source.dump"
BEFORE_FILE="$WORK_DIR/before.txt"
AFTER_FILE="$WORK_DIR/after.txt"

cleanup() {
  docker rm -f "$API_CONTAINER" "$DB_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT INT TERM

QUERY="SELECT 'produtos', count(*)::text FROM produtos
UNION ALL SELECT 'categorias', count(*)::text FROM categorias
UNION ALL SELECT 'clientes', count(*)::text FROM clientes
UNION ALL SELECT 'usuarios', count(*)::text FROM usuarios
UNION ALL SELECT 'vendas', count(*)::text FROM vendas
UNION ALL SELECT 'itens_venda', count(*)::text FROM itens_venda
UNION ALL SELECT 'despesas', count(*)::text FROM despesas
UNION ALL SELECT 'estoque_unidades', coalesce(sum(quantidade_estoque), 0)::text FROM produtos
UNION ALL SELECT 'estoque_valor_venda', coalesce(sum(preco_venda * quantidade_estoque), 0)::text FROM produtos
UNION ALL SELECT 'vendas_valor_historico', coalesce(sum(valor_total), 0)::text FROM vendas
UNION ALL SELECT 'despesas_valor_historico', coalesce(sum(valor), 0)::text FROM despesas
ORDER BY 1;"

echo "1/6 Gerando dump lógico somente leitura..."
docker run --rm \
  --env SOURCE_DATABASE_URL \
  --env SOURCE_DATABASE_USER \
  --env SOURCE_DATABASE_PASSWORD \
  postgres:17-alpine \
  sh -c 'PGUSER="$SOURCE_DATABASE_USER" PGPASSWORD="$SOURCE_DATABASE_PASSWORD" pg_dump --dbname "$SOURCE_DATABASE_URL" --format=custom --no-owner --no-acl' > "$DUMP_FILE"

echo "2/6 Criando PostgreSQL temporário..."
docker network create "$NETWORK_NAME" >/dev/null
docker run -d --name "$DB_CONTAINER" --network "$NETWORK_NAME" \
  -e POSTGRES_DB=anna_rehearsal \
  -e POSTGRES_USER=anna_rehearsal \
  -e POSTGRES_PASSWORD=anna_rehearsal \
  postgres:17-alpine >/dev/null

until docker exec "$DB_CONTAINER" pg_isready -U anna_rehearsal -d anna_rehearsal >/dev/null 2>&1; do
  sleep 1
done

echo "3/6 Restaurando a cópia..."
docker cp "$DUMP_FILE" "$DB_CONTAINER:/tmp/source.dump"
docker exec "$DB_CONTAINER" pg_restore --no-owner --no-acl \
  --username anna_rehearsal --dbname anna_rehearsal /tmp/source.dump
docker exec "$DB_CONTAINER" psql -At -U anna_rehearsal -d anna_rehearsal -c "$QUERY" > "$BEFORE_FILE"

echo "4/6 Construindo a API atual..."
docker build -t "$IMAGE_NAME" backend-api >/dev/null

echo "5/6 Executando Flyway e validação Hibernate na cópia..."
docker run -d --name "$API_CONTAINER" --network "$NETWORK_NAME" \
  -e DB_URL=jdbc:postgresql://"$DB_CONTAINER":5432/anna_rehearsal \
  -e DB_USER=anna_rehearsal \
  -e DB_PASSWORD=anna_rehearsal \
  -e JWT_SECRET=UmV0ZWFyc2FsLW1pZ3JhdGlvbi1zZWNyZXQtbG9uZy1lbm91Z2g= \
  "$IMAGE_NAME" >/dev/null

for _ in $(seq 1 60); do
  if docker logs "$API_CONTAINER" 2>&1 | grep -q "Started ApiApplication"; then
    break
  fi
  if ! docker inspect -f '{{.State.Running}}' "$API_CONTAINER" 2>/dev/null | grep -q true; then
    docker logs "$API_CONTAINER"
    exit 1
  fi
  sleep 1
done

docker logs "$API_CONTAINER" 2>&1 | grep -q "Started ApiApplication" || {
  docker logs "$API_CONTAINER"
  echo "A API não iniciou dentro do prazo." >&2
  exit 1
}

echo "6/6 Comparando contagens e validando a versão do Flyway..."
docker exec "$DB_CONTAINER" psql -At -U anna_rehearsal -d anna_rehearsal -c "$QUERY" > "$AFTER_FILE"
diff -u "$BEFORE_FILE" "$AFTER_FILE"
docker exec "$DB_CONTAINER" psql -At -U anna_rehearsal -d anna_rehearsal \
  -c "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank;"

echo "Ensaio concluído: migrations aplicadas sem alterar contagens da origem."
