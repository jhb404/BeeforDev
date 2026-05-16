# Coin2U Auth

> **Path:** `src/main/coin2u/auth.ts`
> **Responsabilidade em uma frase:** Gerenciar credenciais, login, token, cookies e sessão persistida Coin2U.

## Responsabilidade
`Coin2uAuthManager` guarda `userId`, `tokenApi`, `info`, cookies e `loggedAt`; deduplica logins concorrentes e persiste snapshot criptografado.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `coin2uAuth` | const | singleton | Manager de sessao. |
| `getCoin2uCredentials` | function | `() => Promise<{email,password}|null>` | Le keytar. |
| `saveCoin2uCredentials` | function | `(creds) => Promise<void>` | Salva keytar e limpa sessao. |
| `clearCoin2uCredentials` | function | `() => Promise<void>` | Remove keytar e arquivo de sessao. |
| `onCoin2uLogin` | function | `(fn) => () => void` | Registra listener de login. |
| `coin2uVerifyLogin` | function | `() => Promise<{userId,email}>` | Forca login e retorna identificacao. |

## Fluxo Interno
```ascii
login
  -> getCoin2uCredentials
  -> POST COIN2U_LOGIN_URL JSON { Email, Password, IsThereLoginError:false, ErrorMessage:'' }
  -> parse JSON
  -> valida IsThereLoginError, Info.UserId, Info.TokenApi
  -> seta apitoken/info no CookieJar
  -> persist encrypted coin2u-session.json
  -> chama listeners onLogin
```

## Erros e Edge Cases
- `loadFromDisk` roda uma vez por processo (`loadedFromDisk`).
- `isStale` retorna true sem token/userId ou idade >25min.
- `invalidate` zera token/loggedAt, mas mantem userId/info ate novo login.

## Side Effects
Keytar, arquivo `coin2u-session.json`, cookies em memoria, listeners que atualizam settings.

## Dependencias
- Internas: [`safeStore.ts`](../../src/main/safeStore.ts), [`cookieJar.ts`](../../src/main/coin2u/cookieJar.ts), constants.
- Externas: `electron.app`, `fs/promises`, `keytar`, `fetch`.

## Consumidores
`http.ts`, endpoints, handlers Coin2U.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Token e cookie `info` sao persistidos; seguranca detalhada em [../SEGURANCA.md](../SEGURANCA.md).
