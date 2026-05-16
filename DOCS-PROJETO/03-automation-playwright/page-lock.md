# Page Lock

> **Path:** `src/automation/beefor/pageLock.ts`
> **Responsabilidade em uma frase:** Serializar operacoes Playwright na Page compartilhada.

## Responsabilidade
A Page e singleton. Navegacoes simultaneas abortam umas as outras; `withPageLock` enfileira actions usando uma promise `chain` global.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `withPageLock` | function | `(fn: () => Promise<T>) => Promise<T>` | Executa `fn` apos a chain anterior finalizar. |

## Fluxo Interno
`next = chain.then(fn, fn)`, depois `chain = next.catch(() => {})` para nao quebrar fila futura em caso de erro. Retorna `next` para caller receber sucesso/erro real.

## Erros e Edge Cases
- Erro de uma action nao trava a fila, porque a chain interna captura.
- Nao ha timeout no lock; timeout precisa ser aplicado pelo caller.

## Side Effects
Estado global em memoria.

## Dependencias
Nenhuma externa.

## Consumidores
`sessionManager`, `session.handlers`, `beeforActionRunner`, `atividades.handlers`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Nao ha metrica/telemetria de fila; action longa pode bloquear as demais.
