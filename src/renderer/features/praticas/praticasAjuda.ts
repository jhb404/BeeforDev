/** Texto de ajuda por prática — exibido no modal "?" do CardShell (key = PraticaChave). */
export const AJUDA_PRATICAS: Record<string, string> = {
  THRGHPUT:
    'Throughput é a quantidade de itens entregues por período. Mostra o ritmo real de entrega do time e ajuda a prever a capacidade futura.',
  THRGHPUT3MESES:
    'Throughput dos últimos 3 meses — itens entregues por período, para enxergar a tendência de ritmo.',
  THRGHPUTGRA:
    'Throughput em gráfico — itens entregues por período, comparados ao que foi planejado.',
  CCTM: 'Cycle Time é o tempo entre o início do trabalho em um item e sua conclusão. Quanto menor e mais estável, mais previsível é o fluxo.',
  LDTM: 'Lead Time é o tempo total desde a criação do item até a entrega. Reflete a experiência de espera do cliente.',
  PGS_SPT:
    'Progresso da Sprint (burndown) compara o trabalho restante real com o ritmo ideal até o fim da sprint.',
  G_CFD:
    'O CFD (Cumulative Flow Diagram) mostra o acúmulo de itens por etapa do fluxo, revelando gargalos e trabalho parado.',
  DLGTN_BRD:
    'O Delegation Board registra o nível de autoridade delegada ao time em cada domínio (escala 1 Dizer → 7 Delegar). Exibe a média do time e quantos domínios estão configurados.',
  GB: 'Gestão de Backlog resume o estado do backlog do time — itens priorizados, prontos para refinamento e em andamento.',
  DICA_AC:
    'Dicas do Agile Coach acompanha as recomendações feitas ao time e quantas foram aceitas, rejeitadas ou ainda estão pendentes.',
  TX_SCSS_PLNNNG:
    'A Taxa de Sucesso do Planning é a média de objetivos de valor realizados sobre o que foi planejado, em todas as entregas.',
  MLR_CTN:
    'Melhoria Contínua acompanha as ações de melhoria levantadas pelo time e quantas já foram implementadas.',
  DAILY: 'A Daily registra a realização da reunião diária do time, com dia e local configuráveis.',
  PLNNNG: 'Planning acompanha o progresso e o histórico das reuniões de planejamento da sprint.',
  REVIEW:
    'Review acompanha as reuniões de revisão da sprint e avisa quando a próxima está próxima ou atrasada.',
  RTSPCTV:
    'Retrospectiva mostra o percentual de melhorias levantadas que viraram ação, além do histórico das retros.',
  TRMTR_AGL:
    'O Termômetro de Práticas resume a maturidade ágil do time numa escala de 0 a 10, agregando as práticas (e, opcionalmente, os assessments). Faixas: Congelado (0–3), Frio (3–5), Morno (5–7), Quente (7–9) e Fervendo (≥9).',
  ASSMNT:
    'O Assessment mostra, em radar, a média das competências avaliadas do time, evidenciando pontos fortes e a desenvolver.',
};
