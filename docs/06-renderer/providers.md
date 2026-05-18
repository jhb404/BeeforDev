# Providers

> **Path:** `src/renderer/app/providers/*`, `src/renderer/services/ipc/IpcProvider.tsx`
> **Responsabilidade em uma frase:** Injetar IPC, settings, tema e toasts para a SPA.

## Responsabilidade
Providers desacoplam features de implementacoes globais e centralizam efeitos de DOM/localStorage.

## API Publica
| Provider/Hook | Path | Descricao |
|---|---|---|
| `IpcProvider`, `useIpc` | `services/ipc/IpcProvider.tsx` | DI de clients: session, settings, timesheet, mood, kudo, team, coin2u, atividades, system, window. |
| `SettingsProvider`, `useSettings` | `app/providers/SettingsProvider.tsx` | Carrega settings via IPC, aplica density e CSS tokens. |
| `ThemeProvider`, `useTheme` | `app/providers/ThemeProvider.tsx` | Persiste tema em `localStorage.beefor-theme` e usa View Transition quando disponivel. |
| `ToastProvider`, `useToast`, `useToastState`, `useToastDismiss` | `app/providers/ToastProvider.tsx` | Toast unico com opcao persistente/action. |

## Fluxo Interno
`App` aplica ordem fixa: IPC -> Settings -> Theme -> Toast -> AppShell. SettingsProvider escuta `APP_EVENTS.SETTINGS_CHANGED`; ThemeProvider altera `document.documentElement.dataset.theme`.

## Erros e Edge Cases
- Hooks lancam erro se usados fora do provider.
- Settings `.get()` nao captura erro localmente; falha de IPC rejeita Promise.
- Toast persistente nao cria timer de dismiss automatico.

## Side Effects
LocalStorage, dataset/style no `<html>`, timers de toast, React context.

## Dependencias
`resolvePresetTokens`, `APP_EVENTS`, clients IPC.

## Consumidores
AppShell, paginas, features e hooks.

## Testes
Providers nao tem teste direto amplo; hooks que dependem de IPC usam factories em `src/test/factories/ipc.ts`.

## Observacoes / Dividas
Tokens CSS sao resetados antes de aplicar preset/overrides para evitar sobra de tema anterior.
