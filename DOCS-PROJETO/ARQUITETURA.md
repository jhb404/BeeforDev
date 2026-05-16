# Arquitetura — Beefor Dev

Versão `0.1.8` · Electron 31 + React 18 + TypeScript 5 + Vite 5 + Playwright 1.47

---

## Visão Geral

Beefor Dev é um app desktop Electron que automatiza tarefas no sistema Beefor (RH) e na carteira Coin2U. O renderer é uma SPA React totalmente isolada do processo principal via IPC. Toda automação de browser roda no processo main com Playwright (Chromium headless).

```
┌─────────────────────────────────────────────────────────────────┐
│  Sistema Operacional (Windows / macOS)                          │
│                                                                 │
│  ┌──────────────┐   IPC (contextBridge)  ┌───────────────────┐ │
│  │  Main Process │ ◄────────────────────► │ Renderer Process  │ │
│  │  (Node.js)    │                        │ (React SPA)       │ │
│  │               │                        │                   │ │
│  │ • IPC handlers│                        │ • UI / UX         │ │
│  │ • Playwright  │                        │ • Feature modules │ │
│  │ • Scheduler   │                        │ • Gamification    │ │
│  │ • Coin2U HTTP │                        │ • i18n (pt-BR/en) │ │
│  │ • keytar      │                        │                   │ │
│  └──────┬────────┘                        └───────────────────┘ │
│         │                                                        │
│         │  Playwright Chromium (headless)                        │
│         ▼                                                        │
│  ┌──────────────────────────┐                                    │
│  │  Beefor Web (browser)    │                                    │
│  └──────────────────────────┘                                    │
│                                                                  │
│  ┌──────────────────────────┐                                    │
│  │  Coin2U API (HTTP/REST)  │                                    │
│  └──────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Desktop | Electron | 31.3.0 |
| UI | React + React DOM | 18.3.1 |
| Linguagem | TypeScript | 5.5.3 |
| Build renderer | Vite | 5.3.4 |
| Automação browser | Playwright (Chromium) | 1.47.0 |
| Credenciais seguras | keytar (Windows Credential Manager) | 7.9.0 |
| Logging | electron-log | 5.1.5 |
| Auto-update | electron-updater | 6.8.3 |
| Validação IPC | Zod | ~4.4 |
| i18n | i18next + react-i18next | 26.1 / 17.0 |
| Testes | Vitest | 2.0.5 |
| Packaging | electron-builder | 24.13.3 |

---

## Estrutura de Diretórios

```
src/
├── automation/          # Scripts Playwright (browser automation)
│   └── beefor/
│       ├── actions/     # Ações por domínio (mood, kudo, timesheet, session)
│       ├── internals/   # Helpers internos (API client, cache, text utils)
│       ├── beeforClient.ts      # Singleton: browser/context/page
│       ├── actions/index.ts     # Barrel das ações por domínio
│       ├── beeforSelectors.ts   # Seletores CSS/XPath centralizados
│       ├── beeforSession.ts     # Persistência de sessão (storageState)
│       └── pageLock.ts          # Mutex para acesso concorrente à página
│
├── main/                # Processo principal Electron (Node.js)
│   ├── index.ts         # Bootstrap e ciclo de vida do app
│   ├── preload.ts       # Bridge IPC (contextBridge, bundlado por esbuild)
│   ├── window.ts        # Criação do BrowserWindow + CSP
│   ├── ipc/
│   │   ├── index.ts     # Registra todos os handlers
│   │   ├── handlers/    # Um arquivo por domínio IPC
│   │   ├── schemas.ts   # Schemas Zod para validação de argumentos
│   │   └── validate.ts  # Middleware de validação
│   ├── bootstrap/       # Inicialização (tray, notificações, splash, updater)
│   ├── coin2u/          # Integração Coin2U (auth, HTTP, parsers, endpoints)
│   ├── scheduler/       # Scheduler de 30s (alarmes, kudos, punch automático)
│   ├── services/        # beeforActionRunner (auto-reconexão)
│   ├── sessionManager.ts   # Watchdog 60s de verificação de sessão
│   ├── sessionStore.ts     # Persistência de settings em userData/
│   ├── secureStorage.ts    # Wrapper keytar
│   ├── safeStore.ts        # Criptografia de arquivos de sessão
│   └── statusBus.ts        # EventEmitter de mudanças de status de sessão
│
├── renderer/            # Processo renderer (React SPA)
│   ├── App.tsx          # Shell raiz com providers
│   ├── main.tsx         # Entry point React
│   ├── app/
│   │   ├── components/  # TopBar, TitleBar, BellPanel, PatchJournal, etc.
│   │   ├── hooks/       # Hooks de app (alerts, birthday, sounds, team prefetch)
│   │   └── providers/   # SettingsProvider, ThemeProvider, ToastProvider
│   ├── pages/
│   │   ├── Home.tsx     # Página principal (timesheet + mood)
│   │   ├── Settings.tsx # Página de configurações
│   │   ├── home/        # Componentes e utils da Home
│   │   └── settings/    # Seções de settings (cards por domínio)
│   ├── features/        # Módulos feature-sliced
│   │   ├── atividades/  # Modal de atividades
│   │   ├── coin2u/      # Modal Coin2U (shop, histórico, transferência)
│   │   ├── gamification/# Achievements, temas, ícones, unlock codes
│   │   ├── kudo/        # Modal KudoCard (envio + histórico)
│   │   └── team/        # Modal time (lista, detalhes, aniversários)
│   ├── components/      # UI compartilhado (BeeforLogo, Icons, ModalShell, etc.)
│   ├── hooks/           # Hooks compartilhados (useBeefor, useUpdater, etc.)
│   ├── services/
│   │   └── ipc/         # Clients IPC tipados por domínio + IpcProvider
│   ├── utils/           # Utilitários (datas, cálculo de horas, cache, alarme)
│   ├── styles/          # CSS global + tokens de tema
│   └── i18n/            # Config i18next + locales (pt-BR, en)
│
├── shared/              # Código compartilhado main ↔ renderer
│   ├── ipc/
│   │   └── channels.ts  # Constantes de todos os canais IPC (60+)
│   ├── types/           # Tipos compartilhados (session, timesheet, kudo, etc.)
│   ├── constants.ts     # URLs, chaves, valores fixos
│   └── result.ts        # ActionResult + helpers ok() / fail() / withTimeout()
│
└── test/                # Utilitários de teste

