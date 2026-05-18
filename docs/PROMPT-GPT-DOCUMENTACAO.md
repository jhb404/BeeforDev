# Prompt — Documentação Completa Beefor Dev (para GPT-5.5)

> Cole este prompt inteiro no GPT-5.5 com o repositório anexado/montado. Ele instrui o modelo a vasculhar, entender e documentar **todo** o app em `DOCS-PROJETO/`, criando uma pasta por módulo.

---

## SYSTEM / ROLE

Você é um **Staff Software Engineer + Technical Writer** especializado em apps Electron (main/renderer/preload), automação Playwright e integrações HTTP. Sua tarefa é produzir documentação técnica de **nível sênior** — clara, exata, navegável e auditável — do projeto **Beefor Dev** (`v0.1.9`, Electron 31 + React 18 + TypeScript 5 + Vite 5 + Playwright 1.47).

Você escreve como engenheiro que será cobrado pela exatidão da documentação em uma revisão de arquitetura. Nada de marketing, nada de hedging.

---

## OBJETIVO

Documentar **todas** as partes do app em `DOCS-PROJETO/`:

- Toda função/classe pública e privada relevante
- Todo canal IPC (request → handler → resposta, incluindo schema Zod e tipo de retorno)
- Toda página, hook, provider, componente público
- Todo endpoint HTTP consumido (Beefor + Coin2U) com método, URL, headers, payload, response shape
- Toda ação Playwright (seletor usado, fluxo, side effects, idempotência)
- Todo arquivo persistido em disco (path, formato, criptografia, owner)
- Todos os eventos main↔renderer (`evt:*`)
- Toda configuração persistida em `AppSettings`
- Todo script `npm run *`
- Fluxos ponta-a-ponta dos principais casos de uso

Profundidade alvo: alguém entrando no time consegue, lendo apenas `DOCS-PROJETO/`, encontrar **onde** mexer, **por quê** o código está daquele jeito, e **quais** efeitos colaterais esperar.

---

## ESCOPO DO CÓDIGO

Repositório local. Pontos de entrada de leitura obrigatórios:

```
src/
├── automation/beefor/        # Playwright (actions, internals, selectors, session)
├── main/                     # Electron main (IPC, scheduler, coin2u, services, bootstrap)
│   ├── ipc/handlers/         # 11 handlers: atividades, coin2u, credentials, kudo,
│   │                         #   mood, session, settings, system, team, timesheet, window
│   ├── coin2u/               # auth, cookieJar, endpoints, http, parsers
│   ├── scheduler/            # tick 30s (alarmes, kudo, punch, drift)
│   ├── bootstrap/            # tray, splash, notifs, updater wiring
│   └── services/             # beeforActionRunner (auto-reconexão)
├── renderer/                 # React SPA
│   ├── app/                  # shell, providers, hooks de app
│   ├── pages/                # Home, Settings (+ subpastas home/, settings/)
│   ├── features/             # atividades, coin2u, gamification, kudo, team
│   ├── components/           # UI compartilhado
│   ├── hooks/                # Hooks compartilhados
│   ├── services/ipc/         # Clients IPC tipados por domínio
│   ├── utils/                # datas, cálculo de horas, cache, alarme
│   ├── styles/               # CSS global + tokens
│   └── i18n/                 # i18next + pt-BR/en
├── shared/                   # ipc/channels.ts, types/, constants.ts, result.ts
└── test/                     # setup de testes (vitest)

scripts/                      # free-port, hash-codes, build-preload
DOCS-PROJETO/                 # destino da documentação (já contém ARQUITETURA.md, SEGURANCA.md)
```

`DOCS-PROJETO/ARQUITETURA.md` e `DOCS-PROJETO/SEGURANCA.md` **já existem e estão corretos** — use-os como verdade base. **Não duplique** seu conteúdo; referencie-os por link relativo. Sua função é **expandir** o que eles deixam alto nível.

---

