# Segurança — Beefor Dev

Versão `0.1.9` · Electron 31 + Node 20 + zod 4 + esbuild

---

## Visão Geral

Beefor Dev opera com credenciais e tokens de dois sistemas externos (Beefor e Coin2U) e mantém sessão autenticada via Playwright e HTTP direto. Este documento descreve as defesas aplicadas em cada camada — armazenamento, IPC, renderer e auditoria — e os trade-offs assumidos.

**Score atual: 8.5/10.** Os 1.5 pontos restantes ficam para `v1.0` (code signing + lock down de tokens em disco).

```
┌──────────────────────────────────────────────────────────────────┐
│  Camadas de Defesa                                               │
│                                                                  │
│  [Renderer React]    sandbox + contextIsolation + CSP            │
│         │ IPC                                                    │
│         ▼                                                        │
│  [Preload bundle]    contextBridge único arquivo (esbuild)       │
│         │                                                        │
│         ▼                                                        │
│  [Main process]      zod IPC validation + permission lock        │
│         │                                                        │
│         ▼                                                        │
│  [Disco]             safeStorage (DPAPI/Keychain) + keytar       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Armazenamento de Credenciais

### 1.1. Senhas (Beefor + Coin2U)

Credenciais são persistidas via [keytar](https://www.npmjs.com/package/keytar), que delega ao credential store nativo do OS:

| Plataforma | Backend | Mecanismo |
|------------|---------|-----------|
| Windows    | Credential Manager | DPAPI (`CryptProtectData`) |
| macOS      | Keychain Services  | Keychain APIs |
| Linux      | libsecret          | gnome-keyring / kwallet |

Implementação em [src/main/secureStorage.ts](../src/main/secureStorage.ts) e [src/main/coin2u/auth.ts:269-291](../src/main/coin2u/auth.ts). Quatro entradas totais no keychain:

| service | account | conteúdo |
|---------|---------|----------|
| `beefor-dev` | `beefor-email` | email Beefor |
| `beefor-dev` | `beefor-password` | senha Beefor |
| `beefor-dev` | `coin2u-email` | email Coin2U |
| `beefor-dev` | `coin2u-password` | senha Coin2U |

**Garantias:**
- Plaintext nunca toca o disco do app.
- Chave de criptografia derivada do perfil Windows do user (LSA secret + master key vinculada ao SID).
- Outro user na mesma máquina **não** consegue ler.
- Disco roubado ou backup vazado: blob inútil sem a senha Windows do owner.

**Limitações:**
- Malware rodando como o user atual chama a mesma API e decifra. DPAPI não defende contra esse cenário (limitação fundamental).
- Duas entradas separadas (email + password) — write não-atômico. Se a segunda chamada falhar, o email fica salvo sem senha. Mitigação futura: serializar JSON em entrada única.

### 1.2. Sessão Beefor (Playwright storageState)

Após login bem-sucedido, Playwright extrai cookies + localStorage e persiste em `userData/beefor-session.json`. Esse arquivo contém o **token JWT vivo** do Beefor.

**Antes da v0.1.9:** plaintext no disco. Qualquer processo do user lia.

**Atual:** criptografado via Electron `safeStorage` ([src/main/safeStore.ts](../src/main/safeStore.ts)), com header mágico `BFRENC1\0` para identificar blobs criptografados. Implementação em [src/automation/beefor/beeforSession.ts](../src/automation/beefor/beeforSession.ts).

**Migração:** o `decryptSessionBuffer` aceita arquivos legados plaintext. Próximo `persist()` re-criptografa automaticamente. Zero ação manual do user.

### 1.3. Sessão Coin2U

`userData/coin2u-session.json` contém `userId`, `tokenApi` e cookies da API Coin2U (TTL 25 min).

**Atual:** mesmo esquema de `safeStorage` aplicado em [src/main/coin2u/auth.ts:57-94](../src/main/coin2u/auth.ts).

---

## 2. Isolamento Renderer ↔ Main

### 2.1. webPreferences

[src/main/window.ts](../src/main/window.ts):

```ts
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  disableBlinkFeatures: 'Auxclick',
}
```

| Flag | Efeito |
|------|--------|
| `contextIsolation: true` | Renderer não acessa `window.electron` global; só `window.beefor` exposto via `contextBridge`. |
| `nodeIntegration: false` | Renderer não tem `require`, `process`, `__dirname`, `Buffer`. |
| `sandbox: true` | Renderer roda em sandbox Chromium (job object + restricted token no Win, seatbelt no macOS). XSS hipotético fica preso na sandbox. |
| `disableBlinkFeatures: 'Auxclick'` | Middle-click em links não dispara `window.open` que ignora `setWindowOpenHandler`. Flagged por Electronegativity. |

### 2.2. Preload bundle

Sandbox preload no Electron **não suporta** `require` cross-directory. A solução padrão é empacotar o preload em um arquivo único.

Implementação:
- [scripts/build-preload.mjs](../scripts/build-preload.mjs) roda esbuild com `bundle: true`, `platform: 'browser'`, `external: ['electron']`.
- Resultado: `dist/main/preload.js` (~9 KB CJS) com todos os imports inline.
- Integrado ao `build:main` em [package.json](../package.json).

O preload expõe apenas funções IPC tipadas via `contextBridge.exposeInMainWorld('beefor', api)` — nenhum objeto Node escapa para o renderer.

### 2.3. Content-Security-Policy

[src/main/csp.ts](../src/main/csp.ts) instala a CSP via `session.defaultSession.webRequest.onHeadersReceived`. Cabeçalho aplicado a toda resposta HTTP/file.

**Política prod:**

```
default-src 'self' file:;
script-src 'self' file:;
style-src 'self' 'unsafe-inline' file:;
img-src 'self' data: blob: https: file:;
font-src 'self' data: file:;
connect-src 'self' https://app.beefor.io https://apiteams.goobee.com.br https://app.coin2u.com.br file:;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'none';
```

**Política dev:** relaxa `script-src` com `'unsafe-eval' 'unsafe-inline'` + origin `http://localhost:5177` + WS, necessário para HMR do Vite.

