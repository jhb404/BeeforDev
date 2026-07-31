# Acesso ao TimeSheet Beefor (gate de UI de ponto)

> **Path:** `src/renderer/app/providers/AccessProvider.tsx`, `src/main/services/beeforHttpClient.ts`
> **Responsabilidade em uma frase:** Esconder toda a UI de ponto de quem não tem TimeSheet Beefor.

## Origem do dado

`POST /api/Token` (e `/Token/LoginComToken`, `/Token/TrocarOrganizacao`) devolve no VM da
sessão:

| Campo | Significado |
|---|---|
| `usaTimeSheetBeefor` | pessoa tem acesso ao TimeSheet Beefor |
| `usaSomenteTimeSheetBeefor` | pessoa usa **só** o TimeSheet (sem mood/kudo/etc) |

Antes esses campos eram lidos apenas em `PegarEditarPerfil` (`beeforPerfilService`), para
espelhar no PUT de edição — a sessão os descartava. Agora `sessionFromLoginResponse` os
guarda em `BeeforSession`.

A flag é **por organização**: `trocarOrganizacaoToken` relê o campo do token novo e cai
no valor anterior se o VM não trouxer. Troca de org faz `window.location.reload()`, então
o renderer reavalia tudo.

## Fail-open

Campo ausente → `usaTimeSheetBeefor = true`. Sem sessão em cache, `usaTimesheetBeefor()`
também devolve `true`. Motivo: um contrato que mude no backend não pode apagar a tela de
ponto de todo mundo. Só esconde quando a API **afirma** `false`.

No renderer o estado tem três valores: `null` (desconhecido), `true`, `false`. Esconder só
no `false` explícito — enquanto `null`, os loaders de boot já cobrem a tela, então não há
flash da grade pra quem não deveria vê-la.

## Propagação

```
POST /Token ──► BeeforSession.usaTimeSheetBeefor
                 ├─ main:     usaTimesheetBeefor()  → scheduler, alerts, tray
                 └─ renderer: api:sessionInfo → AccessProvider → useAccess().semTimesheet
```

`AccessProvider` consulta `sessionInfo` quando o status vira `connected`, com poll de
400ms × 15 (o login HTTP pode terminar depois do status). Poll esgotado → assume `true`,
pra nada ficar preso em "desconhecido".

## O que fica escondido com `semTimesheet`

| Onde | O que |
|---|---|
| `Home` | `section.timesheet-panel` inteira: toolbar (mês/ano/auto lançamento/importar), `SummaryStrip`, `TimesheetGrid`, `MinimalView` |
| `Home` | fetch de apontamento (`useTimesheetData({ enabled: false })`) — não bate na API |
| `TopBar` | `LunchTimerWidget` (relógio do almoço) |
| `App` | auto-start do timer de almoço e o gatilho vindo do tray |
| `Settings → Alertas` | `PunchCard`, `LunchCard`, `PjCard` (Mood e KudoCard permanecem) |
| `Settings → Geral` | itens `autoLancamento` e `lunchTimer` no `TrayMenuCard` |
| `Perfil → Aparência` | `ViewModeCard` (escolhe layout da grade de ponto) |
| `OnboardingModal` | passo "Horários de ponto" sai do fluxo (`Passo N de 4`) e o card "Almoço" sai do passo de alarmes |
| Tray (main) | itens `autoLancamento` e `lunchTimer` |
| Notificações (main) | lembretes de ponto, almoço e Ajustar Pontos (PJ) |
| Sininho (main) | os mesmos alertas em `getTodayAlerts` |

## O que entra no lugar

Sem a grade de ponto sobrava espaço vazio abaixo do "Mood do dia". `Home` renderiza
`div.home-cards` (coluna única — **um card por linha**, na mesma largura do painel de mood;
CSS em `styles/modules/home-cards.css`) só quando `semTimesheet`. Cada card divide o
conteúdo em duas colunas internas (resumo à esquerda, lista à direita) e empilha abaixo de
720px, pra linha cheia não virar bloco alto e vazio:

| Card | Componente | Fonte |
|---|---|---|
| Meu mood no mês (calendário Niko) | `pages/home/components/MoodCalendarCard` | `API_MOOD_CALENDAR` → `/PraticaAgil/PegarCalendarioNiko(Grupo)/{id}/{mes}/{ano}` |
| Minhas atividades | `features/atividades/components/AtividadesHomeCard` | `API_ATIV_MINHAS` (`/Quadro/ListarMinhasTarefas`) |
| Coin2U | `features/coin2u/components/Coin2uHomeCard` | `coin2u:getDashboard` + `coin2u:getLog` |
| KudoCards | `features/kudo/components/KudoHomeCard` | `API_KUDO_COUNTS` + `API_KUDO_LISTS` |
| Streak de mood | `features/gamification/components/StreakHomeCard` | `API_MOOD_STREAK_ORG` |

Todos espelham cards que o goobeeteams já mostra (`app-minhas-tarefas`,
`app-kudo-cards-card`, `getCalendarioNiko` do `TeamMoodService`) — mesmos endpoints, sem
inventar contrato novo.

Notas por card:

