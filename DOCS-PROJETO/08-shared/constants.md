# Constants

> **Path:** `src/shared/constants.ts`
> **Responsabilidade em uma frase:** Centralizar URLs, nomes keytar, arquivos e timeouts compartilhados.

## Responsabilidade
Constantes alimentam main, automation e Coin2U.

## API Publica
| Constante | Valor/Descricao |
|---|---|
| `BEEFOR_URL` | `https://app.beefor.io` |
| `BEEFOR_API_BASE` | `https://apiteams.goobee.com.br` |
| `BEEFOR_TIMESHEET_API` | `/timesheet-beefor/api/apontamento` na API base |
| `BEEFOR_KUDO_API` | `/api/KudoCard` |
| `BEEFOR_PESSOA_API` | `/api/Pessoa` |
| `BEEFOR_HOME_API` | `/api/Home` |
| `BEEFOR_LOGIN_URL` | `${BEEFOR_URL}/login` |
| `BEEFOR_TIMESHEET_URL` | `${BEEFOR_URL}/time-sheet-beefor/lancamentos` |
| `KEYTAR_SERVICE` | `beefor-dev` |
| `KEYTAR_ACCOUNT_*` | email/senha Beefor e Coin2U |
| `COIN2U_URL` | `https://app.coin2u.com.br` |
| `COIN2U_LOGIN_URL` | `/Login/Authenticate` |
| `COIN2U_DASHBOARD_URL` | `/VentronCoins/GetDashboard` |
| `SESSION_FILE` | `beefor-session.json` |
| `SETTINGS_FILE` | `beefor-settings.json` |
| `DEFAULT_TIMEOUT_MS` | `30000` |
| `NAV_TIMEOUT_MS` | `45000` |

## Fluxo Interno
Usado por actions Playwright, handlers, Coin2U auth/endpoints, sessionStore e secureStorage.

## Erros e Edge Cases
- Sem ambiente dev/staging; todos endpoints apontam producao.

## Side Effects
Nenhum.

## Dependencias
Nenhuma.

## Consumidores
Todo o app.

## Testes
Nao ha teste especifico.

## Observacoes / Dividas
Multi-env ausente e divida tecnica em [../12-debito-tecnico/README.md](../12-debito-tecnico/README.md).
