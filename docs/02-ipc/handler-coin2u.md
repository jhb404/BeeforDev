# Handler Coin2U

> **Path:** $path
> **Responsabilidade em uma frase:** Orquestrar credenciais, login e endpoints Coin2U.

## Responsabilidade
Este handler registra canais do dominio e delega trabalho para services, storage, Playwright ou HTTP conforme necessario.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| egisterCoin2UHandlers | function | (...) => void | Registra os canais do dominio com defineHandler ou defineEventHandler. |

## Fluxo Interno
- Registra listener `onCoin2uLogin` para persistir `coin2uUserId`, `coin2uInfo` e orgs em settings.
- Credenciais usam keytar; dashboard/log/shop/buy/transfer/verify delegam para `src/main/coin2u`.
- Buy/transfer validam schemas Zod.

## Erros e Edge Cases
- Excecoes dentro de un sao capturadas por defineHandler e retornam ail(err) quando o canal e invoke.
- Payloads dinamicos usam schemas listados em [schemas.md](./schemas.md).

## Side Effects
IPC, logs e side effects do service/action chamado.

## Dependencias
Ver imports no arquivo fonte citado no topo.

## Consumidores
Preload em [src/main/preload.ts](../../src/main/preload.ts) e clients em [src/renderer/services/ipc](../../src/renderer/services/ipc).

## Testes
Cobertura direta de handlers e parcial; defineHandler e schemas possuem testes.

## Observacoes / Dividas
Detalhes de canais tambem estao em [channels.md](./channels.md).
