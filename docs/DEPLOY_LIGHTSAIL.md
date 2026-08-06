# Deploy na AWS Lightsail

Esta configuração foi dimensionada para uma instância Linux com 2 vCPU e 2 GB de RAM, atendendo uma única usuária.

## 1. Preparação da instância

Use uma distribuição Ubuntu LTS. Na rede da Lightsail, libere somente:

- TCP 22, preferencialmente limitado ao IP administrativo.
- TCP 80.
- TCP/UDP 443.

Não libere a porta 5432.

Atualize o sistema, instale Docker Engine com o plugin Compose e configure atualizações de segurança automáticas. Crie entre 1 e 2 GB de swap para evitar encerramento abrupto durante uma atualização, sem tratar swap como memória normal.

## 2. DNS

Crie um registro `A` do domínio escolhido apontando para o IP estático da Lightsail. Aguarde a propagação antes de subir o Caddy; ele emitirá e renovará o certificado automaticamente.

## 3. Aplicação

Use `/opt/anna-erp` como diretório e mantenha o `.env` com permissão `600`.

```bash
cp .env.example .env
chmod 600 .env
docker compose build
docker compose up -d
```

Após a primeira instalação vazia, confirme o login e remova `ADMIN_BOOTSTRAP_USERNAME` e `ADMIN_BOOTSTRAP_PASSWORD` do `.env`. Reinicie apenas o backend:

```bash
docker compose up -d backend
```

## 4. Verificação

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose exec backend java -version
curl --fail https://SEU_DOMINIO/actuator/health
```

Somente o endpoint `/actuator/health` do Actuator é publicado pelo Caddy; os demais continuam internos.

Valide manualmente:

- Login.
- Listagem de produtos e clientes.
- Uma venda de teste e redução de estoque.
- Cancelamento da venda e devolução do estoque.
- Uma despesa parcelada.
- Dashboard do mês.

## 5. Backup

Crie `/var/backups/anna-erp`, restrinja suas permissões e agende `ops/backup.sh`. Copie os dumps para fora da instância usando uma ferramenta dedicada, como AWS CLI ou restic.

Uma política inicial razoável é:

- Dump diário por 14 dias.
- Cópia externa criptografada.
- Snapshot periódico da Lightsail.
- Teste mensal de restauração.

Snapshot não substitui dump lógico do PostgreSQL.

## 6. Atualização

Antes de atualizar:

```bash
./ops/backup.sh
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 backend
```

Nunca use `docker compose down -v` em produção: a opção `-v` remove o volume do banco.

## 7. Uso de memória

O Compose limita aproximadamente:

- Backend: 768 MB.
- PostgreSQL: 384 MB.
- Caddy: 128 MB.

O restante fica disponível para kernel, cache de disco e Docker. Builds podem usar mais memória do que a execução. Quando houver CI/CD, prefira construir as imagens fora da VPS e apenas baixá-las no servidor.

## 8. Observação e incidentes

Monitore no mínimo:

- Espaço em disco.
- Memória e swap.
- Estado dos containers.
- Validade do HTTPS.
- Sucesso do backup mais recente.
- Disponibilidade da tela de login.

Em falha de deploy, preserve o banco e retorne somente a imagem da aplicação. Não reverta migrations de maneira manual sem testar em uma cópia do banco.
