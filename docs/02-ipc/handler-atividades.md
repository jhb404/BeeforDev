# Handler Atividades

> **Path:** $path
> **Responsabilidade em uma frase:** Buscar tarefas/atividades Beefor por HTTP Node usando token extraido da sessao.

## Responsabilidade
Este handler registra canais do dominio e delega trabalho para services, storage, Playwright ou HTTP conforme necessario.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| egisterAtividadesHandlers | function | (...) => void | Registra os canais do dominio com defineHandler ou defineEventHandler. |

## Fluxo Interno
- `ACTION_FETCH_ATIVIDADES` pega token em cache ou atualiza via Playwright; faz GET `https://apiteams.goobee.com.br/api/Quadro/ListarMinhasTarefas/{idPessoa}` com Bearer token.

## Erros e Edge Cases
- Excecoes dentro de un sao capturadas por defineHandler e retornam ail(err) quando o canal e invoke.
- Payloads dinamicos usam schemas listados em [schemas.md](./schemas.md).

## Side Effects
IPC, logs e side effects do service/action chamado.

## Dependencias
Ver imports no arquivo fonte citado no topo.

## Consumidores
Preload em [src/main/preload.ts](../../src/main/preload.ts) e clients em [src/renderer/services/ipc](../../src/renderer/services/ipc).

## Testes
Cobertura direta de handlers e parcial; defineHandler e schemas possuem testes.

## Observacoes / Dividas
Detalhes de canais tambem estao em [channels.md](./channels.md).
