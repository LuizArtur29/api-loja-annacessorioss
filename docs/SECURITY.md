# Notas de segurança

## Auditoria do frontend

Em 5 de agosto de 2026, `npm audit --omit=dev` informa dois achados de severidade alta no `react-router` 7.18.2 relacionados ao modo RSC/Server Actions. Essa é a versão mais recente publicada, e o ERP usa somente o roteamento declarativo no navegador (`BrowserRouter`, `Routes` e `Route`): não há RSC, SSR, loaders, actions ou endpoints do React Router no servidor.

Por isso, o código afetado não é alcançável na arquitetura atual. O downgrade automático sugerido pelo npm para 7.11.0 não foi aplicado porque reintroduz diversos avisos, incluindo redirecionamento aberto e XSS, alguns deles relevantes ao navegador.

Esta é uma exceção temporária e documentada, não um alerta ignorado permanentemente. A cada atualização:

1. Execute `npm audit --omit=dev`.
2. Atualize o React Router assim que uma versão corrigida for publicada.
3. Reavalie imediatamente esta decisão se o projeto passar a usar SSR, RSC, loaders, actions ou APIs de servidor do React Router.

O CI falha em vulnerabilidades críticas e continua exibindo os avisos de severidade alta para acompanhamento.
