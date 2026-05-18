# Beefor Session

> **Path:** `src/automation/beefor/beeforSession.ts`, `src/main/sessionStore.ts`, `src/main/safeStore.ts`
> **Responsabilidade em uma frase:** Persistir storageState Playwright da sessao Beefor.

## Responsabilidade
Armazena cookies/localStorage do Beefor para reutilizar login entre execucoes.

## API Publica
| Item | Valor |
|---|---|
| Arquivo | `app.getPath('userData')/beefor-session.json` |
| Nome constante | `SESSION_FILE` |
| Formato plaintext | JSON Playwright storageState |
| Formato atual | Buffer `BFRENC1\0` + safeStorage encrypted blob |
| Owner write | `persistStorageState` via `BeeforClient.persistSession` |
| Owner clear | `clearSession` |

## Fluxo Interno
Login bem-sucedido chama `client.persistSession(sessionPath())`; `BeeforClient.getPage(sessionPath())` tenta carregar state.

## Erros e Edge Cases
- Arquivo inexistente apenas retorna undefined.
- Blob plaintext legado e aceito.
- Persist error nao propaga.

## Side Effects
Disco em userData.

## Dependencias
safeStore, Electron app path, Playwright context.

## Consumidores
Session manager/handler.

## Testes
Sem teste.

## Observacoes / Dividas
Sessoes persistidas contem tokens vivos; risco documentado em [../SEGURANCA.md](../SEGURANCA.md).
