#!/usr/bin/env sh
set -eu

PROJECT_DIR=${PROJECT_DIR:-/opt/anna-erp}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/anna-erp}
RETENTION_DAYS=${RETENTION_DAYS:-14}
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
FINAL_FILE="$BACKUP_DIR/anna-erp-$TIMESTAMP.dump"
PARTIAL_FILE="$FINAL_FILE.partial"

cleanup() {
  rm -f "$PARTIAL_FILE"
}

trap cleanup EXIT INT TERM

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  . "$PROJECT_DIR/.env"
  set +a
fi

: "${POSTGRES_USER:?POSTGRES_USER não definido}"
: "${POSTGRES_DB:?POSTGRES_DB não definido}"

docker compose exec -T db pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --format=custom \
  --no-owner \
  > "$PARTIAL_FILE"

chmod 600 "$PARTIAL_FILE"
mv "$PARTIAL_FILE" "$FINAL_FILE"
trap - EXIT INT TERM

find "$BACKUP_DIR" -type f -name 'anna-erp-*.dump' -mtime "+$RETENTION_DAYS" -delete

echo "Backup criado em $FINAL_FILE"
