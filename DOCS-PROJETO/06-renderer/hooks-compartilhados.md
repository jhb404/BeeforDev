# Hooks Compartilhados

> **Path:** `src/renderer/hooks/*`, `src/renderer/app/hooks/*`
> **Responsabilidade em uma frase:** Encapsular estado de sessao, eventos globais, updater, timers, caches e interacoes DOM.

## Responsabilidade
Hooks reduzem acoplamento entre AppShell/paginas e clients IPC/localStorage/DOM.

## API Publica
| Hook | Responsabilidade |
|---|---|
| `useBeefor` | Status/busy/wrap para chamadas Beefor. |
| `useUpdater` | Eventos update available/downloaded e install. |
| `useAppIconSync` | Rasteriza variante de icone e envia `win:setIcon`. |
| `useAppLogo` | Resolve asset de logo. |
| `useTeamMembers` | Busca/cache membros do time. |
| `useSlowHint` | Mensagem apos delay de loading. |
| `useClickOutside` | Detecta clique fora de ref. |
| `useEscapeToClose` | Fecha por Escape. |
| `useJournalBadge` | Badge de versao/changelog visto. |
| `useAlerts` | Alertas do dia, dismiss/snooze e mood externo. |
| `useAlarmRouter` | Ouve `evt:playAlarm` e toca audio. |
| `useTrayListeners` | Ouve eventos do tray. |
| `useLunchTimer` | Estado/timer de almoco. |
| `usePatchJournal` | Le patch journal via IPC asset. |
| `useBirthdayWatcher` | Badge/aniversarios. |
| `useTeamPrefetch` / `useTeamPhotoPreload` | Preload/cache team. |
| `useUiSoundsDelegate` | Delegacao global de sons UI. |

## Fluxo Interno
Hooks de app sao montados no `AppShell`; hooks compartilhados sao usados por paginas/features conforme necessidade.

## Erros e Edge Cases
- Hooks com listeners retornam cleanup.
- Caches usam localStorage e devem tolerar JSON invalido.
- `useAppIconSync` depende de canvas/image; falha nao deve quebrar UI.

## Side Effects
IPC listeners, localStorage, timers, audio, canvas, document events.

## Dependencias
Clients IPC, providers e utils.

## Consumidores
AppShell, Home, Settings, Team e Coin2U/Kudo features.

## Testes
`useTrayListeners`, `useLunchTimer`, `usePatchJournal`, `useSlowHint`, `useEscapeToClose` possuem testes; outros tem cobertura parcial/ausente.

## Observacoes / Dividas
Separar hooks com side effects globais ajuda futura migracao para query/cache library.
