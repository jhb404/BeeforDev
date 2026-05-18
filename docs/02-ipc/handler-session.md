# Handler Session

> **Path:** $path
> **Responsabilidade em uma frase:** Controlar login, logout, status e verificacao Beefor.

## Responsabilidade
Este handler registra canais do dominio e delega trabalho para services, storage, Playwright ou HTTP conforme necessario.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| egisterSessionHandlers | function | (...) => void | Registra os canais do dominio com defineHandler ou defineEventHandler. |

## Fluxo Interno
- `SESSION_STATUS` retorna status atual.
- `SESSION_LOGIN` emite loading, usa keytar, `performLogin`, persiste storageState e emite connected.
- `SESSION_LOGOUT` tenta logout UI, remove sessao, fecha client e emite disconnected.
- `SESSION_VERIFY` navega Beefor e retorna `connected` ou `expired`.

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
