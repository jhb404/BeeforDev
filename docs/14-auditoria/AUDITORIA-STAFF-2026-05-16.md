# 🛡️ AUDITORIA TÉCNICA STAFF — BeeforDev v0.1.8

> Data: 2026-05-16
> Branch: `feat/RepaginacaoArquitetura`
> Escopo: 245 TS/TSX, ~19k LOC, Electron 31 + React 18 + Vite 5 + Playwright 1.47 + Zod 4
> Status: Diagnóstico — nenhuma alteração de código feita

---

## 1. VISÃO GERAL ARQUITETURA

### Camadas

```
src/
├── main/         → Electron main, IPC handlers, scheduler, Coin2U HTTP
├── automation/   → Playwright client (singleton) + actions Beefor
├── renderer/     → React 18, feature-sliced, lazy pages
└── shared/       → IPC channels, types, constants (zod schemas)
```

### Fluxo

1. `main/index.ts` → cria BrowserWindow (sandbox + contextIsolation + nodeIntegration=false)
2. Preload bundlado via esbuild (`scripts/build-preload.mjs`) → `contextBridge.exposeInMainWorld('beefor', api)`
3. Renderer chama `window.beefor.*` → IPC clients tipados (`renderer/services/ipc/*`)
4. Main handlers (`main/ipc/handlers/*`) → validam Zod → executam Playwright via `runBeeforAction` (page-lock + reconnect)
5. Status broadcast via `statusBus` → `webContents.send(EVT_STATUS)`

### Padrões fortes

- Singleton Playwright + page-lock serial (sem corrida)
- IPC 100% via `defineHandler` (factory abstrai `try/catch` + `fail()`)
- Zod schemas em todos handlers com input dinâmico
- Keytar p/ creds (zero secrets em settings)
- CSP toggle dev/prod
- ADRs documentados (`docs/adr/*`)
- 0 `console.log`, electron-log centralizado
- Provider stack enxuto (4 níveis)
- TypeScript strict em ambos tsconfigs

### Padrões frágeis

- 3 providers React vazam objeto novo/render (re-render cascade)
- Gamification 100% mock (`USE_MOCK=true` hardcoded em `store.ts:14`)
- Feature "atividades" parcial, modal pesado, mock util co-existe
- `themePresets.ts` 969 LOC = arquivo data gigante
- `alarm.ts` 660 LOC = util inchada
- 23 `any` em automation/cache/auth
- 0 testes E2E Playwright (só unit)
- `JornadaCard` import comentado em Settings = código morto

---

## 2. PROBLEMAS ENCONTRADOS

### 🔴 ALTA — Performance / Re-render

| # | Problema | Local | Impacto | Risco fix | Sugestão |
|---|---|---|---|---|---|
| P1 | `SettingsProvider` value inline `{settings, reload}` recriado/render | `app/providers/SettingsProvider.tsx:140` | Re-render todos consumers/parent render | Baixo | `useMemo(()=>({settings,reload}),[settings])` |
| P2 | `ThemeProvider` value inline `{theme, toggle}` | `app/providers/ThemeProvider.tsx:51` | Idem | Baixo | `useMemo` + `useCallback(toggle)` |
| P3 | `ToastProvider` value inline | `app/providers/ToastProvider.tsx:41` | Idem | Baixo | `useMemo` |
| P4 | `IpcProvider` `merged` recriado/render | `services/ipc/IpcProvider.tsx:47` | Re-render IPC consumers | Baixo | `useMemo(()=>defaultClients,[])` — singleton |

### 🟠 MÉDIA — Arquitetura / Qualidade