scripts/
├── free-port.mjs        # Kill processo em porta (pre-dev)
├── hash-codes.mjs       # Gera SHA-256 de códigos de unlock (gamification)
└── build-preload.mjs    # Bundle do preload via esbuild

DOCS-PROJETO/            # Esta pasta — documentação do projeto
```

---

## Fluxo de Inicialização

```
Electron start
    │
    ├─ createStartupSplash()     → janela de splash
    ├─ registerIpcHandlers()     → conecta todos os handlers IPC
    ├─ ensureTray()              → ícone + menu na bandeja do sistema
    ├─ createWindow()            → BrowserWindow principal (frameless)
    │
    ├─ [se auto-login ativo]
    │       └─ ensureSession()  → login Playwright headless
    │
    ├─ startWatchdog()           → loop 60s verificando sessão
    ├─ startScheduler()          → loop 30s para alertas/notificações
    ├─ setupAutoUpdater()        → checa GitHub Releases
    │
    └─ windowReveal()            → fecha splash, faz fade-in na janela principal
```

---

## Arquitetura IPC

### Bridge (preload)
O `preload.ts` é bundlado separadamente por esbuild e expõe a API via `contextBridge.exposeInMainWorld('beefor', api)`. O renderer nunca tem acesso direto ao Node.js.

### Fluxo de uma chamada IPC
```
Renderer (React)
    └─ ipcClient.login(creds)           [services/ipc/session.client.ts]
           │  window.beefor.login(...)
           ▼
    Preload (bridge)
           │  ipcRenderer.invoke(channel, args)
           ▼
    Main Process
           └─ ipcMain.handle(channel)   [ipc/handlers/session.handlers.ts]
                  └─ validate(args, schema)   [Zod]
                  └─ beeforActionRunner.run(() => session.login(creds))
                  └─ return Result<T, E>
