# Coin2U

> **Path:** `src/main/coin2u/`
> **Responsabilidade em uma frase:** Integrar autenticação, sessão persistida e endpoints HTTP Coin2U.

## Responsabilidade
Coin2U e independente da sessao Beefor. Usa credenciais proprias no keytar, sessão criptografada em disco, token `TokenApi`, cookies em `CookieJar` e HTTP direto via `fetch` no main.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `initCoin2u` | function | `() => Promise<void>` | Carrega sessao persistida. |
| `coin2uAuth` | singleton | `Coin2uAuthManager` | Gerencia login/token/cookies. |
| `coin2uAuthedGet/Post` | functions | `(url[,payload]) => Promise<Response>` | Requests com headers/cookies/auth e retry auth. |
| endpoint funcs | functions | `get/buy/transfer/fetch` | Operacoes Coin2U de produto. |

## Fluxo Interno
```ascii
handler Coin2U
  -> loadSettings fallback userId/info
  -> endpoint function
  -> coin2uAuth.loadFromDisk
  -> coin2uAuth.ensureFresh
  -> coin2uAuthedGet/Post
  -> parser/normalizacao
```

## Erros e Edge Cases
- Login exige `Info.UserId` e `Info.TokenApi`.
- Sessao stale apos 25min força login.
- HTTP 401/302/403 tenta relogin se token nao for muito fresco.

## Side Effects
Keytar, `coin2u-session.json` criptografado, settings `coin2uUserId/info/orgs`, rede Coin2U.

## Dependencias
- Internas: [../09-armazenamento/coin2u-session.md](../09-armazenamento/coin2u-session.md), [../02-ipc/handler-coin2u.md](../02-ipc/handler-coin2u.md).
- Externas: `keytar`, `electron.safeStorage` via safeStore.

## Consumidores
Coin2U IPC handlers e renderer feature `coin2u`.

## Testes
Feature renderer possui testes de format/toast; main Coin2U sem testes.

## Observacoes / Dividas
`buyCoin2uItem` trata HTTP 500 como sucesso por TODO no codigo.
