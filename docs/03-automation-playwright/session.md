# Session StorageState

> **Path:** `src/automation/beefor/beeforSession.ts`
> **Responsabilidade em uma frase:** Ler e gravar `storageState` Playwright criptografado.

## Responsabilidade
Persistir cookies/localStorage do Beefor em `userData/beefor-session.json`, usando `safeStore` do main.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `loadStorageStateIfExists` | function | `(filePath) => Promise<unknown | undefined>` | Le arquivo, decifra/parseia JSON, retorna state ou undefined. |
| `persistStorageState` | function | `(context,filePath) => Promise<void>` | Chama `context.storageState()`, criptografa e grava. |

## Fluxo Interno
```ascii
load
  -> fs.readFile(filePath)
  -> decryptSessionBuffer
  -> JSON.parse
persist
  -> context.storageState()
  -> JSON.stringify
  -> encryptSessionString
  -> fs.writeFile
```

## Erros e Edge Cases
- `ENOENT` em load e esperado e retorna `undefined` sem warning.
- Outros erros de load logam warning e retornam undefined.
- Erros de persist logam error e nao propagam.

## Side Effects
Le/escreve arquivo de sessao.

## Dependencias
- Internas: [`safeStore.ts`](../../src/main/safeStore.ts), [`logger.ts`](../../src/main/logger.ts).
- Externas: `fs/promises`, `playwright` type `BrowserContext`.

## Consumidores
`BeeforClient`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Falha em persist nao quebra login; usuario pode relogar na proxima execucao.
