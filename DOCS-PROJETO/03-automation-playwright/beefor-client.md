# Beefor Client

> **Path:** `src/automation/beefor/beeforClient.ts`
> **Responsabilidade em uma frase:** Possuir o ciclo de vida do Chromium, BrowserContext e Page usados por todas as actions Beefor.

## Responsabilidade
`BeeforClient` e singleton. Ele cria Chromium com anti-deteccao basica, carrega storageState quando caminho existe, configura viewport/locale/timezone/userAgent e reaproveita a mesma Page ate fechar.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `BeeforClient.instance` | static method | `() => BeeforClient` | Retorna singleton. |
| `getPage` | method | `(storageStatePath?) => Promise<Page>` | Reusa page aberta ou chama `launch`. |
| `persistSession` | method | `(filePath) => Promise<void>` | Persiste `context.storageState()`. |
| `close` | method | `() => Promise<void>` | Fecha context/browser e zera referencias. |

## Fluxo Interno
```ascii
getPage(path)
  -> se page aberta: return page
  -> launch(path)
      -> chromium.launch({ headless: BEEFOR_HEADED !== '1', args })
      -> loadStorageStateIfExists(path)
      -> browser.newContext({ storageState, viewport 1280x800, locale pt-BR, timezone America/Sao_Paulo, UA Chrome 127 })
      -> context.newPage()
      -> listeners close/disconnected limpam referencias
```

## Erros e Edge Cases
- Page fechada dispara warning e zera `this.page`.
- Browser desconectado zera browser/context/page.
- `persistSession` retorna sem efeito se context ainda nao existe.

## Side Effects
Cria processo Chromium, le storageState, registra listeners e grava storageState.

## Dependencias
- Internas: [`beeforSession.ts`](../../src/automation/beefor/beeforSession.ts), [`logger.ts`](../../src/main/logger.ts).
- Externas: `playwright`.

## Consumidores
Session handlers, session manager, action runner e atividades token cache.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
User-Agent hardcoded em Chrome 127; atualizar quando estrategia anti-deteccao mudar.
