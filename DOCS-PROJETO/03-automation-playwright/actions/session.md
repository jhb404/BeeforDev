# Action Session

> **Path:** `src/automation/beefor/actions/session.ts`
> **Responsabilidade em uma frase:** Login, verificacao e logout Beefor no browser Playwright.

## Responsabilidade
Executa fluxo de login do Beefor com fallback para formulario single-step/two-step, detecta sessao por indicadores de UI e tenta logout por menu.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `performLogin` | function | `(page, creds) => Promise<void>` | Navega login, preenche email/senha, submete e confirma. |
| `isLoggedIn` | function | `(page, timeoutMs?) => Promise<boolean>` | Procura indicadores logged-in. |
| `doVerifySession` | function | `(page) => Promise<boolean>` | Vai para `BEEFOR_URL` e chama `isLoggedIn`. |
| `doLogout` | function | `(page) => Promise<void>` | Tenta abrir menu e clicar logout; falha nao impede limpeza local. |

## Fluxo Interno
`performLogin` vai para `BEEFOR_LOGIN_URL`, retorna cedo se ja logado, preenche email, tenta botao avancar, preenche senha, clica submit e espera `waitForLoggedIn`.

## Erros e Edge Cases
- Falha de confirmacao lanca mensagem orientando credenciais/MFA/CAPTCHA/login manual.
- `doLogout` captura falha de UI e so loga warning.

## Side Effects
Navega Beefor, preenche formulario e pode invalidar sessao no site.

## Dependencias
Selectors login/app, helpers `firstVisible` e `clickByAnyText`, logger.

## Consumidores
Session manager e handler session.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Nao ha suporte explicito para MFA/CAPTCHA alem da mensagem de erro.
