# Action Kudo

> **Path:** `src/automation/beefor/actions/kudo.ts`
> **Responsabilidade em uma frase:** Buscar, listar, detalhar e enviar KudoCards no Beefor.

## Responsabilidade
Mistura HTTP via page context para listas/cache e automacao de modal para envio de KudoCard.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `warmKudoRecipientCache` | function | `(page) => Promise<void>` | Precarrega pessoas e times best-effort. |
| `doSearchKudoRecipient` | function | `(page,type,query) => Promise<Result[]>` | Filtra cache/lista por nome normalizado. |
| `doFetchKudoCounts` | function | `(page) => Promise<{enviados,recebidos}>` | GET counts por idPessoa. |
| `doFetchKudoLists` | function | `(page) => Promise<{enviados,recebidos}>` | GET listas. |
| `doFetchKudoDetail` | function | `(page,id) => Promise<any>` | GET detalhe por id. |
| `doSendKudoCard` | function | `(page,req) => Promise<SendKudoCardResult>` | Abre modal, seleciona card/destinatario/mensagem e envia. |

## Fluxo Interno
Envio: valida nome/mensagem, checa login, abre perfil do usuario, clica add, seleciona imagem por slug, radio pessoa/time, autocomplete, textarea e botao Enviar; espera response POST/PUT com URL contendo kudo.

## Erros e Edge Cases
- Query menor que 2 retorna `[]`.
- Cache de destinatarios expira em 30 minutos.
- Falta de autocomplete/card/radio/textarea gera erro especifico.
- Response >=400 no envio inclui trecho do body.

## Side Effects
Fetches Beefor autenticados, navegacao para perfil, DOM modal, cache em memoria.

## Dependencias
Selectors kudo, constants APIs, text utils, Playwright helpers, `isLoggedIn`.

## Consumidores
Kudo handlers, `useKudo*` hooks e tray open Kudo.

## Testes
Hooks renderer de Kudo nao possuem cobertura ampla; action sem teste.

## Observacoes / Dividas
Tipos de response de detail/list ainda sao parcialmente `any` no codigo.
