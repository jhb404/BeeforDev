# Electron Builder

> **Path:** `package.json` campo `build`
> **Responsabilidade em uma frase:** Configurar empacotamento Windows/macOS e publish GitHub Releases.

## Responsabilidade
`electron-builder` empacota `dist`, `build` e `package.json`, com asar ativo e Playwright unpacked.

## API Publica
| Campo | Valor |
|---|---|
| `appId` | `io.beefor.dev` |
| `productName` | `Beefor Dev` |
| `directories.output` | `release` |
| `files` | `dist/**/*`, `build/**/*`, `package.json` |
| `asar` | true |
| `asarUnpack` | Playwright/playwright-core |
| `extraResources` | `patch-journal.md` |
| Windows | NSIS, icon `build/icon.ico` |
| macOS | DMG, category developer tools, icon `build/icon.icns` |
| publish | GitHub `jhb404/BeeforDev` release |

## Fluxo Interno
`package:win/mac` roda build completo e electron-builder com publish always.

## Erros e Edge Cases
- NSIS `perMachine:false` e `allowElevation:false`.
- `deleteAppDataOnUninstall:false` preserva userData.
- Sem code signing conforme seguranca.

## Side Effects
Artefatos em `release`, publish GitHub Releases.

## Dependencias
`electron-builder`, GitHub token/ambiente para publish.

## Consumidores
Distribuicao do app e auto-updater.

## Testes
Nao empacotado nesta tarefa.

## Observacoes / Dividas
Assinatura de codigo pendente para reduzir SmartScreen.
