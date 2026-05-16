# Secure Storage

> **Path:** `src/main/secureStorage.ts`, `src/main/safeStore.ts`
> **Responsabilidade em uma frase:** Persistir credenciais no keychain do OS e criptografar sessoes em disco.

## Responsabilidade
Credenciais Beefor ficam em keytar; blobs de sessao Beefor/Coin2U usam `safeStorage` com header magico. A analise de ameacas completa fica em [../SEGURANCA.md](../SEGURANCA.md).

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `saveCredentials` | function | `(creds) => Promise<void>` | Salva email/senha Beefor no keytar. |
| `getCredentials` | function | `() => Promise<Credentials | null>` | Recupera par completo ou `null`. |
| `clearCredentials` | function | `() => Promise<void>` | Remove entradas Beefor do keytar. |
| `encryptSessionString` | function | `(plaintext) => Buffer` | Criptografa com `safeStorage` e prefixa `BFRENC1\0`. |
| `decryptSessionBuffer` | function | `(buf) => string` | Decifra blob com magic ou aceita plaintext legado. |

## Fluxo Interno
```ascii
Credenciais Beefor
  -> keytar.setPassword(beefor-dev, beefor-email, email)
  -> keytar.setPassword(beefor-dev, beefor-password, password)

Sessao
  -> JSON.stringify(storage/session)
  -> encryptSessionString
  -> fs.writeFile(userData/*.json, Buffer)
```

## Erros e Edge Cases
- `safeStorage.isEncryptionAvailable()` falso -> escreve plaintext fallback e loga warning.
- Blob criptografado em host sem encryption -> `decryptSessionBuffer` lanca erro.
- Arquivo sem magic e tratado como legado plaintext.

## Side Effects
Keychain do OS, arquivos de sessao em `userData`, logs redigidos.

## Dependencias
- Internas: [`shared/constants.ts`](../../src/shared/constants.ts), [`logger.ts`](../../src/main/logger.ts).
- Externas: `keytar`, `electron.safeStorage`.

## Consumidores
Credentials handlers, session manager, Beefor storageState e Coin2U auth.

## Testes
Nao ha teste automatizado para keytar/safeStorage.

## Observacoes / Dividas
Writes de email e senha sao duas chamadas separadas; falha intermediaria pode deixar uma entrada sem a outra, conforme [../SEGURANCA.md](../SEGURANCA.md).
