/**
 * Práticas Ágeis — tela config-driven (espelha goobeeteams praticas-ageis).
 * Backend devolve a lista de práticas ATIVAS do time; o front itera e renderiza
 * o card certo por `chave`. Cada card busca seus próprios dados pelo endpoint dele.
 *
 * Fonte da verdade: GET /PraticaAgil/PraticasAgeisTime/{idTime} → PraticaAgilTime[]
 * Casing do fio: camelCase (Angular HttpClient confirmou res.labels/res.valores).
 * Mapa completo: docs/praticas-ageis-charts-map.md
 */

/** TemperaturaTermometroEnum (1..5). Todo box devolve este campo. */
export type Temperatura = 1 | 2 | 3 | 4 | 5; // Congelado, Frio, Morno, Quente, Fervendo

/** SentimentoColaboradorEnum (1..5) — Niko/TeamMood. */
export type Sentimento = 1 | 2 | 3 | 4 | 5; // Feliz, Bom, NaoTaoBom, Triste, Ausencia

/** Chaves canônicas (PraticaAgilChave do goobeeteams). */
export enum PraticaChave {
  Daily = 'DAILY',
  Review = 'REVIEW',
  Planning = 'PLNNNG',
  Retrospectiva = 'RTSPCTV',
  TaxaSucessoPlanning = 'TX_SCSS_PLNNNG',
  MelhoriaContinua = 'MLR_CTN',
  TeamMood = 'TM_NC',
  DicasAgileCoach = 'DICA_AC',
  DelegationBoard = 'DLGTN_BRD',
  Indicador = 'INDCDR',
  Movimento = 'MVMT',
  Throughput = 'THRGHPUT',
  Throughput3Meses = 'THRGHPUT3MESES',
  ThroughputGrafico = 'THRGHPUTGRA',
  Capacity = 'CPCTY',
  Proposito = 'PPST',
  GestaoDeBacklog = 'GB',
  CycleTime = 'CCTM',
  LeadTime = 'LDTM',
  ProgressoSprint = 'PGS_SPT',
  GraficoCFD = 'G_CFD',
  TermometroAgil = 'TRMTR_AGL',
  Assessment = 'ASSMNT',
  KudoCard = 'KUDO_CARD',
  NPS = 'NPS',
  ENPS = 'ENPS',
  Custom = 'CUSTOM',
}

/** Item da config (lista de práticas ativas do time). */
export interface PraticaAgilTime {
  idPraticaAgil: string;
  nomePraticaAgil: string;
  chave: PraticaChave | string;
  status: boolean;
  engajamento?: number;
  dataInicio?: string;
}

// ─── Shapes normalizados por card ────────────────────────────

export interface ThroughputGrafico {
  mediaEntrega: string;
  temperatura: Temperatura | null;
  exibirPorcentagem: boolean;
  periodos: Array<{
    nome: string;
    planejado: number;
    entregue: number;
    porcentagem: number;
    bugs: number;
  }>;
}

/** Série de barras — Cycle Time / Lead Time barra (res.labels/res.valores). */
export interface GraficoBarra {
  label: string;
  pontos: Array<{ legenda: string; valor: number }>;
}

/** Série de linha c/ baseline — Cycle/Lead linha, Burndown. */
export interface GraficoLinha {
  legenda: string[];
  linhaBase: number[];
  linhaPrincipal?: number[];
}

export interface CycleTimeGrafico {
  valor: number | null; // Calcular → dias; null = não configurado
  barra: GraficoBarra;
}

export interface LeadTimeGrafico {
  valor: number | null;
  barra: GraficoBarra;
}

/** Burndown — Projeto/PegarGraficoBurnDown/{idTime}. */
export interface BurndownGrafico {
  totalCards: number;
  porcentagemEntregueDiasUteis: number;
  temperatura: Temperatura | null;
  series: Array<{ legenda: string[]; ideal: number[]; real: number[] }>;
}

/** CFD — pontos por coluna/dia. Agrupar por serie. */
export interface CfdGrafico {
  pontos: Array<{ serie: string; valor: number }>;
}

/** Box-resumo genérico (Capacity, Movimento, Delegation, Dicas, Backlog). */
export interface BoxResumo {
  titulo: string;
  valorPrincipal: string;
  sub?: string;
  valorSecundario?: string;
  temperatura: Temperatura | null;
}

/** Taxa sucesso planning — gauge. */
export interface TaxaSucessoGrafico {
  taxa: number | null; // %
  periodo: number;
  temperatura: Temperatura | null;
  total: number;
}

/** Melhoria contínua — pizza por status. */
export interface MelhoriaContinuaGrafico {
  titulo: string;
  subtitulo: string;
  total: number;
  concluidas: number;
  fatias: Array<{ rotulo: string; valor: number; cor?: string }>;
  temperatura: Temperatura | null;
}

/** Cerimônia (Daily/Planning/Review/Retrospectiva) — info resumida. */
export interface CerimoniaInfo {
  titulo: string;
  quantidade: number; // X realizadas
  ultimaData: string;
  proximaData: string;
  onde: string; // LARK / Discord / ...
  diasRestantes: number | null; // "15 dias" (Planning)
  percent: number | null; // donut (Retrospectiva 20%)
  legendaPercent: string;
  temperatura: Temperatura | null;
}

/** Recomendações (Dicas Agile Coach) — donut aceitas/rejeitadas/pendentes. */
export interface RecomendacoesGrafico {
  aceitas: number;
  rejeitadas: number;
  pendentes: number;
  total: number;
  temperatura: Temperatura | null;
}

/** Team Mood agregado. */
export interface TeamMoodGrafico {
  sentimento: Sentimento | null;
  temperatura: Temperatura | null;
}

/** Termômetro de práticas — lista de competências c/ pontos 0..10. */
export interface TermometroGrafico {
  competencias: Array<{ nome: string; pontos: number }>;
}

/** Assessment radar — competência → eixos. */
export interface AssessmentRadar {
  competencias: Array<{
    competencia: string;
    eixos: Array<{ chave: string; valor: number }>;
  }>;
}

/** Config persistida da Home de Práticas. */
export interface PraticasHomeConfig {
  enabled: boolean;
  idTime: string | null;
}