| # | Problema | Local | Impacto | Risco | Sugestão |
|---|---|---|---|---|---|
| P5 | `themePresets.ts` 969 LOC data | `features/gamification/themePresets.ts` | Bundle inflado p/ feat mock | Baixo | Split por preset, lazy import |
| P6 | `alarm.ts` 660 LOC util | `renderer/utils/alarm.ts` | God-util, sem coesão | Médio | Quebrar: `audio/`, `cache/`, `dispatcher/` |
| P7 | `Home.tsx` 324 LOC + 11 useState | `pages/Home.tsx` | Coesão baixa, difícil teste | Médio | Extrair `useHomeOrchestrator` hook |
| P8 | `Settings.tsx` 314 LOC, 7+ state, tabs inline | `pages/Settings.tsx` | Idem | Médio | Router de seções + sub-context |
| P9 | Gamification em mock permanente | `features/gamification/store.ts:14` | Feature meia-pronta no bundle prod | Alto | Feature-flag + tree-shake se off |
| P10 | `atividadeMock.ts` co-existe com IPC real | `features/atividades/utils/` | Confusão dev | Baixo | Mover p/ `__fixtures__` ou deletar |
| P11 | `JornadaCard` importado/comentado | `pages/Settings.tsx:10,177` | Dead import | Zero | Remover |
| P12 | `useAlerts` retorna `off` handler nunca chamado | `app/hooks/useAlerts.ts:40-45` | Possível listener vazado | Médio | Auditar `useEffect cleanup` |
| P13 | `useTimesheetData` cache via `useRef` + effects separados | `pages/home/hooks/useTimesheetData.ts:32-42` | Bug latente sincronização | Médio | Consolidar effect único |
| P14 | `App.tsx` eslint-disable exhaustive-deps sem comentário why | `App.tsx:87` | Manutenção opaca | Zero | Documentar invariante |

### 🟡 BAIXA — TypeScript / DX

| # | Problema | Local | Sugestão |
|---|---|---|---|
| P15 | 23 `any` (automation/cache/auth) | `automation/internals/*`, `coin2u/auth.ts` | Migrar p/ `unknown` + narrow |
| P16 | Magic numbers (5s birthday, 1.8s prefetch, 1.2s photos) | `app/hooks/use*` | Constants file `src/renderer/constants/timings.ts` |
| P17 | TODO em `coin2u/endpoints.ts:60` | endpoint | Resolver ou abrir issue |
| P18 | i18next em devDependencies mas usado em runtime | `package.json:55` | Mover p/ `dependencies` |
| P19 | `react` + `react-dom` em devDeps | `package.json:59-60` | Verificar — se runtime, mover p/ deps |

### 🛡️ SEGURANÇA

| # | Problema | Local | Severidade | Sugestão |
|---|---|---|---|---|
| S1 | Splash usa `<script unsafe-inline>` (intencional, isolado) | `startupSplash.ts` | Baixa | OK se splash window não navega; documentar |
| S2 | Dev CSP permite `unsafe-eval/inline` (HMR) | `main/index.ts` CSP | Baixa | Manter — gate `NODE_ENV` correto |
| S3 | `APP_READ_ASSET` lê arquivo do build dir | `system.handlers.ts` | Baixa | Schema `assetFileNameSchema` valida regex — OK; confirmar path resolve não escapa via `..` |
| S4 | `WIN_SET_ICON` aceita dataUrl | preload | Baixa | Validado prefixo `data:image/` — OK |
| S5 | Token Beefor extraído via `page.evaluate(localStorage)` cacheado 25min | `beeforTokenCache.ts` | Média | OK; garantir limpeza no logout (verificar) |
| S6 | electronegativity flagou MEDIUM em AUXCLICK / openExternal | report.csv | Média | Já mitigado via `openExternalSafe` allowlist; fechar findings |
| S7 | `coin2u/auth.ts` HTTP cookies em jar custom | `main/coin2u/cookieJar.ts` | Média | Confirmar TLS verify, cookie httpOnly path scoping |

### 🧪 ELECTRON

| # | Problema | Local | Sugestão |
|---|---|---|---|
| E1 | Sem auditoria multi-window (só 1 BrowserWindow + splash) | `window.ts` | OK p/ arch atual; documentar limite |
| E2 | Watchdog 60s + Scheduler 30s tickers | `sessionManager.ts`, `scheduler/index.ts` | Confirmar `clearInterval` em `window-all-closed` — OK |
| E3 | Preload bundle CJS estático | `build-preload.mjs` | Sem source-maps em prod — adicionar p/ debug |
| E4 | Sem rate-limit em handlers de rede pesada | `coin2u/*`, `kudo/*` | Adicionar debounce/cooldown server-side |

