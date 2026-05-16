# Features

> **Path:** `src/renderer/features/*`
> **Responsabilidade em uma frase:** Agrupar modulos de produto do renderer por dominio.

## Responsabilidade
Features seguem estrutura por dominio com components/hooks/utils/index quando aplicavel: atividades, Coin2U, gamification, kudo e team.

## API Publica
| Feature | Responsabilidade | Doc |
|---|---|---|
| `atividades` | Modal/lista/drawer de tarefas Beefor. | [atividades.md](./atividades.md) |
| `coin2u` | Carteira, saldo, shop, historico e transferencia. | [coin2u.md](./coin2u.md) |
| `gamification` | XP, achievements, temas, icones e unlock codes. | [gamification.md](./gamification.md) |
| `kudo` | Envio e historico de KudoCards. | [kudo.md](./kudo.md) |
| `team` | Lista, detalhes, avatar/status/aniversarios. | [team.md](./team.md) |

## Fluxo Interno
Features consomem `useIpc` indiretamente por hooks ou props, usam componentes compartilhados e mantem estado local/caches quando necessario.

## Erros e Edge Cases
- Coin2U depende de credenciais e userId capturados.
- Team depende de cache quando rede falha.
- Gamification usa `localStorage` e mock backend ativo.

## Side Effects
IPC, localStorage, modais, toasts e audio dependendo da feature.

## Dependencias
Renderer providers/hooks/utils e tipos shared.

## Consumidores
Home, TopBar e ProfileModal.

## Testes
Coin2U format/toast possui testes; demais features com cobertura parcial/ausente.

## Observacoes / Dividas
FSD e aplicado pragmaticamente; algumas features exportam so `index.ts` simples.
