# Keytar Entries

> **Path:** `src/main/secureStorage.ts`, `src/main/coin2u/auth.ts`, `src/shared/constants.ts`
> **Responsabilidade em uma frase:** Documentar entradas no keychain do OS.

## Responsabilidade
Credenciais sensiveis nao sao gravadas em JSON do app; ficam no backend nativo via keytar.

## API Publica
| Service | Account | Conteudo | Owner |
|---|---|---|---|
| `beefor-dev` | `beefor-email` | email Beefor | `saveCredentials/getCredentials/clearCredentials` |
| `beefor-dev` | `beefor-password` | senha Beefor | `saveCredentials/getCredentials/clearCredentials` |
| `beefor-dev` | `coin2u-email` | email Coin2U | `saveCoin2uCredentials/getCoin2uCredentials/clearCoin2uCredentials` |
| `beefor-dev` | `coin2u-password` | senha Coin2U | `saveCoin2uCredentials/getCoin2uCredentials/clearCoin2uCredentials` |

## Fluxo Interno
Settings page envia credenciais via IPC; main valida payload com Zod; handlers chamam keytar set/delete/get.

## Erros e Edge Cases
- Leituras retornam `null` se email ou senha faltar.
- Saves sao duas chamadas separadas; nao ha transacao atomica.

## Side Effects
Credential Manager/Keychain/libsecret do OS.

## Dependencias
`keytar`, constants.

## Consumidores
Login Beefor e login Coin2U.

## Testes
Sem teste por depender de OS keychain.

## Observacoes / Dividas
Arquivo `Fluxo-Salvamento-Credenciais.md` citado no prompt nao existe no repo lido.