**Por que `file:`:** packaged renderer carrega via `file://`, e Chromium trata file: como null origin. Sem `file:` no allow-list, scripts e estilos relativos quebram.

**Rollback de emergência:** `BEEFOR_CSP=0` desativa CSP em prod sem rebuild ([src/main/index.ts:60](../src/main/index.ts)).

### 2.4. Permission handler

Toda permission Web é negada (notifications, geolocation, mídia, USB, MIDI, etc.). [src/main/index.ts](../src/main/index.ts):

```ts
session.defaultSession.setPermissionRequestHandler((_wc, _permission, cb) => cb(false));
session.defaultSession.setPermissionCheckHandler(() => false);
```

O app fala com o OS exclusivamente via IPC do main process, então o renderer nunca precisa dessas APIs.

### 2.5. Lock de navegação

[src/main/window.ts:114-120](../src/main/window.ts):

```ts
win.webContents.on('will-navigate', (event, url) => {
  const allowed = url.startsWith('http://localhost:5177') || url.startsWith('file://');
  if (!allowed) {
    event.preventDefault();
    void openExternalSafe(url);
  }
});
```

XSS que tente redirecionar `location.href = 'evil.com'` é bloqueado. A URL é roteada para o browser do OS após passar pela validação de `openExternalSafe`.

### 2.6. openExternalSafe

[src/main/openSafe.ts](../src/main/openSafe.ts) valida toda URL antes de chamar `shell.openExternal`. Allow-list: `https:` e `mailto:`. Bloqueia `file:`, `javascript:`, custom schemes, URLs malformadas.

`shell.openExternal` é um vetor conhecido — uma URL com scheme custom pode acionar handler do OS para execução local. A validação centralizada elimina esse vetor em todos os pontos de uso (open Beefor, will-navigate, setWindowOpenHandler).

---

## 3. Validação de IPC (zod)

### 3.1. Motivação

Sem validação, um renderer comprometido (via XSS, supply chain do bundle, etc.) pode enviar qualquer payload aos handlers do main. Cada handler precisaria validar manualmente — propenso a erro.

### 3.2. Implementação

