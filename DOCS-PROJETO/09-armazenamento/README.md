# Armazenamento

> **Path:** `src/main/sessionStore.ts`, `src/main/secureStorage.ts`, `src/main/safeStore.ts`, `src/main/coin2u/auth.ts`, renderer caches
> **Responsabilidade em uma frase:** Mapear dados persistidos, local, formato, criptografia e owner.

## Responsabilidade
O app persiste credenciais no keychain, sessoes em arquivos criptografados, settings em JSON plano e estado UI/gamification/cache em localStorage.

## API Publica
| Dado | Local | Formato | Criptografia | Owner |
|---|---|---|---|---|
| Credenciais Beefor | keytar service `beefor-dev` accounts `beefor-email/password` | duas strings | OS keychain | main secureStorage |
| Credenciais Coin2U | keytar accounts `coin2u-email/password` | duas strings | OS keychain | main coin2u/auth |
| Sessao Beefor | `userData/beefor-session.json` | Playwright storageState JSON em Buffer | `safeStorage` com magic `BFRENC1\0`; aceita legado plaintext | automation/beeforSession |
| Settings | `userData/beefor-settings.json` | JSON plano | nao | main sessionStore |
| Sessao Coin2U | `userData/coin2u-session.json` | JSON session snapshot | `safeStorage` | coin2u/auth |
| Theme mode | localStorage `beefor-theme` | string | nao | ThemeProvider |
| Gamification | localStorage `beefor-gamification-v1` | JSON | nao | gamification/store |
| Redeemed codes | localStorage `beefor-redeemed-codes-v1` | JSON | nao | unlockCodes |
| Team cache | localStorage `beefor-team-members`, `beefor-team-birthdays` | JSON | nao | teamCache |
| Coin2U cache | localStorage `beefor-coin2u-cache-v1` | JSON | nao | coin2uCache |
| Atividades split | localStorage `beefor:ativ-split-ratio` | number/string | nao | useResizeSplit |
| Patch journal | `patch-journal.md` resource/app path | markdown | nao | sessionStore read-only |

## Fluxo Interno
Credenciais nunca passam pelo renderer apos salvar exceto email mascarado. Sessoes sao gravadas por main/automation; settings sao lidas e mescladas com defaults.

## Erros e Edge Cases
- `safeStorage` indisponivel escreve plaintext fallback.
- `loadSettings` ignora erro e retorna defaults.
- `patchJournal` e omitido em `saveSettings`.

## Side Effects
Disco, keychain, localStorage.

## Dependencias
Electron app/safeStorage, keytar, fs.

## Consumidores
Todo o app.

## Testes
Sem testes de storage seguro.

## Observacoes / Dividas
`settings-json.md` documenta cada campo de `AppSettings`.