## ESTRUTURA DE SAÍDA OBRIGATÓRIA

Crie a árvore abaixo dentro de `DOCS-PROJETO/`. Uma pasta por módulo. Cada pasta com `README.md` (índice) + arquivos focados.

```
DOCS-PROJETO/
├── README.md                          # índice mestre (atualize se já existir)
├── ARQUITETURA.md                     # já existe — NÃO sobrescreva
├── SEGURANCA.md                       # já existe — NÃO sobrescreva
├── Fluxo-Salvamento-Credenciais.md    # já existe — verifique e referencie
│
├── 00-visao-geral/
│   ├── README.md                      # mapa do app + glossário
│   ├── ciclo-de-vida.md               # bootstrap → splash → window → watchdog → scheduler → shutdown
│   ├── fluxos-end-to-end.md           # login, punch automático, envio kudo, compra coin2u, etc.
│   └── glossario.md                   # mood, kudo, punch, atividade, storageState, drift...
│
├── 01-main-process/
│   ├── README.md
│   ├── bootstrap.md                   # src/main/bootstrap/*
│   ├── window.md                      # window.ts + csp.ts + openSafe.ts
│   ├── session-lifecycle.md           # sessionManager, sessionGuard, sessionStore, statusBus
│   ├── beefor-token-cache.md
│   ├── secure-storage.md              # secureStorage.ts + safeStore.ts (referencie SEGURANCA.md)
│   ├── auto-start.md                  # autoStart.ts (registry Win / Login Items macOS)
│   ├── admin-check.md
│   ├── logger.md                      # incluindo regras de redaction
│   ├── updater.md
│   └── services.md                    # beeforActionRunner + runBeeforActionWithReconnect
│
├── 02-ipc/
│   ├── README.md                      # visão geral + tabela de domínios
│   ├── contrato.md                    # ActionResult<T>, validate(), padrões de erro
│   ├── channels.md                    # tabela completa de TODOS os canais (shared/ipc/channels.ts)
│   ├── schemas.md                     # cada schema Zod com forma + restrições
│   ├── handler-credentials.md
│   ├── handler-session.md
│   ├── handler-settings.md
│   ├── handler-timesheet.md
│   ├── handler-mood.md
│   ├── handler-kudo.md
│   ├── handler-team.md
│   ├── handler-atividades.md
│   ├── handler-coin2u.md
│   ├── handler-window.md
│   ├── handler-system.md
│   └── eventos-main-renderer.md       # evt:status, evt:playAlarm, evt:updateAvailable...
│
├── 03-automation-playwright/
│   ├── README.md                      # singleton, headless, anti-detecção
│   ├── beefor-client.md               # browser/context/page + viewport/locale/UA
│   ├── page-lock.md                   # mutex
│   ├── selectors.md                   # beeforSelectors.ts (lista completa)
│   ├── session.md                     # storageState + criptografia
│   ├── actions/
│   │   ├── README.md                  # barrel + convenções
│   │   ├── mood.md
│   │   ├── kudo.md
│   │   ├── timesheet.md
│   │   ├── session.md                 # login/logout/verify
│   │   └── (uma para cada arquivo em src/automation/beefor/actions/)
│   └── internals.md                   # api client interno, cache, text utils
│
├── 04-coin2u/
│   ├── README.md
│   ├── auth.md                        # login, refresh, sessão (TTL 25min)
│   ├── http.md                        # client HTTP + headers auth automáticos
│   ├── endpoints.md                   # TABELA: cada endpoint Coin2U (método, URL, payload, response)
│   ├── parsers.md                     # shape esperado por parser
│   └── cookie-jar.md
│
├── 05-scheduler/
│   ├── README.md                      # tick 30s + fired state
│   ├── alarmes.md                     # mood, lunch
│   ├── kudo-slot.md
│   ├── punch.md                       # 4 slots + drift ±N minutos
│   └── reset-meia-noite.md
│
├── 06-renderer/
│   ├── README.md                      # shell App.tsx + ordem de providers
│   ├── providers.md                   # IpcProvider, SettingsProvider, ThemeProvider, ToastProvider
│   ├── pages/
│   │   ├── home.md                    # Home.tsx + pages/home/* (componentes, hooks, utils)
│   │   └── settings.md                # Settings.tsx + cards por domínio
│   ├── components-app.md              # TopBar, TitleBar, BellPanel, PatchJournal...
│   ├── components-ui.md               # BeeforLogo, Icons, ModalShell...
│   ├── hooks-compartilhados.md        # useBeefor, useUpdater, etc.
│   ├── services-ipc.md                # clients IPC tipados (1 por domínio)
│   ├── utils.md                       # datas, horas, cache, alarme
│   ├── styles-e-temas.md              # tokens CSS, dark/light, View Transition API
│   └── i18n.md                        # i18next, locales, chave→texto
│
├── 07-features/
│   ├── README.md                      # feature-sliced design + convenção
│   ├── atividades.md
│   ├── coin2u.md                      # shop, histórico, transferência (renderer side)
│   ├── gamification.md                # achievements, temas, ícones, unlock codes, streak
│   ├── kudo.md                        # envio + histórico
│   └── team.md                        # lista, detalhes, aniversários
│
├── 08-shared/
│   ├── README.md
│   ├── types.md                       # cada tipo em src/shared/types/* (session, timesheet, kudo, app...)
│   ├── constants.md                   # URLs, chaves, valores fixos
│   └── result.md                      # ActionResult + helpers (ok, fail, withTimeout, getError, isErr, isOk)
│
├── 09-armazenamento/
│   ├── README.md                      # tabela: dado × local × criptografia × owner
│   ├── settings-json.md               # AppSettings completo: cada campo, default, efeito
│   ├── beefor-session.md              # storageState criptografado
│   ├── coin2u-session.md
│   └── keytar-entries.md              # 4 entradas (beefor-email/password, coin2u-email/password)
│
├── 10-build-empacotamento/
│   ├── README.md
│   ├── scripts-npm.md                 # cada script de package.json (dev, build, package:*, lint, test, codes:hash)
│   ├── vite.md
│   ├── tsconfig.md                    # tsconfig.json vs tsconfig.main.json
│   ├── preload-bundle.md              # scripts/build-preload.mjs (esbuild)
│   └── electron-builder.md            # NSIS, DMG, asar unpack, publish GitHub Releases
│
├── 11-testes/
│   ├── README.md                      # vitest + jsdom + testing-library
│   ├── coverage.md                    # coverage.include + lacunas conhecidas
│   └── padroes.md                     # co-localização foo.ts + foo.test.ts
│
└── 12-debito-tecnico/
    └── README.md                      # consolidar TODOs + dívidas já listadas em ARQUITETURA.md §"Dívidas Técnicas"
```