---

## 3. CÓDIGO REMOVÍVEL

### Alta confiança

| Item | Caminho | Evidência |
|---|---|---|
| `JornadaCard` | `pages/settings/sections/JornadaCard.tsx` + import | Comentado em `Settings.tsx:177`, não usado |
| `Fluxo-Salvamento-Credenciais.md` | root | Já marcado `D` no git status |
| `image.png`, `image-1.png` | root | 864KB binários em root, sem refs no código (verificar antes) |

### Confiança média — validar via grep

- `atividadeMock.ts` — `features/atividades/utils/atividadeMock.ts`
- `useResizeSplit` — `features/atividades/hooks/useResizeSplit.ts`

### NÃO remover sem decisão de produto

- `gamification/*` (mock mode) — apenas isolar atrás de feature-flag

---

## 4. MELHORIAS RECOMENDADAS

### Quick wins (≤1 dia, baixo risco)

1. Memoizar 4 provider values (P1-P4) → corte re-render imediato
2. Remover `JornadaCard` + imports comentados
3. Adicionar `src/renderer/constants/timings.ts`
4. Documentar eslint-disable em `App.tsx:87`
5. Mover `image*.png` p/ `docs/screenshots/` ou deletar
6. Confirmar deleção de `Fluxo-Salvamento-Credenciais.md`

### Médio prazo (1 sprint)

7. Split `alarm.ts` em 3 módulos coesos
8. Split `themePresets.ts` → lazy chunks por preset
9. Extrair `useHomeOrchestrator` de `Home.tsx`
10. Section-router em `Settings.tsx`
11. Migrar 23 `any` → `unknown` + narrow
12. Adicionar source-maps preload em prod

### Alto impacto

13. Feature flag gamification (env + settings) — tree-shake se off
14. Testes Playwright E2E p/ fluxos críticos (login, lançar hora, kudo)
15. Telemetria/observabilidade (electron-log → arquivo rotacionado + opcional Sentry/Bugsnag)

### Alto risco (planejar)

16. Migrar context → zustand p/ AppShell modal state
17. Reescrever `coin2u/auth.ts` (314 LOC) — extrair `cookieJar` interface

### Refatorações futuras

18. Mover automation actions p/ command pattern (testabilidade)
19. Generator de tipos IPC a partir de schemas Zod (single source of truth)
20. SSR-like pré-cálculo de team prefetch via main process

---

## 5. PLANO SEGURO DE LIMPEZA

Ordem minimizando ripple:

### FASE A — Zero risco (1h)

1. Deletar arquivos órfãos: `image*.png`, `Fluxo-Salvamento-Credenciais.md`
2. Remover `JornadaCard` + import comentado em `Settings.tsx`
3. Adicionar `timings.ts` (não-funcional, só extração)
4. Validar: `tsc`, `eslint`, `vitest`, `build`

### FASE B — Providers (baixo risco, 2h)

5. Memoizar value em Settings/Theme/Toast/Ipc providers
6. Smoke test: abrir app, alternar tema, mudar settings, ver toast
7. Validar: `tsc`, `eslint`, `vitest`

### FASE C — Códigos mortos validados (2h)

8. Grep `atividadeMock` + `useResizeSplit`; se 0 refs, deletar
9. Validar build + e2e manual atividades modal

### FASE D — Splits (médio risco, 1 dia)

10. Split `alarm.ts`: `audio.ts` / `cache.ts` / `dispatcher.ts` (re-export shim no original)
11. Lazy-import `themePresets` (dynamic import por preset)
12. Validar bundle size delta + smoke

### FASE E — Refac coesão (alto, 2 dias)

13. Extrair `useHomeOrchestrator`
14. Section-router `Settings`
15. Validar tudo

### FASE F — Types (contínuo)

16. Sweep 23 `any` → `unknown` (1 PR por área: automation/coin2u/cache)

