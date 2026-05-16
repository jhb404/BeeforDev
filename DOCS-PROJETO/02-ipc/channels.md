# Canais IPC

> **Path:** `src/shared/ipc/channels.ts`
> **Responsabilidade em uma frase:** Tabela completa dos 54 canais/eventos compartilhados entre main, preload e renderer.

## Responsabilidade
A tabela abaixo e a fonte de navegacao para request/response e eventos. `Handler` indica `ipcMain.handle/on` quando existe; `Evento` indica emissao/listener sem request-response.

## API Publica
| Constante | Canal | Direcao | Handler/Emissor | Client/Listener | Schema |
|---|---|---|---|---|---|
| `CREDS_SAVE` | `creds:save` | renderer -> main | `credentials.handlers.ts` | `session.client.ts` | `credentialsSchema` |
| `CREDS_GET` | `creds:get` | renderer -> main | `credentials.handlers.ts` | `session.client.ts` | nenhum |
| `CREDS_CLEAR` | `creds:clear` | renderer -> main | `credentials.handlers.ts` | `session.client.ts` | nenhum |
| `SETTINGS_GET` | `settings:get` | renderer -> main | `settings.handlers.ts` | `settings.client.ts` | nenhum |
| `SETTINGS_SET` | `settings:set` | renderer -> main | `settings.handlers.ts` | `settings.client.ts` | `settingsSchema` |
| `SESSION_STATUS` | `session:status` | renderer -> main | `session.handlers.ts` | `session.client.ts` | nenhum |
| `SESSION_LOGIN` | `session:login` | renderer -> main | `session.handlers.ts` | `session.client.ts` | nenhum |
| `SESSION_LOGOUT` | `session:logout` | renderer -> main | `session.handlers.ts` | `session.client.ts` | nenhum |
| `SESSION_VERIFY` | `session:verify` | renderer -> main | `session.handlers.ts` | `session.client.ts` | nenhum |
| `ACTION_AUTO_LANCAMENTO` | `action:autoLancamento` | renderer -> main | `timesheet.handlers.ts` | `timesheet.client.ts` | nenhum |
| `ACTION_SELECT_MOOD` | `action:selectMood` | renderer -> main | `mood.handlers.ts` | `mood.client.ts` | `moodSchema` |
| `ACTION_OPEN_BEEFOR` | `action:openBeefor` | renderer -> main | `timesheet.handlers.ts` | `timesheet.client.ts` | nenhum |
| `ACTION_LANCAR_HORA` | `action:lancarHora` | renderer -> main | `timesheet.handlers.ts` | `timesheet.client.ts` | `timesheetEntrySchema` |
| `ACTION_FETCH_TIMESHEET` | `action:fetchTimesheet` | renderer -> main | `timesheet.handlers.ts` | `timesheet.client.ts` | `fetchTimesheetArgsSchema` |
| `ACTION_GET_CURRENT_MOOD` | `action:getCurrentMood` | renderer -> main | `mood.handlers.ts` | `mood.client.ts` | nenhum |
| `ACTION_SEND_KUDO_CARD` | `action:sendKudoCard` | renderer -> main | `kudo.handlers.ts` | `kudo.client.ts` | `sendKudoCardSchema` |
| `ACTION_SEARCH_KUDO_RECIPIENT` | `action:searchKudoRecipient` | renderer -> main | `kudo.handlers.ts` | `kudo.client.ts` | `kudoSearchArgsSchema` |
| `ACTION_KUDO_COUNTS` | `action:kudoCounts` | renderer -> main | `kudo.handlers.ts` | `kudo.client.ts` | nenhum |
| `ACTION_KUDO_LISTS` | `action:kudoLists` | renderer -> main | `kudo.handlers.ts` | `kudo.client.ts` | nenhum |
| `ACTION_KUDO_DETAIL` | `action:kudoDetail` | renderer -> main | `kudo.handlers.ts` | `kudo.client.ts` | `kudoDetailIdSchema` |
| `ACTION_FETCH_TEAM_MEMBERS` | `action:fetchTeamMembers` | renderer -> main | `team.handlers.ts` | `team.client.ts` | nenhum |
| `ADMIN_STATUS` | `admin:status` | renderer -> main | `system.handlers.ts` | `system.client.ts` | nenhum |
| `ADMIN_RELAUNCH` | `admin:relaunch` | renderer -> main | `system.handlers.ts` | `system.client.ts` | nenhum |
| `APP_RELAUNCH` | `app:relaunch` | renderer -> main | `system.handlers.ts` | `system.client.ts` | nenhum |
| `NOTIFY_TEST` | `notify:test` | renderer -> main | `system.handlers.ts` | `system.client.ts` | `notifyTestKindSchema` |
| `ACTION_GET_TODAY_ALERTS` | `action:getTodayAlerts` | renderer -> main | `system.handlers.ts` | `system.client.ts` | nenhum |
| `ACTION_SNOOZE_ALERT` | `action:snoozeAlert` | reservado | sem handler | sem client | TODO(verify): constante sem uso no codigo lido. |
| `COIN2U_SAVE_CREDS` | `coin2u:saveCreds` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | `coin2uCredentialsSchema` |
| `COIN2U_GET_CREDS` | `coin2u:getCreds` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | nenhum |
| `COIN2U_CLEAR_CREDS` | `coin2u:clearCreds` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | nenhum |
| `COIN2U_GET_DASHBOARD` | `coin2u:getDashboard` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | nenhum |
| `COIN2U_GET_LOG` | `coin2u:getLog` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | nenhum |
| `COIN2U_GET_SHOP` | `coin2u:getShop` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | nenhum |
| `COIN2U_BUY_ITEM` | `coin2u:buyItem` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | `coin2uBuyItemSchema` |
| `COIN2U_TRANSFER` | `coin2u:transfer` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | `coin2uTransferSchema` |
| `COIN2U_VERIFY` | `coin2u:verify` | renderer -> main | `coin2u.handlers.ts` | `coin2u.client.ts` | nenhum |
| `WIN_MINIMIZE` | `win:minimize` | renderer -> main event | `window.handlers.ts` | `system.client.ts` | nenhum |
| `WIN_MAXIMIZE` | `win:maximize` | renderer -> main event | `window.handlers.ts` | `system.client.ts` | nenhum |
| `WIN_CLOSE` | `win:close` | renderer -> main event | `window.handlers.ts` | `system.client.ts` | nenhum |
| `APP_GET_ASSET_PATH` | `app:getAssetPath` | renderer -> main | `system.handlers.ts` | `system.client.ts` | nenhum |
| `APP_READ_ASSET` | `app:readAsset` | renderer -> main | `system.handlers.ts` | `system.client.ts` | `assetFileNameSchema` |
| `EVT_STATUS` | `evt:status` | main -> renderer | `statusBus.ts` | `preload.onStatus` | evento |
| `EVT_PLAY_ALARM` | `evt:playAlarm` | main -> renderer | `scheduler/notify.ts` | `system.client.ts` | evento |
| `EVT_NOTIFY` | `evt:notify` | main -> renderer | scheduler/timesheet/tray | `system.client.ts` | evento |
| `EVT_UPDATE_AVAILABLE` | `evt:updateAvailable` | main -> renderer | `updater.ts` | `useUpdater` | evento |
| `EVT_UPDATE_DOWNLOADED` | `evt:updateDownloaded` | main -> renderer | `updater.ts` | `useUpdater` | evento |
| `EVT_TRAY_LUNCH_TIMER` | `evt:trayLunchTimer` | main -> renderer | `tray.ts` | `useTrayListeners` | evento |
| `EVT_TRAY_OPEN_KUDO` | `evt:trayOpenKudo` | main -> renderer | `tray.ts` | `useTrayListeners` | evento |
| `EVT_TRAY_OPEN_COINS` | `evt:trayOpenCoins` | main -> renderer | `tray.ts` | `useTrayListeners` | evento |
| `TRAY_SET_LUNCH_ACTIVE` | `tray:setLunchActive` | renderer -> main event | `system.handlers.ts` | `system.client.ts` | `z.boolean()` |
| `WIN_SET_ICON` | `win:setIcon` | renderer -> main event | `window.handlers.ts` | `system.client.ts` | valida runtime `data:image/` |
| `UPDATER_QUIT_AND_INSTALL` | `updater:quitAndInstall` | renderer -> main | `updater.ts` | `system.client.ts` | nenhum |
| `ACTION_FETCH_ATIVIDADES` | `action:fetchAtividades` | renderer -> main | `atividades.handlers.ts` | `atividades.client.ts` | nenhum |
| `ACTION_NOTIFY` | `action:notify` | renderer -> main | `system.handlers.ts` | `system.client.ts` | `notifyWindowsArgsSchema` |

## Fluxo Interno
Consulte os arquivos `handler-*.md` para comportamento por dominio.

## Erros e Edge Cases
- `ACTION_SNOOZE_ALERT` nao possui uso encontrado em handlers, preload ou clients.
- `WIN_SET_ICON` nao tem Zod; valida tipo/string prefix dentro do handler.

## Side Effects
Variam por canal; vide docs de handler.

## Dependencias
[`src/shared/ipc/channels.ts`](../../src/shared/ipc/channels.ts).

## Consumidores
Preload, handlers, clients renderer e alguns emissores main.

## Testes
Ha teste parcial de contrato IPC segundo arquitetura; nao ha snapshot completo dos 54 canais.

## Observacoes / Dividas
A tabela foi conferida contra `channels.ts` no repo `4039c59`.
