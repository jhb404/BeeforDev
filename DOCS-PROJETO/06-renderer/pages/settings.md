# Page Settings

> **Path:** `src/renderer/pages/Settings.tsx`, `src/renderer/pages/settings/*`
> **Responsabilidade em uma frase:** Configurar credenciais, alertas, aparencia, tray e seguranca.

## Responsabilidade
Settings carrega settings/credenciais/admin/Coin2U, agrupa UI em categorias e persiste alteracoes via `settingsClient.set`.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `Settings` | component | Pagina de configuracoes. |
| `SETTINGS_DEFAULTS` | const | Defaults renderer para estado inicial. |
| `Switch` | component | Toggle comum. |
| `GeneralCard` | component | Auto-start/auto-login/UI sounds. |
| `TrayMenuCard` | component | Ordenacao dos itens de tray. |
| `PunchCard` | component | Automate punch, horarios e drift. |
| `MoodCard` | component | Mood notification/alarm. |
| `LunchCard` | component | Lunch alarm. |
| `KudoCardSettings` | component | Frequencia/dias/horario kudo. |
| `AppearanceSection` | component | View mode, theme presets, logo e density. |
| `CredentialsCard` | component | Credenciais Beefor e Coin2U. |
| `SecurityCard` | component | Texto/estado de seguranca. |
| `AdminBanner` | component | Banner de elevacao; atualmente retorna nada/placeholder conforme codigo. |

## Fluxo Interno
Categorias: `geral`, `alertas`, `aparencia`, `seguranca`. `update(k,v)` atualiza estado local, chama IPC e emite callback `onSettingsChanged`; `changeViewMode` salva e chama relaunch.

## Erros e Edge Cases
- Save Beefor exige email/senha em memoria da pagina.
- Save Coin2U salva, limpa senha local e tenta `verify` imediatamente.
- Clear Coin2U reseta email/senha/status local.
- `needsAdmin` depende de alertas ativos e `adminBannerDismissed` falso.

## Side Effects
IPC keytar/settings/admin/notifications/relaunch, toasts, estado local.

## Dependencias
Clients IPC, `getError`, settings sections.

## Consumidores
`AppShell` renderiza Settings lazy.

## Testes
Sem teste direto da pagina Settings.

## Observacoes / Dividas
`JornadaCard` esta importado comentado e nao renderiza.