### FASE G — Feature gating

17. Flag gamification mock → off em prod build
18. Tree-shake se off

> Cada fase = commit isolado, smoke test antes da próxima.

---

## 6. PLANO DE TESTES

### Unit (existentes — manter)

- `tests/ipcChannels.spec.ts` — schemas Zod
- `tests/beeforSelectors.spec.ts` — selectors Playwright
- `src/renderer/utils/dates.test.ts`, `timeMath.test.ts`
- `useEscapeToClose.test.ts`, `useSlowHint.test.ts`, `useCoin2uToast.test.ts`

### Adicionar unit

- `app/providers/*` — value reference stability (render N× → same ref)
- `useTimesheetData` — cache hit/miss/invalidation
- `useAlerts` — listener cleanup
- `beeforTokenCache` — TTL expiry, logout clear
- `coin2u/auth` — token refresh, cookie persistence
- `sessionGuard` — reconnect retry path
- Cada handler IPC — schema rejection + happy path

### Integração

- IPC roundtrip via electron mock (`@electron/electron` test runner)
- `beeforClient` mocked via Playwright fixture

### E2E (faltam — criar)

- Playwright test mode: login → lançar hora → verificar grid
- Login → enviar kudo → ver histórico
- Login → mood select → confirmar
- Logout → reabrir → auto-login

### Smoke tests manuais (toda release)

- [ ] App abre <3s
- [ ] Login válido / inválido
- [ ] Lançar hora batch (5 dias)
- [ ] Toggle tema
- [ ] Trocar settings + restart
- [ ] Kill app durante Playwright action → recover
- [ ] Memória estável >10min idle
- [ ] Tray: lunch timer, kudo, coins clicks

### Validação automatizada por PR

- `npm run lint` (tsc + eslint max-warnings 0)
- `npm test` (vitest)
- electronegativity report diff (CI)

---

## 7. CHECKLIST FINAL

### REMOVER

- [ ] `JornadaCard.tsx` + import comentado
- [ ] `image.png`, `image-1.png` (root)
- [ ] `atividadeMock.ts` (se 0 refs)
- [ ] `useResizeSplit` (se 0 refs)
- [ ] Imports/dead exports detectados via tsc unused

### REFATORAR

- [ ] `alarm.ts` → 3 módulos
- [ ] `themePresets.ts` → lazy chunks
- [ ] `Home.tsx` → orchestrator hook
- [ ] `Settings.tsx` → section router
- [ ] `coin2u/auth.ts` → cookieJar interface

### ISOLAR

- [ ] Gamification feature atrás de flag
- [ ] Atividades feature (parcial) sinalizar WIP
- [ ] Mock utils → `__fixtures__/`

### PROTEGER

- [ ] Memoizar 4 provider values
- [ ] Listener cleanup audit (`useAlerts`, `useBirthdayWatcher`)
- [ ] Token cache clear on logout
- [ ] Asset read path traversal guard (reconfirmar)
- [ ] Source-maps preload prod

### MODULARIZAR

- [ ] `constants/timings.ts`
- [ ] IPC channel type-gen via Zod
- [ ] Automation command pattern

### TESTAR

- [ ] Provider value stability tests
- [ ] Token cache TTL
- [ ] Session reconnect
- [ ] E2E Playwright fluxos críticos
- [ ] Memory leak benchmark (heapdump 10min idle)
- [ ] Multi-window stress (mesmo se single-window agora)

---

## VEREDICTO

Código **saudável** para projeto solo. Arquitetura sólida (sandbox + contextIsolation + Zod + keytar = top-tier Electron security). Tech-debt **médio-baixo**: 0 `console.log`, ADRs, CI lint + tsc strict.

**Maiores ganhos imediatos:**

1. Memoizar 4 providers (P1-P4, ~30min) → corte re-render direto
2. Gating gamification mock em build prod
3. E2E Playwright fluxos críticos

RAM ~500MB documentada em memory → causa = Playwright/Chromium singleton (esperado, não bug).

**Nenhuma alteração feita.** Aguardando ordem para executar FASE A.
