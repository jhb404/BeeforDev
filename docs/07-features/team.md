# Feature Team

> **Path:** `src/renderer/features/team/*`, `src/renderer/hooks/useTeamMembers.ts`, `src/renderer/utils/teamCache.ts`
> **Responsabilidade em uma frase:** Exibir time, status, detalhes e aniversarios.

## Responsabilidade
Team fornece botao/modal/cards/avatar/status/drawer/editor de aniversario e usa cache local para membros/aniversarios.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `TeamModal` | component | Modal principal de time. |
| `TeamButton` | component | Botao com badge de festa/aniversario. |
| `TeamMemberCard` | component memo | Card individual. |
| `TeamMemberDetailsDrawer` | component | Detalhes/checklists. |
| `TeamAvatar` | component | Foto/iniciais. |
| `TeamStatusBadge` | component | Status ativo/inativo. |
| `TeamBirthdayEditor` | component | Edita aniversario local. |
| `useTeamMembers` | hook | Busca via IPC e cacheia. |
| `teamCache` | utils | members/birthdays cache e merge. |

## Fluxo Interno
AppShell prefetch/preload fotos apos startup; TopBar abre TeamModal; hook chama `teamClient.fetchMembers` e mescla aniversarios locais.

## Erros e Edge Cases
- Se fetch falha, cache pode manter UI util.
- Birthday key usa email/nome para mapear entradas locais.

## Side Effects
IPC Beefor team, localStorage, preload de imagens.

## Dependencias
Shared `TeamMember`, utils dates/cache, components common.

## Consumidores
TopBar/AppShell/Profile-related UI.

## Testes
Sem teste especifico da feature; hooks de prefetch/preload sem cobertura ampla.

## Observacoes / Dividas
Backend team e capturado via Playwright, nao por HTTP puro.
