# ERP Ana Acessórios

Sistema de gestão comercial de uso interno da Ana Acessórios. O projeto controla produtos, categorias, estoque, clientes, vendas, despesas parceladas e indicadores financeiros.

## Arquitetura

- Backend: Java 21, Spring Boot 4, Spring Security, JWT, JPA/Hibernate e Flyway.
- Frontend: React 19, Vite, React Query e Axios.
- Banco: PostgreSQL.
- Produção: Docker Compose, Caddy com HTTPS automático, API Spring Boot e PostgreSQL privado.

## Requisitos locais

- Java 21
- Node.js 24
- Docker (necessário para os testes de integração e para o ambiente via Compose)

## Executando os testes

Os testes unitários usam H2. A suíte de integração inicia automaticamente um
PostgreSQL 17 isolado com Testcontainers, portanto exige que o Docker esteja em
execução. Nenhuma credencial de produção é necessária.

```bash
cd backend-api
./mvnw test
```

```bash
cd frontend
npm ci
npm run lint
npm run test:coverage
npm run build
npm run test:e2e
```

## Contrato da API

Com `SPRINGDOC_ENABLED=true` no ambiente local, o contrato OpenAPI fica disponível em
`http://localhost:8080/v3/api-docs` e a interface Swagger em
`http://localhost:8080/swagger-ui.html`. Esses caminhos não são publicados pelo
Caddy de produção. A documentação permanece desabilitada por padrão.

## Configuração do backend

Variáveis obrigatórias fora do perfil de teste:

| Variável | Finalidade |
|---|---|
| `DB_URL` | URL JDBC do PostgreSQL |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `JWT_SECRET` | Chave Base64 com no mínimo 32 bytes |

Para executar diretamente pela IDE, copie `backend-api/.env.example` para
`backend-api/.env` e preencha os valores. A integração `springboot4-dotenv`
carrega esse arquivo automaticamente; variáveis reais do sistema continuam
tendo precedência. A URL JDBC deve conter apenas host, porta e banco: usuário e
senha permanecem em `DB_USER` e `DB_PASSWORD`.

O cadastro público de usuários não existe. Em uma instalação vazia, defina temporariamente `ADMIN_BOOTSTRAP_USERNAME` e `ADMIN_BOOTSTRAP_PASSWORD`. A conta é criada somente quando a tabela `usuarios` está vazia. Depois do primeiro início, remova as duas variáveis.

Gere o segredo JWT com:

```bash
openssl rand -base64 64
```

## Banco e migrations

O Hibernate apenas valida o schema. Toda alteração estrutural deve ser criada como migration em `backend-api/src/main/resources/db/migration`.

A migration inicial foi preparada tanto para banco vazio quanto para o banco legado criado pelo Hibernate. Em um banco existente sem histórico do Flyway, ele cria uma baseline na versão `0` e executa a migration `V1` de forma idempotente.

Antes do primeiro deploy com Flyway:

1. Gere e valide um backup do banco atual.
2. Suba uma cópia temporária do banco.
3. Inicie a nova API apontando para a cópia.
4. Confira o health check e os totais de produtos, vendas e despesas.
5. Somente então execute sobre o banco definitivo.

## Produção

Consulte [docs/DEPLOY_LIGHTSAIL.md](docs/DEPLOY_LIGHTSAIL.md) para provisionamento e [docs/MIGRATION_CHECKLIST.md](docs/MIGRATION_CHECKLIST.md) para a troca do ambiente atual.

Fluxo resumido:

```bash
cp .env.example .env
# Preencha os valores sem versionar o arquivo
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 backend
```

O frontend e a API são publicados no mesmo domínio. O PostgreSQL não possui porta pública.

## Regras importantes do domínio

- Vendas não são apagadas: são canceladas e permanecem no histórico.
- O estoque é devolvido somente uma vez no cancelamento.
- Produtos, clientes, categorias e despesas são inativados.
- Produtos usados em vendas continuam acessíveis no histórico.
- Categorias com produtos ativos não podem ser inativadas.
- Parcelas sempre preservam o valor total exato.
- Vendas canceladas não entram no dashboard.
- Toda alteração de saldo gera uma movimentação de estoque na mesma transação.
- O histórico de estoque pode ser consultado em `GET /api/produtos/{id}/movimentacoes`.
- Ajustes usam `POST /api/produtos/{id}/ajustes-estoque` e exigem motivo.
- Cancelamentos usam `POST /api/vendas/{id}/cancelamento` e exigem motivo.

## Backup

O script `ops/backup.sh` gera um dump PostgreSQL no formato custom. Ele deve ser executado por cron e os arquivos devem ser copiados para armazenamento externo, como S3. Backup armazenado somente na mesma VPS não protege contra perda da instância.

Exemplo de cron diário às 03:15:

```cron
15 3 * * * cd /opt/anna-erp && set -a && . ./.env && set +a && ./ops/backup.sh >> /var/log/anna-erp-backup.log 2>&1
```

Teste a restauração regularmente em um banco separado:

```bash
createdb anna_erp_restore_test
pg_restore --no-owner --dbname anna_erp_restore_test /caminho/backup.dump
```

## Segurança

- Nunca versione `.env`, dumps ou chaves privadas.
- Rotacione qualquer credencial que já tenha aparecido no histórico Git.
- Exponha apenas as portas 22, 80 e 443 na Lightsail.
- Restrinja SSH por IP quando possível e use somente chave pública.
- Remova as variáveis de bootstrap após criar o primeiro administrador.
- Execute `npm audit` e `./mvnw test` antes de cada deploy.

Consulte [docs/SECURITY.md](docs/SECURITY.md) para a exceção temporária e revisável registrada na auditoria do React Router.
