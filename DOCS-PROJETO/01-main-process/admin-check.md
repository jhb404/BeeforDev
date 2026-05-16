# Admin Check

> **Path:** `src/main/adminCheck.ts`
> **Responsabilidade em uma frase:** Detectar elevacao e relancar o app como administrador no Windows.

## Responsabilidade
O modulo da suporte ao banner de admin nas configuracoes. Em Windows usa `process.isElevated` quando disponivel; para relancar usa PowerShell `Start-Process -Verb RunAs` preservando `--user-data-dir`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `isElevated` | function | `() => boolean` | Detecta admin/root. |
| `relaunchAsAdmin` | function | `() => Promise<void>` | Relanca elevado no Windows e encerra processo atual. |

## Fluxo Interno
`relaunchAsAdmin` valida `win32`, monta args preservando argv exceto `--user-data-dir`, injeta userData atual e executa `powershell.exe -NoProfile -WindowStyle Hidden -Command Start-Process ... -Verb RunAs`.

## Erros e Edge Cases
- Plataformas nao-Windows lancam `Elevacao so suportada no Windows.`.
- `process.isElevated` e opcional; se ausente retorna `false` no Windows.

## Side Effects
Abre prompt UAC, inicia novo processo, agenda `app.quit()` apos 500ms.

## Dependencias
- Externas: `electron.app`, `child_process.execFile`.

## Consumidores
`ADMIN_STATUS` e `ADMIN_RELAUNCH` em [../02-ipc/handler-system.md](../02-ipc/handler-system.md).

## Testes
Nao ha teste automatizado.

## Observacoes / Dividas
Escapamento de aspas simples e feito manualmente na string PowerShell.
