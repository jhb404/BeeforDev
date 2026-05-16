# Handler System

> **Path:** $path
> **Responsabilidade em uma frase:** Admin, relaunch, notificacoes, alertas, assets e tray runtime.

## Responsabilidade
Este handler registra canais do dominio e delega trabalho para services, storage, Playwright ou HTTP conforme necessario.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| egisterSystemHandlers | function | (...) => void | Registra os canais do dominio com defineHandler ou defineEventHandler. |

## Fluxo Interno
- Admin/relaunch usam `adminCheck` e `app.relaunch`.
- `NOTIFY_TEST` dispara scheduler notification.
- `ACTION_GET_TODAY_ALERTS` retorna alertas do scheduler.
- Assets usam `getBuildAssetsDir` e `fs.readFile` com filename validado.
- `TRAY_SET_LUNCH_ACTIVE` e event handler booleano.
- `ACTION_NOTIFY` chama `notifyWindows`.

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