```

### Domínios IPC

| Domínio | Prefixo | Exemplos |
|---------|---------|---------|
| Credenciais | `creds:` | `creds:save`, `creds:get`, `creds:clear` |
| Settings | `settings:` | `settings:get`, `settings:set` |
| Sessão | `session:` | `session:login`, `session:logout`, `session:status`, `session:verify` |
| Timesheet | `action:` | `action:fetchTimesheet`, `action:lancarHora`, `action:autoLancamento` |
| Mood | `action:` | `action:selectMood`, `action:getCurrentMood` |
| KudoCard | `action:` | `action:sendKudoCard`, `action:kudoCounts`, `action:kudoLists` |
| Time | `action:` | `action:fetchTeamMembers` |
| Coin2U | `coin2u:` | `coin2u:getDashboard`, `coin2u:getShop`, `coin2u:transfer` |
| Atividades | `action:` | `action:fetchAtividades` |
| Janela | `win:` | `win:minimize`, `win:maximize`, `win:close`, `win:setIcon` |
| Eventos (main→renderer) | `evt:` | `evt:status`, `evt:playAlarm`, `evt:updateAvailable` |
| Sistema | `admin:`, `app:` | `admin:status`, `app:relaunch` |

---

## Automação Playwright

### Singleton BeeforClient
```
BeeforClient
  ├─ browser: Browser       (Chromium, headless por padrão)
  ├─ context: BrowserContext (storageState persistido)
  └─ page: Page              (única aba ativa)
```

- `BEEFOR_HEADED=1` → exibe o browser
- Viewport: 1280×800, locale `pt-BR`, timezone `America/Sao_Paulo`
- Anti-detecção: desabilita flag de automação do Blink + user-agent Chrome 127

### Mutex (PageLock)
Toda ação Playwright passa pelo `pageLock`. Se duas ações são chamadas simultaneamente, a segunda espera a primeira terminar. Evita corrida no DOM.

### Auto-reconexão (BeeforActionRunner)
```
beeforActionRunner.run(fn)
    ├─ tenta fn()
    ├─ [se sessão expirada] → re-login silencioso
    └─ tenta fn() novamente
```

### Persistência de Sessão
`storageState` do Playwright (cookies + localStorage do Beefor) é salvo em `userData/beefor-session.json` criptografado via `safeStore.ts`.

---

## Scheduler (30s tick)

```
startScheduler()
    └─ setInterval(tick, 30_000)
           ├─ getTodayAlerts()    → calcula alertas do dia
           ├─ checkMoodAlarm()    → hora configurada de notificar mood
           ├─ checkLunchAlarm()   → hora configurada de alarme de almoço
           ├─ checkKudoSlot()     → dias/hora configurados de lembrete kudo
           └─ checkPunchSlots()   → 4 horários de punch automático
