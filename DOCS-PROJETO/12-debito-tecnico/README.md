# Debito Tecnico

> **Path:** `DOCS-PROJETO/ARQUITETURA.md`, codigo fonte lido em `src/`
> **Responsabilidade em uma frase:** Consolidar TODOs e lacunas reais encontradas durante a documentacao.

## Responsabilidade
Registrar itens acionaveis para issues tecnicas, sem misturar com documentacao de fluxo.

## API Publica
| Item | Evidencia | Impacto |
|---|---|---|
| Versao divergente | `package.json` = `0.1.8`; docs base/prompt = `0.1.9` | Release/update/version display podem divergir. |
| `ACTION_SNOOZE_ALERT` sem uso | Constante em `channels.ts`, sem handler/client/preload encontrado | Contrato IPC morto ou feature incompleta. |
| `Fluxo-Salvamento-Credenciais.md` ausente | Prompt diz que existe; pasta tinha so ARQUITETURA/SEGURANCA/PROMPT antes desta execucao | Link/documento esperado nao existe. |
| Punch automatico nao bate ponto | Comentario em scheduler: real punch click left for future implementation | Nome `automatePunch` pode induzir usuario/dev a erro. |
| Coin2U compra HTTP 500 tratado como sucesso | TODO em `src/main/coin2u/endpoints.ts` | Precisa validar contrato real para evitar falso positivo. |
| Coverage sem threshold | `vitest.config.ts` sem thresholds | Regressao pode passar sem cobertura minima. |
| Main/automation pouco testados | Sem testes para scheduler/sessionManager/coin2u auth/automation | Risco em fluxos criticos. |
| IPC flat com 54 canais | `channels.ts` unico objeto | Escala/descoberta piora conforme cresce. |
| Multi-env ausente | URLs hardcoded em `shared/constants.ts` | Sem dev/staging configuravel. |
| Logger acoplado a automation | imports `../../main/logger` em automation | Dificulta reutilizacao/testes da automation. |
| `JornadaCard` existente mas nao renderizado | Import comentado em `Settings.tsx` | UI/feature possivelmente incompleta. |
| Settings schema vs tipo | `AppSettings.punchTimes` tupla 4; schema aceita array max 8 | Drift de contrato runtime/type. |

## Fluxo Interno
Itens vieram de leitura das fases 1-9 e das dividas ja listadas em [../ARQUITETURA.md](../ARQUITETURA.md).

## Erros e Edge Cases
- TODOs documentais usam `TODO(verify)` apenas onde o codigo nao revelou informacao suficiente.

## Side Effects
Nenhum.

## Dependencias
Docs e codigo.

## Consumidores
Backlog tecnico.

## Testes
N/A.

## Observacoes / Dividas
Prioridade sugerida: corrigir versao, decidir destino de `ACTION_SNOOZE_ALERT`, validar contrato Coin2U buy e explicitar comportamento real de `automatePunch` na UI.
