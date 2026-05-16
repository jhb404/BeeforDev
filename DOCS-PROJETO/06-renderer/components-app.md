# Components App

> **Path:** `src/renderer/app/components/*`, `src/renderer/components/layout/*`
> **Responsabilidade em uma frase:** Componentes de shell, topbar, modais globais, overlays e boundaries.

## Responsabilidade
Esses componentes formam o frame da aplicacao e modais globais fora das features.

## API Publica
| Componente | Responsabilidade |
|---|---|
| `TitleBar` | Barra frameless com logo/controles de janela via IPC. |
| `StartupOverlay` | Overlay inicial do renderer com tempo minimo/maximo. |
| `TopBar` | Navegacao Home/Settings, alertas, profile, team, patch journal, Coin2U. |
| `BellPanel` | Lista alertas visiveis, dismiss/snooze. |
| `LunchTimerWidget` | Timer de almoco de 1h. |
| `ToastHost` | Renderiza toast atual do provider. |
| `ErrorBoundary` | Boundary React com label. |
| `UpdateBadge` / `UpdateOverlay` | Estado visual de update. |
| `PatchJournal` / `PatchJournalModal` | Renderizacao de changelog/roadmap. |
| `ProfileModal` | Perfil/gamification/temas/icones. |

## Fluxo Interno
AppShell monta TopBar sempre, paginas em `main.content`, modais globais e StartupOverlay. TopBar aciona modais e eventos por props.

## Erros e Edge Cases
- ErrorBoundary evita crash total em pagina/modal.
- StartupOverlay chama `onComplete` quando ready ou timeout maximo.
- TopBar lazy-load de Coin2U badge evita custo inicial.

## Side Effects
IPC window controls, local state, app events, leitura de settings/gamification.

## Dependencias
Providers, hooks globais, common components.

## Consumidores
`AppShell`.

## Testes
Alguns hooks usados por componentes possuem testes; componentes app sem cobertura ampla.

## Observacoes / Dividas
`PatchJournal` transforma URLs e imagens a partir do texto do changelog.