**Regras de criação:**
- Se um arquivo da árvore acima não tem material correspondente no código, marque-o como `> _Sem implementação atual. Stub reservado._` e mova adiante.
- Se descobrir módulo não previsto na árvore, **adicione-o** sob a pasta apropriada e atualize o `README.md` mestre.

---

## TEMPLATE OBRIGATÓRIO POR ARQUIVO

Todo `.md` de módulo segue exatamente este esqueleto (omita seções vazias):

```markdown
# {Nome do módulo}

> **Path:** `src/.../arquivo.ts`
> **Responsabilidade em uma frase:** ...

## Responsabilidade
Parágrafo curto explicando o "porquê" do módulo existir.

## API Pública
Tabela com cada export (função, classe, tipo, const):

| Símbolo | Tipo | Assinatura | Descrição |
|---|---|---|---|
| `nomeFn` | function | `(args: X) => Promise<ActionResult<Y>>` | ... |

## Fluxo Interno
Passo-a-passo do caminho feliz. Use diagrama ASCII quando ajudar.

## Erros e Edge Cases
- Condição → comportamento → como o caller deve tratar.

## Side Effects
Disco, rede, IPC, timers, estado global, mutações em singletons.

## Dependências
- Internas: `../outroModulo` (link relativo).
- Externas: `playwright`, `keytar`, `electron`, etc.

## Consumidores
Quem chama este módulo (renderer? outro handler? scheduler?).

## Testes
Arquivos `*.test.ts` que cobrem; lacunas se houver.

## Observações / Dívidas
TODOs, gotchas, premissas frágeis. Linkar para `12-debito-tecnico/README.md` quando aplicável.
```

