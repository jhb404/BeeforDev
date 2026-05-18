# Fluxos End-to-End

> **Path:** `src/main/ipc/handlers/*`, `src/automation/beefor/actions/*`, `src/main/coin2u/*`, `src/renderer/pages/*`
> **Responsabilidade em uma frase:** Descrever os principais casos de uso atravessando renderer, IPC, main e sistemas externos.

## Responsabilidade
Este arquivo documenta o caminho feliz e os efeitos colaterais dos fluxos que um usuario executa pela UI ou pelo tray.

## API Publica
| Fluxo | Entrada renderer | Handler main | Execucao |
|---|---|---|---|
| Login Beefor | `sessionClient.login()` | `SESSION_LOGIN` | `performLogin`, `persistSession`, `emitStatus('connected')`. |
| Logout Beefor | `sessionClient.logout()` | `SESSION_LOGOUT` | `doLogout`, `clearSession`, `BeeforClient.close()`. |
| Fetch timesheet | `timesheetClient.fetch(year, month)` | `ACTION_FETCH_TIMESHEET` | `doFetchTimesheet`; API rapida com fallback DOM. |
| Lancar hora | `timesheetClient.lancarHora(entry)` | `ACTION_LANCAR_HORA` | `doLancarHora`; POST API rapida com fallback UI. |
| Auto lancamento | `timesheetClient.autoLancamento()` | `ACTION_AUTO_LANCAMENTO` | clica Auto lancamento no Beefor e envia `EVT_NOTIFY`. |
| Mood | `moodClient.select(mood)` | `ACTION_SELECT_MOOD` | `doSelectMood` com reconnect automatico. |
| KudoCard | `kudoClient.send(req)` | `ACTION_SEND_KUDO_CARD` | abre modal Beefor, seleciona card, destinatario e mensagem. |
| Team | `teamClient.fetchMembers()` | `ACTION_FETCH_TEAM_MEMBERS` | captura response `Pessoa/ListarTodas` disparada pela SPA Beefor. |
| Coin2U dashboard | `coin2uClient.getDashboard()` | `COIN2U_GET_DASHBOARD` | `coin2uAuth.ensureFresh` + GET dashboard. |
| Coin2U compra | `coin2uClient.buyItem(payload)` | `COIN2U_BUY_ITEM` | GET `BuyItem` com workaround para HTTP 500. |

## Fluxo Interno
### Login Beefor
```ascii
Settings salva credenciais -> keytar
Home/useBeefor chama login
SESSION_LOGIN
  -> emitStatus('loading')
  -> withPageLock
  -> getCredentials()
  -> BeeforClient.getPage()
  -> performLogin(page, creds)
  -> persistSession(userData/beefor-session.json)
  -> emitStatus('connected')
```

### Lancamento de hora
```ascii
Home.lancar(idx)
  -> timesheetClient.lancarHora(entry)
  -> IPC ACTION_LANCAR_HORA + timesheetEntrySchema
  -> runBeeforAction
  -> ensureSessionForAction
  -> withPageLock
  -> doLancarHora
      -> doLancarHoraViaApi
      -> fallback UI se API falhar
```

### Coin2U transferencia
```ascii
Coin2uSendTab
  -> coin2uClient.transfer
  -> COIN2U_TRANSFER + coin2uTransferSchema
  -> loadSettings() para fallback userId
  -> transferCoin2uCoins
  -> coin2uAuthedPost('/VentronCoins/TransferCoins')
  -> retry em 401/302/403 se sessao nao for fresca
```

## Erros e Edge Cases
- Login Beefor sem credenciais retorna erro via `defineHandler` e status `error`.
- Kudo search ignora query com menos de 2 caracteres.
- Team depende de a SPA Beefor disparar request com `x-encryption-key`; por isso captura response em vez de montar HTTP manual.
- Coin2U compra trata HTTP 500 como sucesso por TODO existente no codigo.

## Side Effects
Keytar, `userData/beefor-session.json`, `userData/coin2u-session.json`, `beefor-settings.json`, localStorage de UI/gamification/cache, notificacoes nativas e eventos `evt:*`.

## Dependencias
- Internas: [../02-ipc/channels.md](../02-ipc/channels.md), [../03-automation-playwright/actions/README.md](../03-automation-playwright/actions/README.md), [../04-coin2u/endpoints.md](../04-coin2u/endpoints.md).
- Externas: Beefor Web/API, Coin2U Web/API.

## Consumidores
Home, Settings, TopBar, tray actions e scheduler.

## Testes
Fluxos completos com Electron/Playwright nao possuem suite E2E local. Hooks e utilitarios tem testes unitarios parciais.

## Observacoes / Dividas
- Punch automatico hoje dispara notificacao; nao ha acao de bater ponto real no scheduler.
- Team HTTP puro nao foi implementado porque o backend exige corpo cifrado gerado pela SPA Beefor.
