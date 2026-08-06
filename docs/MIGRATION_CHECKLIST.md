# Checklist de migração

## Antes da janela

- [ ] Rotacionar senha do banco e segredo JWT que possam ter passado pelo Git.
- [ ] Reservar IP estático na Lightsail.
- [ ] Configurar DNS.
- [ ] Instalar e validar Docker Compose.
- [ ] Criar `.env` de produção com permissão `600`.
- [ ] Fazer backup completo do Neon.
- [ ] Restaurar esse backup em um PostgreSQL temporário.
- [ ] Executar a nova API contra a cópia e validar Flyway.
- [ ] Registrar contagens e totais do ambiente atual.

Consultas úteis antes e depois:

```sql
SELECT count(*) FROM produtos;
SELECT count(*) FROM vendas;
SELECT count(*) FROM itens_venda;
SELECT count(*) FROM despesas;
SELECT coalesce(sum(valor_total), 0) FROM vendas WHERE coalesce(status, 'ATIVA') = 'ATIVA';
SELECT coalesce(sum(valor), 0) FROM despesas WHERE ativo = true;
```

## Durante a janela

- [ ] Impedir novos lançamentos no sistema antigo.
- [ ] Gerar dump final do Neon.
- [ ] Restaurar o dump no PostgreSQL da VPS.
- [ ] Subir o backend e aguardar as migrations.
- [ ] Conferir logs e health check.
- [ ] Comparar contagens e totais.
- [ ] Testar login, venda, cancelamento, despesa e dashboard.
- [ ] Apontar o domínio para o novo ambiente, se ainda não estiver apontado.

## Depois da troca

- [ ] Manter Neon/Render/Vercel disponíveis, mas sem escrita, durante o período de rollback.
- [ ] Confirmar o primeiro backup automático da VPS.
- [ ] Copiar o backup para armazenamento externo.
- [ ] Monitorar logs, disco e memória nas primeiras 24 horas.
- [ ] Remover variáveis de bootstrap administrativo.
- [ ] Encerrar os serviços antigos somente após validação e backup final.

## Critério de rollback

Retorne temporariamente ao ambiente antigo se houver divergência de dados, falha de migration, indisponibilidade persistente ou erro nos fluxos de venda/estoque. Preserve o banco da VPS para investigação; não tente corrigir dados diretamente durante a janela.