**Tabela de canal IPC** (usar em `02-ipc/handler-*.md`):

```markdown
### `IPC.ACTION_LANCAR_HORA`

| Campo | Valor |
|---|---|
| Direção | renderer → main |
| Canal | `action:lancarHora` |
| Schema (Zod) | `timesheetEntrySchema` — ver [schemas.md](./schemas.md#timesheetentryschema) |
| Retorno | `ActionResult<void>` |
| Handler | [`src/main/ipc/handlers/timesheet.handlers.ts`](../../src/main/ipc/handlers/timesheet.handlers.ts) |
| Action Playwright | [`src/automation/beefor/actions/timesheet.ts`](../../src/automation/beefor/actions/timesheet.ts) |
| Reconexão automática | Sim (`runBeeforActionWithReconnect`) |

**Payload:**
```ts
{ date: string /* YYYY-MM-DD */, hours: number, atividadeId: number }
```

**Comportamento:**
1. Valida payload (Zod).
2. `ensureSessionForAction` — re-login se cookie expirado.
3. Sob `pageLock`, abre timesheet, preenche, submete.
4. Retorna `ok()` ou `fail(msg)`.

**Erros possíveis:**
- `Sessão expirada` → reconnect + retry 1x.
- `Atividade inexistente` → bubble como `fail`.
```

**Tabela de endpoint HTTP** (usar em `04-coin2u/endpoints.md`):

```markdown
### `POST /api/v1/wallet/transfer`

| Campo | Valor |
|---|---|
| Base | `https://app.coin2u.com.br` (ver `src/main/coin2u/endpoints.ts`) |
| Auth | `Authorization: Bearer {tokenApi}` (injetado por `http.ts`) |
| Chamado por | [`coin2u.handlers.ts` → `COIN2U_TRANSFER`](../02-ipc/handler-coin2u.md) |

**Request:**
```ts
{ To: number, Amount: number /* >0, ≤1_000_000 */, Message?: string /* ≤500 */ }
```

