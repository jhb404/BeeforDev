# Logger

> **Path:** `src/main/logger.ts`
> **Responsabilidade em uma frase:** Centralizar logging com redaction de PII antes de disco/console.

## Responsabilidade
O logger usa `electron-log/main`, define niveis e mascara emails, chaves sensiveis e Bearer tokens antes de chamar transporte de arquivo/console.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `bindLoggerWindow` | function | `(win) => void` | No-op mantido por compatibilidade. |
| `logger.info` | method | `(message) => void` | Log nivel info com redaction. |
| `logger.warn` | method | `(message) => void` | Log nivel warn com redaction. |
| `logger.error` | method | `(message, err?) => void` | Log erro com `formatErr` e redaction. |
| `logger.debug` | method | `(message) => void` | Log debug com redaction. |

## Fluxo Interno
`redact()` aplica regex para email, pares `password/senha/token/tokenApi/apitoken/authorization/secret` e `Bearer` longo. `formatErr` usa `Error.message`, `JSON.stringify` ou `String`.

## Erros e Edge Cases
- `bindLoggerWindow` nao transmite mais logs ao renderer.
- Objetos nao serializaveis caem para `String(err)`.

## Side Effects
Escreve via `electron-log`; logs ficam conforme configuracao da biblioteca em userData.

## Dependencias
- Externas: `electron-log/main`, type `BrowserWindow`.

## Consumidores
Main, automation, Coin2U, scheduler e handlers.

## Testes
Nao ha teste para redaction.

## Observacoes / Dividas
Mover logger para `shared` ou injetar nas actions reduziria acoplamento automation -> main.
