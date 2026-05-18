# Settings JSON

> **Path:** `src/shared/types/app.ts`, `src/main/sessionStore.ts`, `src/main/ipc/schemas.ts`, `src/renderer/pages/settings/defaults.ts`
> **Responsabilidade em uma frase:** Documentar todos os campos de `AppSettings`, defaults e efeitos.

## Responsabilidade
`AppSettings` e salvo em `userData/beefor-settings.json` por `saveSettings`, com `patchJournal` omitido e reinjetado em load.

## API Publica
| Campo | Tipo | Default main | Efeito |
|---|---|---|---|
| `autoStart` | boolean | `true` | `setAutoStart` no bootstrap/settings. |
| `autoLoginOnLaunch` | boolean | `true` | Bootstrap chama `ensureSession`. |
| `automatePunch` | boolean | `false` | Scheduler cria lembretes punch. |
| `punchTimes` | tuple 4 strings | `09:00,12:00,13:00,18:00` | Bases dos 4 slots punch. |
| `punchDriftMinutes` | number | `10` | Drift maximo por slot/dia. |
| `lunchAlarm` | boolean | `false` | Scheduler lunch. |
| `lunchAlarmTime` | string | `12:00` | Horario lunch. |
| `moodNotification` | boolean | `false` | Scheduler mood sem/acom alarm. |
| `moodNotificationTime` | string | `09:30` | Horario mood. |
| `moodAlarm` | boolean | `false` | Se true, mood envia `evt:playAlarm`. |
| `kudocardNotification` | boolean | `false` | Scheduler KudoCard. |
| `kudocardFrequency` | `once|twice|custom` | `once` | Quantidade/estrategia mensal. |
| `kudocardDays` | number[] | `[]` | Dias custom 1..31. |
| `kudocardNotificationTime` | string? | undefined | Horario fixo opcional. |
| `kudocardSchedule` | `{ym,slots}`? | undefined | Agenda mensal persistida. |
| `hoursPerDay` | number | `8` | Base de saldo na Home. |
| `hourRate` | number | `0` | Valor hora para cards opcionais. |
| `showOvertimeValue` | boolean? | undefined | Mostra valor extras quando UI usa. |
| `showTotalSalary` | boolean? | undefined | Mostra total estimado quando UI usa. |
| `patchJournal` | string | fallback/read file | Runtime only; nao persiste. |
| `adminBannerDismissed` | boolean? | undefined | Suprime banner admin. |
| `viewMode` | `classic|minimal`? | undefined -> classic | Alterna Home grid/minimal; troca reinicia app. |
| `calendarShowDiff` | boolean? | undefined | MinimalView mostra diff em celulas. |
| `logoVariant` | `orange|purple`? | undefined -> orange | Icone/janela/logo. |
| `uiDensity` | `compact|normal|comfortable`? | undefined -> normal | Dataset density no html. |
| `themeOverrides` | Partial<ThemeOverrides>? | undefined | CSS vars manuais. |
| `themePresetId` | string? | undefined | Preset gamification ativo. |
| `uiSounds` | boolean? | main default `false` | Sons de UI/sucesso. |
| `trayMenu` | TrayMenuItem[]? | `DEFAULT_TRAY_MENU` se ausente | Menu do tray. |
| `coin2uUserId` | number? | undefined | Fallback para endpoints Coin2U e status conectado. |
| `coin2uInfo` | Record? | undefined | Info completa do login Coin2U. |
| `coin2uOrgs` | Coin2uOrg[]? | undefined | Lista orgs para UI/offline. |

## Fluxo Interno
`loadSettings` faz `{ ...DEFAULT_SETTINGS, ...parsed, patchJournal: journal }`. `saveSettings` faz destructuring para omitir `patchJournal` e grava JSON indentado.

## Erros e Edge Cases
- Schema IPC de settings exige apenas core fields e `.passthrough()` aceita extras.
- Defaults renderer em `pages/settings/defaults.ts` podem divergir dos defaults main; conferir ao alterar.

## Side Effects
Leitura/escrita do arquivo settings e rebuild de tray/autoStart no handler.

## Dependencias
Tipos app, sessionStore, settings handler/schema.

## Consumidores
Settings page, scheduler, tray, bootstrap, Coin2U handlers, Home.

## Testes
Schemas IPC cobrem parte das restricoes.

## Observacoes / Dividas
Adicionar teste que compara campos de `AppSettings` com defaults/schema reduziria drift.