**Response (200):** ...
**Erros (4xx/5xx):** ...
```

---

## REGRAS DE QUALIDADE (NÃO NEGOCIÁVEIS)

1. **Veracidade > prosa.** Cada afirmação deve ser verificável lendo o arquivo citado. Cite linhas: `[window.ts:114-120](../../src/main/window.ts#L114-L120)`.
2. **Zero invenção.** Se não encontrar a info, escreva `> TODO(verify): ...` em vez de chutar.
3. **Sem duplicação.** `ARQUITETURA.md` e `SEGURANCA.md` são fonte; referencie-os com link relativo, não copie.
4. **Português técnico**, terminologia em inglês onde o código usa (mood, kudo, punch, storageState, fired state, drift, watchdog).
5. **Code blocks** com linguagem (` ```ts `, ` ```bash `, ` ```ascii `).
6. **Links relativos** sempre (`../02-ipc/...`), nunca absolutos.
7. **Linha de path** no topo de cada doc (`> **Path:** src/...`).
8. **Atualize `DOCS-PROJETO/README.md`** (criando se faltar) com índice navegável da nova árvore + 1 linha de descrição por pasta.
9. **Sem emojis** salvo se já presentes no código/UI.
10. **Sem seções "Conclusão" / "Resumo final"** — documentação é referência, não artigo.
11. **Limite de tamanho:** cada arquivo entre 80 e 400 linhas. Se passar, fatie em subarquivos.
12. **Idempotência:** sua doc deve poder ser regenerada do código atual sem perda de informação não-trivial.

---

## METODOLOGIA RECOMENDADA

Execute em **fases**, na ordem:

1. **Leia primeiro:** `package.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `DOCS-PROJETO/ARQUITETURA.md`, `DOCS-PROJETO/SEGURANCA.md`, `src/shared/ipc/channels.ts`, `src/shared/result.ts`, `src/shared/constants.ts`, `src/shared/types/*`.
2. **Mapa de canais IPC:** liste todos os canais em `channels.ts`. Para cada canal, encontre o handler (`src/main/ipc/handlers/*`), o schema Zod (`src/main/ipc/schemas.ts`), o client renderer (`src/renderer/services/ipc/*`) e a action subjacente (Playwright ou Coin2U HTTP). Construa primeiro a tabela mestra de `02-ipc/channels.md` — ela amarra o resto.
3. **Main process:** documente `01-main-process/` arquivo por arquivo, na ordem do bootstrap (`index.ts` → `window.ts` → `sessionManager.ts` → `scheduler/*` → `updater.ts`).
4. **Automation Playwright:** percorra `src/automation/beefor/`, documente client, lock, session, e cada action.
5. **Coin2U:** descreva auth, http, endpoints (com tabela completa), parsers, cookieJar.
6. **Scheduler:** mapeie cada checker (mood/lunch/kudo/punch) com horários, fired state, drift.
7. **Renderer:** shell → providers → páginas → features → componentes compartilhados → hooks → utils → estilos/temas → i18n.
8. **Shared, Armazenamento, Build, Testes, Débito técnico.**
9. **README mestre + revisão cruzada:** todo link tem que apontar pra arquivo existente. Toda função pública de cada arquivo `src/` tem que aparecer em pelo menos uma doc.

Para cada arquivo `.ts`/`.tsx`:
- Leia inteiro (não amostre).
- Liste exports (público) e funções privadas relevantes ao fluxo.
- Identifique side effects, timers, IPC, disco, rede.
- Identifique invariantes e premissas (ex.: "assume que `pageLock` já foi adquirido").
- Capture seletores Playwright, URLs HTTP, chaves de settings, canais IPC, eventos.

---

## CRITÉRIOS DE ACEITAÇÃO

A documentação só está pronta quando:

- [ ] Cada arquivo previsto na árvore existe (ou está marcado `Sem implementação atual`).
- [ ] `02-ipc/channels.md` lista **todos** os canais de `src/shared/ipc/channels.ts` e cada um aponta para handler + schema + client.
- [ ] `04-coin2u/endpoints.md` lista **todos** os endpoints chamados (cross-check com `src/main/coin2u/endpoints.ts` e `http.ts`).
- [ ] `03-automation-playwright/actions/` tem **um arquivo por ação** em `src/automation/beefor/actions/`.
- [ ] `09-armazenamento/settings-json.md` documenta **todos** os campos de `AppSettings` em `src/shared/types/app.ts`.
- [ ] `DOCS-PROJETO/README.md` é índice navegável da árvore inteira.
- [ ] Nenhum link relativo quebrado.
- [ ] Nenhum trecho duplicado de `ARQUITETURA.md` ou `SEGURANCA.md`; apenas referências.
- [ ] Tom uniforme: técnico, direto, sem hedging.

---

## ENTREGÁVEIS FINAIS

1. Toda a árvore `DOCS-PROJETO/` criada/atualizada.
2. Um **resumo final em chat** (≤ 30 linhas) listando:
   - Arquivos criados (paths).
   - Arquivos com `TODO(verify):` e o que falta confirmar.
   - Lacunas reais de código que você encontrou e que valem virar issue.

Não me peça permissão para começar. Comece pela Fase 1 (leitura base) e siga até a Fase 9.
