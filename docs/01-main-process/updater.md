# Updater

> **Path:** `src/main/updater.ts`
> **Responsabilidade em uma frase:** Configurar electron-updater e eventos IPC de atualizacao.

## Responsabilidade
Em builds empacotados, o modulo baixa updates automaticamente, avisa renderer quando disponivel/baixado e expoe `UPDATER_QUIT_AND_INSTALL`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `setupAutoUpdater` | function | `(getWindow) => void` | Configura autoUpdater, eventos e polling. |

## Fluxo Interno
```ascii
setupAutoUpdater
  -> se !app.isPackaged: log e return
  -> autoDownload=true, autoInstallOnAppQuit=true
  -> eventos: checking, update-available, not-available, progress, downloaded, error
  -> ipcMain.handle(UPDATER_QUIT_AND_INSTALL) uma vez
  -> checkForUpdates() imediato
  -> setInterval 4h
```

## Erros e Edge Cases
- Em dev updater e desativado.
- Handler `UPDATER_QUIT_AND_INSTALL` usa flag `registered` para nao duplicar.
- Erros do updater sao logados, nao propagados para renderer como erro estruturado.

## Side Effects
Rede para GitHub Releases via config electron-builder, IPC `evt:updateAvailable`/`evt:updateDownloaded`, instalacao em quit.

## Dependencias
- Internas: [`shared/ipc/channels.ts`](../../src/shared/ipc/channels.ts), [`logger.ts`](../../src/main/logger.ts).
- Externas: `electron-updater`, `electron`.

## Consumidores
`AppShell` via `useUpdater` e toast de instalacao.

## Testes
Nao ha teste automatizado.

## Observacoes / Dividas
Code signing ausente e tratado em [../SEGURANCA.md](../SEGURANCA.md).
