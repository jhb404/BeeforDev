# Renderer

> **Path:** `src/renderer/`
> **Responsabilidade em uma frase:** SPA React sandboxed que consome IPC tipado e renderiza Home, Settings, features e UI shell.

## Responsabilidade
O renderer nao acessa Node. `main.tsx` monta `App`; `App` encadeia providers, topbar, paginas lazy, modais e hooks globais de eventos/update/alarme/gamification.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `App` | component | `() => JSX.Element` | Providers raiz e `AppShell`. |
| `Home` | component | `(props?) => JSX.Element` | Timesheet, mood e modais da Home. |
| `Settings` | component | `(props?) => JSX.Element` | Configuracoes por categoria. |
| `IpcProvider/useIpc` | provider/hook | DI de clients IPC | Injeta clients por dominio. |
| `SettingsProvider/useSettings` | provider/hook | settings app | Carrega settings e aplica tokens. |
| `ThemeProvider/useTheme` | provider/hook | dark/light | Gerencia `data-theme` e localStorage. |
| `ToastProvider/useToast` | provider/hook | toasts | Fila simples de toast atual. |
| `ui-guide.md` | doc | guia de UI | Guia historico de tokens, modais e padroes visuais. |

## Fluxo Interno
```ascii
main.tsx -> App
  -> IpcProvider
  -> SettingsProvider
  -> ThemeProvider
  -> ToastProvider
  -> AppShell
      -> TitleBar + TopBar
      -> Home/Settings lazy
      -> Team/Patch/Profile/Update modals
      -> StartupOverlay
```

## Erros e Edge Cases
- `main.tsx` lanca se `#root` nao existe.
- `ErrorBoundary` envolve paginas e modais principais.
- Settings aplica tokens novamente quando `data-theme` muda.

## Side Effects
DOM, localStorage, IPC via preload, audio WebAudio, canvas para icone, timers de hooks.

## Dependencias
React, i18next, clients IPC, features, utils e [ui-guide.md](./ui-guide.md).

## Consumidores
Usuario final via renderer Electron.

## Testes
Hooks/utils/componentes possuem cobertura parcial; ver [../11-testes/README.md](../11-testes/README.md).

## Observacoes / Dividas
`JornadaCard` existe mas esta comentado em `Settings.tsx`.
