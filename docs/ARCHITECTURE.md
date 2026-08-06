# Fundamentos de arquitetura

## Direção

O ERP é um monólito modular com frontend React, API Spring Boot e PostgreSQL.
Essa forma é intencional: atende o volume e a equipe atuais com menos pontos de
falha, preservando separação clara entre HTTP, aplicação, domínio e persistência.

## Regras de mudança

- Alterações de schema entram exclusivamente por migrations Flyway aditivas.
- Controllers validam e traduzem HTTP; regras de negócio ficam nos services.
- Entidades JPA não são retornadas diretamente pela API.
- Operações que alteram mais de um agregado são transacionais.
- Erros HTTP seguem `ApiErrorResponse`, com `code`, `message`, `path` e `fields`.
- Listagens potencialmente crescentes são paginadas.
- Uma feature só está pronta com backend, frontend, migration quando aplicável e testes.

## Invariantes críticas

- Estoque nunca pode ficar negativo.
- Cada produto aparece no máximo uma vez por venda.
- Desconto não pode superar o subtotal da venda.
- Cancelamento é idempotente e devolve o estoque uma única vez.
- Vendas são canceladas, não removidas.
- Cadastros usados no histórico são inativados, não removidos.
- Parcelamento preserva exatamente o valor total da despesa.
- Toda alteração de saldo de produto gera uma movimentação na mesma transação.

## Compatibilidade com dados legados

Constraints adicionadas sobre tabelas existentes usam `NOT VALID` quando dados
anteriores ainda não foram auditados. Elas protegem novas gravações sem bloquear
o deploy. A validação retroativa será feita em uma migration própria somente
depois do ensaio com uma cópia atual do Neon.

## Contratos e segurança

A API é stateless e autenticada por JWT. Apenas login, health check e documentação
local são públicos no Spring Security. O proxy de produção publica somente `/api/*`
e `/actuator/health`, portanto Swagger e o documento OpenAPI permanecem internos.
