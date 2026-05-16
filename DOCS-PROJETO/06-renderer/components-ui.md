# Components UI

> **Path:** `src/renderer/components/common/*`, `src/renderer/components/ui/ModalShell.tsx`
> **Responsabilidade em uma frase:** Componentes visuais compartilhados e icones locais.

## Responsabilidade
Agrupa logo, status, loader, shell de modal e icones SVG usados por paginas/features.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `BeeforLogo` | component | Logo com variantes/tamanho. |
| `StatusBadge` | component | Badge por `SessionStatus`. |
| `FunnyLoader` | component | Loader textual rotativo. |
| `ModalShell` | component | Estrutura comum para modais. |
| `BrandLogo`, `Bolt`, `Globe`, `Refresh`, `Sun`, `Moon`, `Bell`, `Clock`, `Coffee`, `Heart`, `Logout`, `Calendar`, `Settings`, `Trophy`, `Newspaper`, `Users`, `Cake`, `Search`, `Edit3`, `Mail`, `Briefcase`, `X`, `Check`, `ShoppingBag`, `Package` | icon components | SVG inline compartilhado. |

## Fluxo Interno
Features importam componentes comuns para manter visual consistente sem depender de Electron.

## Erros e Edge Cases
- Icons recebem props SVG; consumidores devem definir `aria-hidden`/label conforme contexto.
- ModalShell depende de props de open/close e children.

## Side Effects
DOM apenas.

## Dependencias
React.

## Consumidores
Home, Settings, TopBar, features.

## Testes
Sem teste direto.

## Observacoes / Dividas
Projeto usa icones SVG locais; nao ha biblioteca `lucide` instalada.
