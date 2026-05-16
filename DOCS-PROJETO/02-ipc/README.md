# IPC

> **Path:** `src/shared/ipc/channels.ts`, `src/main/ipc`, `src/main/preload.ts`, `src/renderer/services/ipc`
> **Responsabilidade em uma frase:** Definir contrato entre renderer sandboxed e main process.

## Responsabilidade
IPC e a unica ponte renderer -> main. Canais sao constantes em `shared`, o preload expoe `window.beefor`, clients renderer tipam chamadas por dominio, handlers main validam payloads com Zod quando ha entrada dinamica.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `IPC` | const | `Record<string,string>` | 54 canais/eventos em [`channels.ts`](../../src/shared/ipc/channels.ts). |
| `IpcChannel` | type | `(typeof IPC)[keyof typeof IPC]` | Union de valores de canal. |
| `registerIpcHandlers` | function | `(getWindow) => void` | Registra 11 dominios de handlers. |
| `defineHandler` | function | `(options) => void` | Wrapper para `ipcMain.handle`. |
| `defineEventHandler` | function | `(options) => void` | Wrapper para `ipcMain.on`. |
| `validate` | function | `(schema,payload) => ValidationOutcome` | Zod short-circuit com `fail('Payload invalido')`. |

## Fluxo Interno
```ascii
React feature/page
  -> useIpc().domain.method()
  -> renderer/services/ipc/*.client.ts
  -> window.beefor.method()
  -> preload ipcRenderer.invoke/send/on
  -> ipcMain.handle/on via defineHandler/defineEventHandler
  -> service/action
  -> ActionResult<T> ou valor direto
```

## Erros e Edge Cases
- Schema invalido retorna `ActionResult` com erro generico `Payload invalido` e loga ate 3 issues.
- Eventos `win:*` e `tray:setLunchActive` usam `send/on`, nao `invoke/handle`.
- `evt:*` sao main -> renderer; nao possuem handler request/response.

## Side Effects
IPC, logs de validacao, chamadas a disco/rede/Playwright dependendo do handler.

## Dependencias
- Internas: [contrato.md](./contrato.md), [channels.md](./channels.md), [schemas.md](./schemas.md).
- Externas: `electron`, `zod`.

## Consumidores
Todas as paginas/features renderer e main services.

## Testes
`src/main/ipc/__tests__/defineHandler.test.ts`, `src/main/ipc/schemas.test.ts` e testes de eventos/hook no renderer.

## Observacoes / Dividas
A enum flat com 54 canais e uma divida tecnica ja citada em [../ARQUITETURA.md](../ARQUITETURA.md).
