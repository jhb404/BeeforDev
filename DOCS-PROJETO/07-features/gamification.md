# Feature Gamification

> **Path:** `src/renderer/features/gamification/*`
> **Responsabilidade em uma frase:** Gerenciar XP, achievements, temas, icones e codigos secretos.

## Responsabilidade
Gamification guarda stats em localStorage/mock, define recompensas e achievements, resolve temas desbloqueaveis e variantes de icone.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `useGamification` | hook | Retorna stats, level, unlocked themes/icons e helpers. |
| `ACHIEVEMENTS` | const | Lista conquistas. |
| `achievementById` | function | Busca achievement. |
| `THEME_PRESETS` | const | Presets de tema com tokens. |
| `resolvePresetTokens` | function | Tokens por tema/mode. |
| `ICON_VARIANTS` | const | Variantes de icone app. |
| `loadStats/saveStats/isBackendReady` | store | Persistencia local/mock. |
| `redeemTheme/redeemIcon/getRedeemed*` | unlock | Codigos por hash SHA-256. |
| `MoodStreakBadge`, `StreakRankingModal`, `UnlockCodeModal` | components | UI gamification. |

## Fluxo Interno
Stats carregam de localStorage key `beefor-gamification-v1`; `USE_MOCK = true` no store. Unlock codes gravam redeemed em `beefor-redeemed-codes-v1`.

## Erros e Edge Cases
- Codigos reais nao ficam no repo; apenas hashes.
- Temas com `requires` dependem de achievement ou redeemed code.
- `isBackendReady` deve indicar mock/local conforme implementacao atual.

## Side Effects
localStorage, CSS tokens via SettingsProvider, icon sync via hook externo.

## Dependencias
Web Crypto para hashes, providers/settings/profile modal.

## Consumidores
ProfileModal, Settings appearance, App icon sync, TopBar badges.

## Testes
Sem teste direto de achievements/unlock.

## Observacoes / Dividas
`USE_MOCK = true` indica backend de gamification ainda nao integrado.