- **Calendário Niko** é o único que exigiu endpoint novo (`API_MOOD_CALENDAR`, canal +
  handler + `mood.calendar` no preload + `getMoodCalendario` no service). Reage a
  `CONTEXT_CHANGED_EVENT` (trocar de time no switcher recarrega) e ao mood do dia via
  `refreshKey`, senão o dia de hoje só apareceria no próximo boot.

  **Escolha do time importa.** `PegarCalendarioNiko` monta a lista a partir de
  `PegarTimePessoasSentimentos(IdTime == idTime)` — só devolve quem **está** naquele time.
  A primeira versão caía no primeiro item de `/Pessoa/PegarTimesComboBox`, que lista os
  times da **organização inteira**: dava um time onde a pessoa não está e o calendário
  vinha sem a linha dela (aparecia vazio, nem o mood de hoje). Agora os candidatos vêm do
  próprio `/Token` — `timeFavoritado` e depois `idsTimes` (por isso os dois entraram em
  `BeeforSession` e no `sessionInfo`) — e o card tenta um a um até achar a própria linha.
  Comparação de `idPessoa` é case-insensitive: GUID da API pode vir em caixa diferente da
  sessão.
- **Coin2U** reusa o `coin2uCache` do badge da topbar — abrir a Home não gera request
  extra. Respeita `settings.coin2uEnabled === false` (card nem aparece) e oferece login
  inline quando não há credenciais.
- **Streak** se esconde por completo se o endpoint falhar (ele ainda pode não estar
  publicado em prod) — card ausente é melhor que card com erro. Pede `topN: 30` de
  propósito: `getMoodStreakOrganizacao` só serve do cache em disco quando os args são
  exatamente `(undefined, undefined, 30)`. Pedir 3 furava o cache e disparava o cálculo
  org-wide inteiro; o corte pro top 3 é feito no renderer.
- **Modais são da `Home`**, não dos cards: `AtividadesHomeCard` e `KudoHomeCard` recebem
  `onOpen`/`onSend`/`onHistory`. A Home já montava `AtividadesModal`,
  `KudoCardModal` e `KudoCardHistoryModal` — cards com instância própria criavam duas do
  mesmo modal. `AtividadesModal` e `KudoCardHistoryModal` ganharam `initialSelectedId`, então
  clicar numa linha do card cai direto no detalhe (antes só abria a lista, e parecia que o
  clique não fazia nada). Coin2U e Streak seguem com modal próprio — mesmo padrão do
  `Coin2uBadge`/`MoodStreakBadge`, que já fazem isso.
- Todos os cards distinguem **sem sessão / carregando / vazio / erro** e têm botão
  "Tentar de novo" no erro. `KudoHomeCard` avisa se **qualquer** das duas chamadas falhar
  (antes só se as duas falhassem, então uma falha virava card vazio silencioso).

## Erros e Edge Cases

- O tray é montado **antes** do login. `emitStatus(win, 'connected')` chama
  `rebuildTrayMenu()` (import dinâmico, evita ciclo `statusBus ↔ tray`) pra aplicar o
  filtro quando a sessão sobe.
- `useTimesheetData` com `enabled: false` marca `timesheetLoaded = true` sem fetch —
  senão `bootReady` nunca fica true e o app trava no splash.
- `TrayMenuCard` filtra a lista exibida mas opera nos **índices originais** do array
  salvo; remover/reordenar não corrompe os itens escondidos.

## Testes

- `src/renderer/app/providers/AccessProvider.test.tsx` — false/true/somente/fail-open.
- `src/renderer/pages/home/hooks/useTimesheetData.test.tsx` — `enabled: false` não busca
  e ainda marca carregado.
- `src/renderer/pages/home/utils/nikoGrid.test.ts` — padding do dia da semana, mês que
  começa no domingo, ano bissexto e mood no dia certo.

## Observações / Dívidas

- `usaSomenteTimeSheetBeefor` está exposto (`useAccess().somenteTimesheet`) mas ainda não
  esconde nada. É o caso inverso: quem usa só TimeSheet não precisaria de
  mood/kudo/Coin2U/atividades.
- O gate é de UI. Quem tiver a flag `false` e chamar o IPC de timesheet direto (devtools)
  ainda cai no backend — a autorização real continua sendo do servidor.
- O `AccessProvider` só consulta na transição pra `connected`. Se o acesso mudar no
  servidor durante a sessão, o main pega no próximo refresh de token, mas o renderer só
  atualiza em reconexão/reload (troca de org já dá reload).
- Cards avaliados e **não** construídos (backlog), com endpoint já mapeado no goobeeteams:
  próximo checkpoint/1:1 (`API_PERFIL_GET` já traz os campos), meus motivadores
  (`API_PERFIL_MOTIVADORES`), time + aniversários (`API_TIME_LIST`), novidades
  (`API_NOTIF_NOVIDADES`), mood do time (`POST /PraticaAgil/PegarTeamMood`), dicas do
  Agile Coach (`/PraticaAgil/PegarDicasAgileCoachTime`), termômetro ágil
  (`/PraticaAgil/CalcularTermometro/{idTime}`).
- Descartados de propósito: assessment radar, NPS/eNPS, melhoria contínua, turnover e OKR
  — no webapp são gated por `NivelPermissao.RH`/`AgileCoach`, é painel de gestor.