Schemas centralizados em [src/main/ipc/schemas.ts](../src/main/ipc/schemas.ts):

```ts
export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export const coin2uTransferSchema = z.object({
  To: z.number().int().positive(),
  Amount: z.number().int().positive().max(1_000_000),
  Message: z.string().max(500).default(''),
});
// ...
```

Helper de validação em [src/main/ipc/validate.ts](../src/main/ipc/validate.ts) retorna `{ ok: true, data }` ou `{ ok: false, result: fail(...) }` — handler usa short-circuit:

```ts
ipcMain.handle(IPC.CREDS_SAVE, async (_e, payload: unknown) => {
  const parsed = validate(credentialsSchema, payload);
  if (!parsed.ok) return parsed.result;
  await saveCredentials(parsed.data);
  return ok();
});
```

### 3.3. Cobertura

Handlers com validação aplicada:

| Domínio | Handler | Schema |
|---------|---------|--------|
| Credentials | `CREDS_SAVE` | `credentialsSchema` |
| Coin2U | `COIN2U_SAVE_CREDS`, `COIN2U_BUY_ITEM`, `COIN2U_TRANSFER` | `coin2uCredentialsSchema`, `coin2uBuyItemSchema`, `coin2uTransferSchema` |
| Mood | `ACTION_SELECT_MOOD` | `moodSchema` |
| Kudo | `ACTION_KUDO_DETAIL`, `ACTION_SEARCH_KUDO_RECIPIENT`, `ACTION_SEND_KUDO_CARD` | `kudoDetailIdSchema`, `kudoSearchArgsSchema`, `sendKudoCardSchema` |
| Timesheet | `ACTION_LANCAR_HORA`, `ACTION_FETCH_TIMESHEET` | `timesheetEntrySchema`, `fetchTimesheetArgsSchema` |

Falhas de validação retornam erro genérico (`Payload inválido`) e logam summary truncado (3 issues) sem expor o payload.

---

## 4. Logger

[src/main/logger.ts](../src/main/logger.ts) aplica redaction antes de gravar:

```ts
function redact(input: string): string {
  return input
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(
      /(["']?(?:password|senha|token|tokenApi|TokenApi|apitoken|authorization|secret)["']?\s*[:=]\s*)["']?[^"',\s}]+["']?/gi,
      '$1<redacted>',
    )
    .replace(/\bBearer\s+[A-Za-z0-9._-]{16,}\b/g, 'Bearer <token>');
}
```

**Mascara:** emails, senhas, tokens em pares key:value, Bearer tokens longos.

**Preserva:** estrutura da mensagem, IDs numéricos, timestamps, mensagens de erro.

Logs ficam em `userData/logs/main.log`. Suporte pode coletar logs do user sem exposição de PII direta.

---

## 5. Auditoria

### 5.1. Electronegativity

Scanner especializado em padrões inseguros de Electron, mantido pela Doyensec.

**Como rodar:**

```bash
npm i -g @doyensec/electronegativity
electronegativity -i ./src -o report.csv
```

**Resultado v0.1.9:** 0 HIGH, 9 MEDIUM (5 false positives, 4 fixados).

Fixados:
- `AUXCLICK_JS_CHECK` × 2 → `disableBlinkFeatures: 'Auxclick'` em ambas as janelas.
- `OPEN_EXTERNAL_JS_CHECK` × 3 → centralizado em `openExternalSafe` com allow-list.

False positives ignorados (com justificativa):
- `CSP_GLOBAL_CHECK` LOW — CSP montada dinamicamente, scanner não parseia.
- `HTTP_RESOURCES_JS_CHECK` MEDIUM — `http://localhost:5177` é só dev.
- `REMOTE_MODULE_JS_CHECK` × 2 — módulo `remote` removido em Electron 14+, não usamos.
- `PRELOAD_JS_CHECK` MEDIUM — informa que preload existe, esperado.

### 5.2. Dependabot

Configurado em [.github/dependabot.yml](../.github/dependabot.yml). Roda toda segunda 09:00 BRT, abre até 5 PRs/semana:

- Dependências npm agrupadas (`dev-dependencies` / `prod-minor-patch`).
- GitHub Actions versões.

