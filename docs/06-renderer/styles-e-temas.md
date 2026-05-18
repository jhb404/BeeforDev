# Styles e Temas

> **Path:** `src/renderer/styles/global.css`, `src/renderer/features/gamification/themePresets.ts`, `src/renderer/app/providers/ThemeProvider.tsx`, `SettingsProvider.tsx`
> **Responsabilidade em uma frase:** Definir CSS global, tokens, dark/light, density e presets de gamification.

## Responsabilidade
Tema base vem de CSS variables. SettingsProvider aplica presets/overrides no `<html>`; ThemeProvider alterna `data-theme` e persiste preferencia.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `THEME_PRESETS` | const | Lista presets com tokens dark/light, swatches e achievement required. |
| `resolvePresetTokens` | function | Resolve tokens do preset para modo atual. |
| `ThemeProvider` | component | Dark/light + View Transition. |
| `SettingsProvider` | component | Aplica density e tokens CSS. |

## Fluxo Interno
`ThemeProvider.toggle(origin)` usa `document.startViewTransition` quando disponivel; caso contrario aplica classe de animacao. Settings observa mutacao de `data-theme` e reaplica tokens do preset.

## Erros e Edge Cases
- Reset de token remove todas as CSS vars listadas antes de aplicar novo preset.
- `fontScale` vira `font-size` no root.
- Preset inexistente deve resolver para defaults por `resolvePresetTokens`.

## Side Effects
`document.documentElement.dataset`, `style.setProperty/removeProperty`, localStorage.

## Dependencias
Gamification presets, CSS global.

## Consumidores
Toda UI.

## Testes
Sem teste direto de temas.

## Observacoes / Dividas
Temas desbloqueaveis dependem de achievements/codes na feature gamification.
