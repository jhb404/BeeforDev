# Beefor Dev - Documentacao Tecnica

> **Path:** `DOCS-PROJETO/README.md`
> **Responsabilidade em uma frase:** Indice navegavel da documentacao tecnica gerada a partir do codigo do repo `4039c59`.

## Responsabilidade
Este indice aponta para os modulos documentados em `DOCS-PROJETO/`. Use [ARQUITETURA.md](./ARQUITETURA.md) e [SEGURANCA.md](./SEGURANCA.md) como base de arquitetura e seguranca; os arquivos abaixo expandem detalhes operacionais, contratos e efeitos colaterais.

## Indice
| Pasta | Conteudo |
|---|---|
| [00-visao-geral](./00-visao-geral/README.md) | mapa do app, ciclo de vida, fluxos end-to-end e glossario. |
| [01-main-process](./01-main-process/README.md) | bootstrap Electron, janela, sessao, storage seguro, updater e services. |
| [02-ipc](./02-ipc/README.md) | contrato IPC, canais, schemas, handlers e eventos main-renderer. |
| [03-automation-playwright](./03-automation-playwright/README.md) | singleton Playwright, page lock, storageState, seletores e actions Beefor. |
| [04-coin2u](./04-coin2u/README.md) | auth, HTTP client, endpoints, parsers e cookie jar Coin2U. |
| [05-scheduler](./05-scheduler/README.md) | tick de 30s, alarmes, kudo slot, punch drift e reset diario. |
| [06-renderer](./06-renderer/README.md) | shell React, providers, paginas, componentes, hooks, IPC clients, styles e i18n. |
| [07-features](./07-features/README.md) | atividades, Coin2U, gamification, kudo e team no renderer. |
| [08-shared](./08-shared/README.md) | tipos, constantes, canais IPC e `ActionResult`. |
| [09-armazenamento](./09-armazenamento/README.md) | arquivos persistidos, `AppSettings`, sessoes criptografadas e keytar. |
| [10-build-empacotamento](./10-build-empacotamento/README.md) | scripts npm, Vite, tsconfig, preload bundle e electron-builder. |
| [11-testes](./11-testes/README.md) | Vitest, coverage e padroes de testes. |
| [12-debito-tecnico](./12-debito-tecnico/README.md) | TODOs e dividas tecnicas detectadas no codigo/documentos. |
| [13-decisoes-arquiteturais](./13-decisoes-arquiteturais/README.md) | ADRs historicos movidos de `docs/adr`. |
| [14-auditoria](./14-auditoria/README.md) | Artefatos de auditoria, incluindo Electronegativity. |

## Entradas Base Lidas
| Fonte | Uso |
|---|---|
| [`package.json`](../package.json) | scripts, versao real do package, dependencias e electron-builder. |
| [`src/shared/ipc/channels.ts`](../src/shared/ipc/channels.ts) | 54 canais IPC/eventos. |
| [`src/main/ipc/handlers`](../src/main/ipc/handlers) | handlers por dominio. |
| [`src/main/ipc/schemas.ts`](../src/main/ipc/schemas.ts) | schemas Zod. |
| [`src/automation/beefor`](../src/automation/beefor) | automacao Playwright e actions. |
| [`src/main/coin2u`](../src/main/coin2u) | integracao Coin2U HTTP. |
| [`src/renderer`](../src/renderer) | SPA React e clients IPC. |

## Observacoes / Dividas
- `package.json` declara `version: 0.1.8`, enquanto [ARQUITETURA.md](./ARQUITETURA.md) e [SEGURANCA.md](./SEGURANCA.md) declaram `0.1.9`.
- O prompt menciona `Fluxo-Salvamento-Credenciais.md`, mas esse arquivo nao existe no repo lido; a doc de credenciais esta em [09-armazenamento/keytar-entries.md](./09-armazenamento/keytar-entries.md) e [01-main-process/secure-storage.md](./01-main-process/secure-storage.md).