```

**Fired State**: cada evento tem um ID `{tipo}-{data}` — se já disparou hoje, não dispara de novo (persiste em memória, resetado à meia-noite).

**Drift**: horários de punch podem ter deriva aleatória de ±N minutos, recalculada diariamente via `drift.ts`.

---

## Armazenamento e Segurança

| Dado | Onde fica | Como |
|------|-----------|------|
| Credenciais Beefor (email/senha) | Windows Credential Manager | keytar |
| Credenciais Coin2U | Windows Credential Manager | keytar |
| Settings do app | `%APPDATA%/Beefor Dev/settings.json` | JSON plano |
| Sessão Playwright (storageState) | `%APPDATA%/Beefor Dev/beefor-session.json` | Criptografado (safeStore) |
| Sessão Coin2U | `%APPDATA%/Beefor Dev/coin2u-session.json` | Criptografado (safeStore) |
| Achievements / temas desbloqueados | `localStorage` do renderer | JSON |
| Códigos de unlock | **Nunca persistidos** — apenas hashes SHA-256 no código | — |

### AppSettings
`src/shared/types/app.ts` é a fonte de verdade. Campos persistidos em `settings.json`:

- inicialização/sessão: `autoStart`, `autoLoginOnLaunch`, `adminBannerDismissed`
- ponto automático: `automatePunch`, `punchTimes`, `punchDriftMinutes`
- notificações: `lunchAlarm`, `lunchAlarmTime`, `moodNotification`, `moodNotificationTime`, `moodAlarm`, `kudocardNotification`, `kudocardFrequency`, `kudocardDays`, `kudocardNotificationTime`, `kudocardSchedule`
- jornada/valores: `hoursPerDay`, `hourRate`, `showOvertimeValue`, `showTotalSalary`
- UI: `viewMode`, `calendarShowDiff`, `logoVariant`, `uiDensity`, `themeOverrides`, `themePresetId`, `uiSounds`, `trayMenu`
- Coin2U: `coin2uUserId`, `coin2uInfo`, `coin2uOrgs`
- runtime não persistido por `saveSettings`: `patchJournal`

### Isolamento do Renderer
- Context isolation ativo — renderer não tem acesso ao Node.js
- CSP instalado em produção (desabilitável com `BEEFOR_CSP=0`)
- Todas as permissões Web (câmera, notificação via Web API, etc.) negadas pelo main
- Links externos validados por whitelist antes de abrir

---

## Sistema de Temas (Gamification)

### Estrutura
```
themePresets.ts
  └─ THEME_PRESETS: ThemePreset[]
       ├─ id, name, description
       ├─ requires: achievementId | null   (null = sempre disponível)
       ├─ tokens: { dark: {...}, light: {...} }   (CSS custom properties)
       └─ swatches: [cor1, cor2, cor3]
```

### Temas livres (requires: null)
- Padrão, Crepúsculo, Ardósia, Brasa

### Desbloqueio por conquista (em ordem de dificuldade)
`explorer` → `mood-week` → `punch-week` → `lvl-5` → `auto-lancar-3` → `kudo-5` → `mood-2-weeks` → `lvl-10` → `kudo-10` → `mood-month` → `kudo-25` → `lvl-20` → `coin-collector` → `beefor-master`

### Códigos de unlock secretos
- Hashes SHA-256 ficam em `unlockCodes.ts` (commitado)
- Códigos reais ficam em `codes.private.md` (gitignored)
- Script `npm run codes:hash` gera os hashes a partir do `.md`
- Validação via `crypto.subtle.digest` no renderer (sem Node)

### Ícones do App
- Variantes: orange, purple, flame, crowned, trophy, galaxy, diamond, master
- `useAppIconSync` rasteriza SVG → canvas PNG → IPC `win:setIcon` → `BrowserWindow.setIcon`

---

## Feature-Sliced Design (Renderer)

Cada feature em `src/renderer/features/{nome}/`:

```
features/
  {nome}/
    ├─ components/    # Componentes React da feature
    ├─ hooks/         # Hooks React específicos da feature
    ├─ utils/         # Utilitários da feature
    └─ index.ts       # Exports públicos
