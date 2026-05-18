# Action Team

> **Path:** `src/automation/beefor/actions/team.ts`
> **Responsabilidade em uma frase:** Capturar lista de pessoas do time disparada pela SPA Beefor.

## Responsabilidade
O backend de pessoas exige headers/body cifrados pela SPA. A action navega rotas conhecidas e captura a response `POST /api/Pessoa/ListarTodas` gerada pelo proprio Beefor.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `doFetchTeamMembers` | function | `(page) => Promise<unknown[]>` | Retorna array capturado ou lanca erro se nenhuma rota disparar request. |

## Fluxo Interno
Garante origem Beefor, tenta `/pessoas`, `/equipe`, `/equipes`, `/people`; para cada rota arma `waitForResponse` com regex e metodo POST, navega e parseia JSON procurando array direto ou chaves `data`, `pessoas`, `lista`, `items`.

## Erros e Edge Cases
- Response nao-ok loga warning e tenta proxima rota.
- Arrays vazios em alguma rota retornam `[]` se nenhuma rota tiver dados.
- Sem captura lanca mensagem pedindo abrir `/pessoas` manualmente.

## Side Effects
Navegacao Beefor e captura de response.

## Dependencias
`BEEFOR_URL`, `NAV_TIMEOUT_MS`, logger.

## Consumidores
Team handler e hooks/componentes team.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
HTTP puro de team continua bloqueado pelo contrato cifrado do backend Beefor.
