# Checklist de migração

## Último ensaio registrado

- Data: 2026-08-06 (America/Recife).
- Origem: dump lógico somente leitura do banco Neon de produção.
- Destino: PostgreSQL 17 temporário e isolado.
- Flyway: baseline 0 e migrations V1, V2 e V3 validadas com sucesso.
- Hibernate: schema validado e aplicação iniciada com sucesso.
- Integridade: contagens, unidades e valor de estoque, total histórico de vendas
  e total histórico de despesas permaneceram idênticos antes e depois.
- Limpeza: containers, rede e arquivos temporários removidos automaticamente.
- Resultado: aprovado para o próximo passo do processo de publicação.

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

O ensaio pode ser automatizado sem escrever na origem. Exporte a URL PostgreSQL
da cópia/origem apenas na sessão atual e execute:

```bash
export SOURCE_DATABASE_URL='postgresql://...'
./ops/rehearse-migrations.sh
unset SOURCE_DATABASE_URL
```

Quando a URL não contém credenciais, também podem ser usadas
`SOURCE_DATABASE_USER` e `SOURCE_DATABASE_PASSWORD`. Não registre seus valores
no terminal, documentação ou Git.

O script gera um dump lógico, restaura em um container temporário, executa a API
atual com Flyway e compara automaticamente contagens, unidades em estoque,
valor do estoque, total histórico de vendas e total histórico de despesas. Ao
final, remove todos os recursos temporários.

## Ordem segura para atualizar Render e Vercel

A versão de transição do backend aceita tanto o contrato novo quanto o cliente
legado. Isso evita perda funcional enquanto o cache da Vercel ou uma aba antiga
ainda estiver usando o frontend anterior.

1. Fazer o ensaio das migrations em uma cópia recente do Neon.
2. Fazer backup restaurável imediatamente antes da atualização.
3. Publicar primeiro o backend de transição no Render.
4. Validar login, edição de produto, ajuste de estoque e cancelamento.
5. Publicar o frontend novo na Vercel.
6. Verificar nos logs se ainda ocorre `Ajuste de estoque pelo contrato legado`.
7. Remover os contratos legados somente em uma versão posterior, depois de um
   período sem ocorrências e com confirmação de que abas antigas foram atualizadas.

Durante a transição, ajustes enviados pelo frontend antigo ficam registrados com
o motivo `Ajuste via cliente legado`, e cancelamentos antigos com
`Cancelamento via cliente legado`.

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