```

| Feature | Responsabilidade |
|---------|-----------------|
| `atividades` | Modal de atividades do Beefor |
| `coin2u` | Carteira Coin2U (saldo, shop, histórico, transferência) |
| `gamification` | Achievements, temas, ícones, unlock codes, streak badge |
| `kudo` | Envio e histórico de KudoCards |
| `team` | Lista do time, detalhes, aniversários |

---

## Providers e Contextos (Renderer)

```
App.tsx
  └─ IpcProvider          → injeta clients IPC via React context
       └─ SettingsProvider → settings lidos/escritos via IPC
            └─ ThemeProvider   → dark/light + preset de tema
                 └─ ToastProvider   → fila de toasts
                      └─ <páginas e features>
```

- **SettingsProvider**: aplica CSS custom properties (`--bg-0`, `--accent`, etc.) no `<html>`; theme presets sobrescrevem tokens via `resolvePresetTokens()`
- **ThemeProvider**: alterna `data-theme="dark"|"light"` no `<html>`; usa View Transition API para ripple
- **IpcProvider**: dependency injection — features consomem clients sem importar diretamente

---

## Build e Empacotamento

### Configurações TypeScript
| Arquivo | Escopo |
|---------|--------|
| `tsconfig.json` | Renderer (ES2022, React JSX, paths) |
| `tsconfig.main.json` | Main + automation + shared (CommonJS, Node) |

### Vite (renderer)
- Root: `src/renderer`
- Output: `dist/renderer`
- Dev port: `5177` (strict)
- `__APP_VERSION__` injetado via `define` a partir do `package.json`
- Path aliases: `@shared` → `src/shared`, `@renderer` → `src/renderer`

### Preload (main)
- Compilado separadamente por esbuild (`scripts/build-preload.mjs`)
- Output: `dist/main/preload.js`

### electron-builder
- App ID: `io.beefor.dev`
- Windows: NSIS oneClick, per-user, sem elevação
- macOS: DMG
- Playwright é unpacked do asar (binários nativos)
- Publish: GitHub Releases (`jhb404/BeeforDev`)

### Scripts principais
```bash
npm run dev           # Desenvolvimento (vite + tsc watch + electron)
npm run build         # Build completo (renderer + main)
npm run package:win   # Build + NSIS installer
npm run package:mac   # Build + DMG
npm run codes:hash    # Gera hashes SHA-256 de códigos de unlock
npm run lint          # tsc --noEmit + eslint (max-warnings 0)
npm run test          # Vitest
```

---

## Integração Coin2U

Sistema independente do Beefor — autenticação própria com email/senha separados.

```
coin2u/
  ├─ auth.ts        # Login, token refresh, sessão persistida
  ├─ cookieJar.ts   # Persistência de cookies
  ├─ endpoints.ts   # URLs da API Coin2U
  ├─ http.ts        # HTTP client com auth headers automáticos
  ├─ parsers.ts     # Parse de respostas da API
  └─ index.ts       # Inicialização
```

Sessão persistida criptografada. Se expirada, re-login automático com credenciais do keytar.

---

## Padrões e Convenções

### ActionResult<T>
Operações assíncronas expostas via IPC retornam `ActionResult<T>`:
```typescript
// src/shared/result.ts
type ActionResult<T = void> =
  | { ok: true; data: T extends void ? undefined : T }
  | { ok: false; error: string }

ok(data)    // → { ok: true, data }
fail(error) // → { ok: false, error }
withTimeout(promise, ms, label)
```

### Validação IPC
Todo handler IPC usa Zod:
```typescript
// src/main/ipc/schemas.ts
export const LoginArgsSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

// handler
const parsed = validate(schema, payload)
if (!parsed.ok) return parsed.result
```

### Seletores Playwright centralizados
Nenhum seletor hardcoded nos actions — todos em `beeforSelectors.ts`:
```typescript
export const SELECTORS = {
  moodButton: '[data-testid="mood-btn"]',
  timesheetRow: '.timesheet-entry',
  // ...
}
```

### Nomenclatura de canais IPC
- `domain:action` para chamadas renderer→main (ex: `creds:save`)
- `evt:eventName` para eventos main→renderer (ex: `evt:status`)
- `win:action` para controles de janela (ex: `win:minimize`)