Bugs críticos em deps (Log4Shell, xz-utils backdoor, etc.) são vetor #1 em apps modernos. Dependabot cobre o que humano não vigia.

---

## 6. Auto-updater

[src/main/updater.ts](../src/main/updater.ts) usa `electron-updater` apontando para GitHub Releases ([package.json:publish](../package.json)).

**Atual:**
- Download automático em background.
- Instalação na próxima saída ou via botão "Instalar agora" no toast.
- Validação SHA512 do `latest.yml` (electron-updater built-in).

**Limitações:**
- App **não é assinado** (sem code signing). SmartScreen do Windows mostra warning "Windows protegeu seu PC" no primeiro install. Auto-update funciona mas reinstalação fricciona.
- Validação SHA512 vem do mesmo host (GitHub releases) — se atacante comprometer o repo, `latest.yml` e o binário batem entre si.

**Plano v1.0:** Azure Trusted Signing ($10/mês) ou cert OV/EV. Resolve SmartScreen e impede sequestro de update.

---

## 7. Roadmap pós-MVP

| Fase | Item | Ganho | Custo |
|------|------|-------|-------|
| v0.1.9 (atual) | safeStorage + CSP + sandbox + zod + permission lock + logger redact + Dependabot | 5 → 8.5 | feita |
| v0.2 | Rate-limit IPC (zod já cobre payload; falta flood) | +0.1 | 30min |
| v0.2 | IPC `senderFrame` check (defesa subframe) | +0.1 | 15min |
| v1.0 | Code signing (Azure Trusted Signing) | +0.3 | $120/ano + 2h |
| v1.0 | Tokens só em RAM (sem persistência disco) | +0.2 | UX trade-off (re-login a cada abertura) |
| v1.0 | Migração automation Beefor para HTTP puro (sem Playwright Chromium desatualizado) | +0.2 | dias |
| v1.1 | Pentest externo / bug bounty | +0.5 | $500-5k |

**Teto realista:** 9.5/10. 10/10 não existe em desktop — atacante com acesso ao user-space sempre vence eventualmente (DPAPI, sandbox, code signing — nada disso defende contra malware logado como o user).

---

## 8. Modelo de Ameaças

### O que defendemos contra

| Cenário | Defesa |
|---------|--------|
| Disco roubado / backup vazado | safeStorage DPAPI |
| Outro user Windows na mesma máquina | DPAPI bind ao SID + keytar |
| XSS no renderer | CSP + sandbox + contextIsolation |
| RCE via supply chain de dep | Dependabot + zod IPC validation |
| Redirect de navegação malicioso | will-navigate lock + openExternalSafe |
| Phishing via URL custom-scheme | openExternalSafe allow-list |
| Vazamento PII em log | logger redaction |

### O que NÃO defendemos contra

| Cenário | Por quê |
|---------|---------|
| Malware rodando como o user atual | DPAPI decifra no contexto do user — limitação OS |
| Acesso físico com user logado | Tela desbloqueada = game over |
| 0-day Chrome / Node | Depende do ciclo de release Electron |
| Insider com Windows admin | Pode dump LSA secret e quebrar DPAPI |
| Atacante com acesso ao GitHub do projeto | Sem code signing, pode publicar release maliciosa |

---

## 9. Arquivos relevantes

```
src/main/
├── safeStore.ts            ← helper encrypt/decrypt safeStorage
├── secureStorage.ts        ← keytar para credenciais Beefor
├── csp.ts                  ← política Content-Security-Policy
├── openSafe.ts             ← validação de URL antes de openExternal
├── logger.ts               ← redaction de PII
├── window.ts               ← webPreferences + will-navigate
├── index.ts                ← permission handler + bootstrap CSP
├── coin2u/auth.ts          ← keytar Coin2U + sessão criptografada
└── ipc/
    ├── schemas.ts          ← zod schemas IPC
    ├── validate.ts         ← helper de validação
    └── handlers/           ← handlers com validate()

scripts/
└── build-preload.mjs       ← esbuild bundle do preload (sandbox-safe)

.github/
└── dependabot.yml          ← scan semanal de deps
```
