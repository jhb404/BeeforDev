# beefor Dev

Desktop app (Electron + React + TypeScript + Playwright) que automatiza ações repetitivas no [Beefor](https://app.beefor.io). Para uso pessoal/interno.

> **Importante:** o app **não burla** segurança, MFA ou CAPTCHA. Quando o site exigir autenticação extra, faça login manualmente uma vez — a sessão fica salva para os próximos usos.

## Funcionalidades

- Login automático com credenciais salvas no **Windows Credential Manager** (via `keytar`).
- Persistência de sessão via `storageState` do Playwright (cookies + localStorage).
- Restauração automática da sessão ao abrir o app.
- Ações: **Auto lançamento**, **Selecionar mood do dia**, **Logout**, **Abrir Beefor**.
- Autostart no Windows (configurável).
- Logs em tempo real, status de conexão e feedback visual de cada ação.

## Stack

| Camada | Tech |
|---|---|
| Shell desktop | Electron |
| UI | React + TypeScript + Vite |
| Automação | Playwright (Chromium) |
| Storage seguro | keytar (Windows Credential Manager / macOS Keychain) |
| Logs | electron-log |
| Build | electron-builder |
| Testes | vitest |

## Estrutura

```
src/
├── main/                    Electron main process
│   ├── index.ts             entry point
│   ├── window.ts            BrowserWindow
│   ├── preload.ts           context bridge
│   ├── ipcHandlers.ts       canais IPC
│   ├── autoStart.ts         login item
│   ├── secureStorage.ts     keytar wrapper
│   ├── sessionStore.ts      paths + settings
│   └── logger.ts            electron-log + IPC fan-out
│
├── automation/beefor/       Playwright layer
│   ├── beeforClient.ts      browser/context/page singleton
│   ├── beeforSelectors.ts   seletores centralizados c/ fallbacks
│   ├── beeforSession.ts     storageState load/persist
│   └── beeforActions.ts     login, autoLancamento, mood, logout
│
├── renderer/                React UI
│   ├── App.tsx
│   ├── pages/Home.tsx       status + ações + mood + logs
│   ├── pages/Settings.tsx   credenciais + autostart
│   ├── components/          StatusBadge, ActionButton, MoodPicker, LogPanel
│   └── hooks/               useBeefor, useLogs
│
└── shared/                  tipos, IPC channels, constantes
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Windows 10/11 (macOS suportado pela arquitetura, build não testada ainda)

## Rodar localmente

```powershell
npm install
# baixa o Chromium do Playwright (postinstall)
npm run dev
```

`npm run dev` sobe o Vite (renderer em `http://localhost:5177`) e o Electron com tsc em watch.

## Build para Windows

```powershell
npm run package:win
```

Saída: `release/Beefor Dev Setup x.y.z.exe` (NSIS). Para gerar ícone, coloque `build/icon.ico`.

## Build para macOS (futuro)

```bash
npm run package:mac
```

Requer assinatura/notarização configurada para distribuição fora do dev.

## Configuração inicial

1. Abra **Configurações**.
2. Preencha e-mail e senha → **Salvar** (gravados no Credential Manager).
3. Em **Início**, clique **Fazer login**. A sessão fica persistida.
4. Próximas vezes: o app restaura sessão sozinho ao abrir.

## Como funciona a automação

- `BeeforClient` mantém um **único** `Browser`/`BrowserContext`/`Page`.
- Chromium roda **headless** (invisível). Para depurar visualmente, defina `BEEFOR_HEADED=1` antes do `npm run dev`.
- Após login bem-sucedido, `context.storageState()` é gravado em `userData/beefor-session.json`.
- Em chamadas subsequentes o context é criado **com** esse storageState — sem login.
- Seletores ficam em `beeforSelectors.ts`. Cada ação tenta:
  1. texto/role estável (`Auto lançamento`, `Dia feliz`...)
  2. componente Angular Material (`app-time-sheet-beefor-button`, `mat-button-toggle`)
  3. fallback CSS (`button.mat-raised-button.mat-accent`)

Quando o Beefor mudar o HTML, atualize **só** `beeforSelectors.ts`.

## Segurança

- Senha **nunca** em texto puro: armazenada via keytar (Credential Manager no Windows, Keychain no macOS).
- Sessão Playwright em arquivo isolado em `app.getPath('userData')`.
- Context Isolation + preload com API tipada (`window.beefor`) — renderer sem Node access.
- O app respeita políticas do Beefor: MFA/CAPTCHA pedem intervenção manual.

## Testes

```powershell
npm test
```

Cobre selectors e canais IPC. Para testar fluxo Playwright real, faça login manual via `npm run dev`.

## Próximos passos sugeridos

- Adicionar telemetria local (lançamentos por dia).
- Agendar `Auto lançamento` automaticamente em horário fixo.
- Expandir `beeforActions.ts` com novas operações.
- Empacotar `playwright-core` apenas (sem o SDK completo) para reduzir tamanho.

## Troubleshooting

| Problema | Solução |
|---|---|
| `keytar` falha no install | Garanta build tools do Windows: `npm i -g windows-build-tools` (legacy) ou Visual Studio Build Tools 2022 |
| Chromium não baixa | `npx playwright install chromium` manualmente |
| Sessão expira sempre | Verifique se o Beefor exige MFA — login manual primeiro |
| Botão Auto lançamento não encontrado | Beefor mudou HTML — atualize `beeforSelectors.ts` |
