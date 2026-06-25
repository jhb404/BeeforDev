import { beeforHttp, getValidSession } from './beeforHttpClient';
import { logger } from '../logger';
import type {
  AssessmentRadar,
  BoxResumo,
  BurndownGrafico,
  CerimoniaInfo,
  CfdGrafico,
  CycleTimeGrafico,
  GraficoBarra,
  LeadTimeGrafico,
  MelhoriaContinuaGrafico,
  PraticaAgilTime,
  RecomendacoesGrafico,
  TaxaSucessoGrafico,
  TeamMoodGrafico,
  Temperatura,
  TermometroGrafico,
  ThroughputGrafico,
} from '../../shared/types/index';

/**
 * Práticas Ágeis — tela config-driven (espelha goobeeteams).
 * Reusa beeforHttp → AES/JWT/401/org já resolvidos. Casing do fio é camelCase;
 * normalização defensiva (pick) cobre Pascal tb por garantia.
 * Mapa: docs/praticas-ageis-charts-map.md
 */

function pick(raw: any, ...keys: string[]): unknown {
  if (!raw) return undefined;
  for (const k of keys) if (raw[k] !== undefined && raw[k] !== null) return raw[k];
  return undefined;
}
function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function temp(v: unknown): Temperatura | null {
  const n = num(v);
  return n >= 1 && n <= 5 ? (n as Temperatura) : null;
}
function arr(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

// ─── Config: lista de práticas ativas do time ────────────────
// GET /PraticaAgil/PraticasAgeisTime/{idTime} → PraticaAgilTime[]
export async function getPraticasConfig(idTime: string): Promise<PraticaAgilTime[]> {
  const raw = await beeforHttp.get<any[]>(
    `/PraticaAgil/PraticasAgeisTime/${encodeURIComponent(idTime)}`,
  );
  return arr(raw)
    .map((p) => ({
      idPraticaAgil: String(pick(p, 'idPraticaAgil', 'IdPraticaAgil') ?? ''),
      nomePraticaAgil: String(pick(p, 'nomePraticaAgil', 'NomePraticaAgil') ?? ''),
      chave: String(pick(p, 'chave', 'Chave') ?? ''),
      status: Boolean(pick(p, 'status', 'Status') ?? false),
      engajamento: num(pick(p, 'engajamento', 'Engajamento')),
      dataInicio: String(pick(p, 'dataInicio', 'DataInicio') ?? ''),
    }))
    .filter((p) => p.status); // só ativas (igual getPraticasAgeisTime(idTime, true))
}

// ─── Throughput ──────────────────────────────────────────────
export async function getThroughput(
  idTime: string,
  filtraMeses?: number,
): Promise<ThroughputGrafico> {
  const raw = await beeforHttp.get<any>('/Throughput/CalcularGrafico', { idTime, filtraMeses });
  return {
    mediaEntrega: String(pick(raw, 'mediaEntrega', 'MediaEntrega') ?? ''),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
    exibirPorcentagem: Boolean(pick(raw, 'exibirPorcentagem', 'ExibirPorcentagem') ?? true),
    periodos: arr(pick(raw, 'graficoPeriodos', 'GraficoPeriodos')).map((p) => ({
      nome: String(pick(p, 'nomePeriodo', 'NomePeriodo') ?? ''),
      planejado: num(pick(p, 'planejado', 'Planejado')),
      entregue: num(pick(p, 'entregue', 'Entregue')),
      porcentagem: num(pick(p, 'porcentagemEntregue', 'PorcentagemEntregue')),
      bugs: num(pick(p, 'bugsConcluidos', 'BugsConcluidos')),
    })),
  };
}

// ─── Cycle Time / Lead Time (barra Top10 + valor) ────────────
function mapBarra(raw: any, label: string): GraficoBarra {
  const labels = arr(pick(raw, 'labels', 'Labels'));
  const valores = arr(pick(raw, 'valores', 'Valores'));
  return {
    label: String(pick(raw, 'datasetLabel', 'DatasetLabel') ?? label),
    pontos: labels.map((l, i) => ({ legenda: String(l ?? ''), valor: num(valores[i]) })),
  };
}

async function calcular(path: string, idTime: string): Promise<number | null> {
  // /Cycletime/Calcular e /Leadtime/Calcular → número; -1 = não configurado
  try {
    const v = await beeforHttp.get<any>(path, { idTime });
    const n = num(v);
    return n === -1 ? null : n;
  } catch {
    return null;
  }
}

export async function getCycleTime(idTime: string): Promise<CycleTimeGrafico> {
  const [valor, barraRaw] = await Promise.all([
    calcular('/Cycletime/Calcular', idTime),
    beeforHttp
      .get<any>(`/Cycletime/PegarGraficoCycleTimeBarra/${encodeURIComponent(idTime)}`)
      .catch(() => null),
  ]);
  return { valor, barra: mapBarra(barraRaw, 'Cycle Time (dias)') };
}

export async function getLeadTime(idTime: string): Promise<LeadTimeGrafico> {
  const [valor, barraRaw] = await Promise.all([
    calcular('/Leadtime/Calcular', idTime),
    beeforHttp
      .get<any>(`/LeadTime/PegarGraficoLeadTimeBarra/${encodeURIComponent(idTime)}`)
      .catch(() => null),
  ]);
  return { valor, barra: mapBarra(barraRaw, 'Lead Time (dias)') };
}

// ─── Burndown / Progresso Sprint ─────────────────────────────
export async function getBurndown(idTime: string): Promise<BurndownGrafico> {
  const enc = encodeURIComponent(idTime);
  const [raw, tempRaw] = await Promise.all([
    beeforHttp.get<any>(`/Projeto/PegarGraficoBurnDown/${enc}`),
    beeforHttp.get<any>(`/PraticaAgil/BuscarTemperaturaBurnDown/${enc}`).catch(() => null),
  ]);
  return {
    totalCards: num(pick(raw, 'totalCards', 'TotalCards')),
    porcentagemEntregueDiasUteis: num(
      pick(raw, 'porcentagemEntregueDiasUteis', 'PorcentagemEntregueDiasUteis'),
    ),
    temperatura: temp(tempRaw),
    series: arr(pick(raw, 'info', 'Info')).map((s) => ({
      legenda: arr(pick(s, 'legenda', 'Legenda')).map((l) => String(l ?? '')),
      ideal: arr(pick(s, 'linhaBase', 'LinhaBase')).map(num),
      real: arr(pick(s, 'linhaPrincipal', 'LinhaPrincipal')).map(num),
    })),
  };
}

// ─── CFD (precisa idQuadro da última iteração) ───────────────
export async function getCfd(idTime: string, opcao = 1): Promise<CfdGrafico> {
  const enc = encodeURIComponent(idTime);
  const quadro = await beeforHttp
    .get<any>(`/Quadro/PegarQuadroUltimaIteracao/${enc}`)
    .catch(() => null);
  const idQuadro = String(pick(quadro, 'idQuadro', 'IdQuadro', 'id', 'Id') ?? '');
  if (!idQuadro) return { pontos: [] };
  const raw = await beeforHttp
    .get<any[]>(`/Quadro/PegarDadosGraficoCFD/${encodeURIComponent(idQuadro)}/${opcao}`)
    .catch(() => []);
  return {
    pontos: arr(raw).map((p) => ({
      serie: String(pick(p, 'name', 'Name') ?? ''),
      valor: num(pick(p, 'value', 'Value')),
    })),
  };
}

// ─── Boxes (POST cifrado p/ Capacity/Movimento) ──────────────
export async function getCapacity(idTime: string): Promise<BoxResumo> {
  const raw = await beeforHttp.post<any>('/Home/PegarCapacity', { idTime });
  return {
    titulo: 'Capacity',
    valorPrincipal: String(pick(raw, 'qtdCapacity', 'QtdCapacity') ?? '0'),
    sub: 'Próximos 2 meses',
    valorSecundario: String(pick(raw, 'qtdCapacity2Meses', 'QtdCapacity2Meses') ?? ''),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

export async function getMovimento(idTime: string): Promise<BoxResumo> {
  const raw = await beeforHttp.post<any>('/Home/PegarMovimento', { idTime });
  return {
    titulo: 'Movimento',
    valorPrincipal: String(pick(raw, 'qtdMovimento', 'QtdMovimento') ?? '0'),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

export async function getDelegationBox(idTime: string): Promise<BoxResumo> {
  const raw = await beeforHttp.get<any>(
    `/PraticaAgil/PegarBoxDelegationBoard/${encodeURIComponent(idTime)}`,
  );
  return {
    titulo: 'Delegation Board',
    valorPrincipal: String(num(pick(raw, 'mediaNivelAutoridade', 'MediaNivelAutoridade'))),
    sub: 'Nível médio de autoridade',
    valorSecundario: String(
      num(pick(raw, 'qtdDominiosDelegationBoard', 'QtdDominiosDelegationBoard')),
    ),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

export async function getRecomendacoes(idTime: string): Promise<RecomendacoesGrafico> {
  const raw = await beeforHttp.get<any>(
    `/PraticaAgil/PegarBoxDicasAgileCoach/${encodeURIComponent(idTime)}`,
  );
  return {
    aceitas: num(pick(raw, 'qtdDicasAceitas', 'QtdDicasAceitas')),
    rejeitadas: num(pick(raw, 'qtdDicasRejeitadas', 'QtdDicasRejeitadas')),
    pendentes: num(pick(raw, 'qtdDicasPendentes', 'QtdDicasPendentes')),
    total: num(pick(raw, 'qtdTotalDicas', 'QtdTotalDicas')),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

export async function getBacklogBox(idTime: string): Promise<BoxResumo> {
  const raw = await beeforHttp.get<any>(`/Backlog/${encodeURIComponent(idTime)}`);
  return {
    titulo: 'Gestão de Backlog',
    valorPrincipal: String(pick(raw, 'quantidade', 'Quantidade', 'total', 'Total') ?? '—'),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura', 'indicadorTemperatura')),
  };
}

// ─── Taxa Sucesso Planning (gauge) ───────────────────────────
export async function getTaxaSucesso(idTime: string): Promise<TaxaSucessoGrafico> {
  const raw = await beeforHttp.get<any>(
    `/PraticaAgil/PegarTaxaSucessoPlanning/${encodeURIComponent(idTime)}`,
  );
  const t = pick(raw, 'taxaSucesso', 'TaxaSucesso');
  return {
    taxa: t === null || t === undefined ? null : num(t),
    periodo: num(pick(raw, 'periodo', 'Periodo')),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
    total: arr(pick(raw, 'reviewsPlannings', 'ReviewsPlannings')).length,
  };
}

// ─── Melhoria Contínua (pizza) ───────────────────────────────
// POST /PraticaAgil/BuscarMelhoriaContinua {idTime} → {dados:[{name,value,color}], ...}
export async function getMelhoriaContinua(idTime: string): Promise<MelhoriaContinuaGrafico> {
  const raw = await beeforHttp.post<any>('/PraticaAgil/BuscarMelhoriaContinua', { idTime });
  const dados = arr(pick(raw, 'dados', 'Dados'));
  return {
    titulo: String(pick(raw, 'titulo', 'Titulo') ?? ''),
    subtitulo: String(pick(raw, 'subTitulo', 'SubTitulo') ?? ''),
    total: num(pick(raw, 'totalMelhoriaContinua', 'TotalMelhoriaContinua')),
    concluidas: num(pick(raw, 'melhoriasConcluidas', 'MelhoriasConcluidas')),
    fatias: dados.map((d) => ({
      rotulo: String(pick(d, 'name', 'Name') ?? ''),
      valor: num(pick(d, 'value', 'Value')),
      cor: String(pick(d, 'color', 'Color') ?? '') || undefined,
    })),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

// ─── Indicador (box-resumo: "Média SP / das últimas N Sprints / valor") ──
export async function getIndicador(idTime: string): Promise<BoxResumo> {
  const raw = await beeforHttp.get<any>(
    `/PraticaAgil/PegarBoxIndicador/${encodeURIComponent(idTime)}`,
  );
  return {
    titulo: String(pick(raw, 'titulo', 'Titulo') ?? 'Indicador'),
    valorPrincipal: String(pick(raw, 'valorPrincipal', 'ValorPrincipal') ?? '—'),
    sub: String(pick(raw, 'valorOpcionalUm', 'ValorOpcionalUm', 'subtitulo', 'Subtitulo') ?? ''),
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

// ─── Cerimônias (Daily/Planning/Review/Retrospectiva) ────────
function diasEntre(a: string, b: string): number | null {
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((db - da) / 86_400_000);
}
/** % decorrido entre última e próxima (0..100). */
function progressoPercent(ultima: string, proxima: string): number | null {
  const total = diasEntre(ultima, proxima);
  const atual = diasEntre(ultima, new Date().toISOString());
  if (total == null || atual == null || total <= 0) return null;
  if (atual >= total) return 100;
  return Math.max(0, Math.min(100, Math.round((atual / total) * 100)));
}
/** dias decorridos desde a última ("trabalho em progresso: 15 dias"). */
function diasDecorridos(ultima: string): number | null {
  return ultima ? diasEntre(ultima, new Date().toISOString()) : null;
}

// Display vem de Info{X} (contador/datas/temperatura) + Config{X} (onde).
async function getOnde(path: string): Promise<string> {
  try {
    const c = await beeforHttp.get<any>(path);
    return String(pick(c, 'onde', 'Onde') ?? '');
  } catch {
    return '';
  }
}

export async function getDaily(idTime: string): Promise<CerimoniaInfo> {
  const enc = encodeURIComponent(idTime);
  const cfg = await beeforHttp
    .get<any>(`/PraticaAgil/PegarConfiguracaoDaily/${enc}`)
    .catch(() => null);
  return {
    titulo: 'Daily',
    quantidade: num(pick(cfg, 'quantidadeDailies', 'QuantidadeDailies')),
    ultimaData: String(pick(cfg, 'ultimaDaily', 'UltimaDaily', 'ultimaData') ?? ''),
    proximaData: String(pick(cfg, 'proximaDaily', 'ProximaDaily', 'proximaData') ?? ''),
    onde: String(pick(cfg, 'onde', 'Onde') ?? ''),
    diasRestantes: null,
    percent: null,
    legendaPercent: String(pick(cfg, 'horarioDaily', 'HorarioDaily') ?? ''), // relógio
    temperatura: temp(pick(cfg, 'temperatura', 'Temperatura')),
  };
}

export async function getPlanning(idTime: string): Promise<CerimoniaInfo> {
  const enc = encodeURIComponent(idTime);
  const [info, onde] = await Promise.all([
    beeforHttp.get<any>(`/PraticaAgil/InfoPlanning/${enc}`).catch(() => null),
    getOnde(`/PraticaAgil/PegarConfiguracaoPlanning/${enc}`),
  ]);
  const ultima = String(pick(info, 'ultimaPlanning', 'UltimaPlanning') ?? '');
  const proxima = String(pick(info, 'proximaPlanning', 'ProximaPlanning') ?? '');
  return {
    titulo: 'Planning',
    quantidade: num(pick(info, 'quantidadePlannings', 'QuantidadePlannings')),
    ultimaData: ultima,
    proximaData: proxima,
    onde,
    diasRestantes: diasDecorridos(ultima), // "trabalho em progresso: N dias"
    percent: progressoPercent(ultima, proxima),
    legendaPercent: 'Trabalho em progresso',
    temperatura: temp(pick(info, 'temperatura', 'Temperatura')),
  };
}

export async function getReview(idTime: string): Promise<CerimoniaInfo> {
  const enc = encodeURIComponent(idTime);
  const [info, onde] = await Promise.all([
    beeforHttp.get<any>(`/PraticaAgil/InfoReview/${enc}`).catch(() => null),
    getOnde(`/PraticaAgil/PegarConfiguracaoReview/${enc}`),
  ]);
  const ultima = String(pick(info, 'ultimaReview', 'UltimaReview') ?? '');
  const proxima = String(pick(info, 'proximaReview', 'ProximaReview') ?? '');
  // dias até a próxima review (negativo = atrasada)
  const restantes = proxima ? diasEntre(new Date().toISOString(), proxima) : null;
  return {
    titulo: 'Review',
    quantidade: num(pick(info, 'quantidadeReviews', 'QuantidadeReviews')),
    ultimaData: ultima,
    proximaData: proxima,
    onde,
    diasRestantes: restantes,
    percent: progressoPercent(ultima, proxima),
    legendaPercent: 'Trabalho em progresso',
    temperatura: temp(pick(info, 'temperatura', 'Temperatura')),
  };
}

export async function getRetrospectiva(idTime: string): Promise<CerimoniaInfo> {
  const enc = encodeURIComponent(idTime);
  const [info, onde] = await Promise.all([
    beeforHttp.get<any>(`/PraticaAgil/InfoRetrospectiva/${enc}`).catch(() => null),
    getOnde(`/PraticaAgil/PegarConfiguracaoRetrospectiva/${enc}`),
  ]);
  const total = num(pick(info, 'quantidadeMelhoriasContinuas', 'QuantidadeMelhoriasContinuas'));
  const pend = num(
    pick(info, 'quantidadeMelhoriasContinuasPendentes', 'QuantidadeMelhoriasContinuasPendentes'),
  );
  // donut = % de melhorias associadas PENDENTES (legenda do print)
  const percent = total > 0 ? Math.round((pend / total) * 100) : null;
  return {
    titulo: 'Retrospectiva',
    quantidade: num(pick(info, 'quantidadeRetrospectivas', 'QuantidadeRetrospectivas')),
    ultimaData: String(pick(info, 'ultimaRetrospectiva', 'UltimaRetrospectiva') ?? ''),
    proximaData: String(pick(info, 'proximaRetrospectiva', 'ProximaRetrospectiva') ?? ''),
    onde,
    diasRestantes: null,
    percent,
    legendaPercent: 'Melhorias associadas às retrospectivas pendentes',
    temperatura: temp(pick(info, 'temperatura', 'Temperatura')),
  };
}

// ─── Team Mood ───────────────────────────────────────────────
export async function getTeamMood(idTime: string): Promise<TeamMoodGrafico> {
  const raw = await beeforHttp.post<any>('/PraticaAgil/PegarTeamMood', { idTime });
  const s = num(pick(raw, 'sentimento', 'Sentimento'));
  return {
    sentimento: s >= 1 && s <= 5 ? (s as TeamMoodGrafico['sentimento']) : null,
    temperatura: temp(pick(raw, 'temperatura', 'Temperatura')),
  };
}

// ─── Ações Daily ─────────────────────────────────────────────
/** Realiza a daily do dia (POST RegistrarDailyRealizada). */
export async function realizarDaily(
  idTime: string,
  dia: string,
  observacao = '',
): Promise<{ ok: boolean }> {
  const session = await getValidSession();
  await beeforHttp.post('/PraticaAgil/RegistrarDailyRealizada', {
    observacao,
    idTime,
    idResponsavelRegistro: session.idUsuario,
    dia: dia || new Date().toISOString(),
  });
  return { ok: true };
}

/**
 * Salva Onde/horário da Daily SEM perder os demais campos da config.
 * Busca a config atual → faz merge → edita (PUT) se já existe, cria (POST) se não.
 * Backend exige o objeto completo; mandar parcial dá 500.
 */
export async function configurarDaily(payload: {
  idTime: string;
  horarioDaily?: string;
  onde?: string;
}): Promise<{ ok: boolean }> {
  const session = await getValidSession();
  const enc = encodeURIComponent(payload.idTime);
  const atual = await beeforHttp
    .get<any>(`/PraticaAgil/PegarConfiguracaoDaily/${enc}`)
    .catch(() => null);

  const idConfig = String(pick(atual, 'idConfiguracaoDaily', 'IdConfiguracaoDaily') ?? '');

  // base = config atual completa (preserva tipoDaily, perguntas, notificacao, etc.)
  const base = atual && typeof atual === 'object' ? { ...atual } : {};
  const body: Record<string, unknown> = {
    ...base,
    idTime: payload.idTime,
    idResponsavelConfiguracao: session.idUsuario,
  };
  if (payload.onde !== undefined) body.onde = payload.onde;
  if (payload.horarioDaily !== undefined) body.horarioDaily = payload.horarioDaily;

  if (idConfig) {
    body.idConfiguracaoDaily = idConfig;
    await beeforHttp.put(
      `/PraticaAgil/EditarConfiguracaoDaily/${encodeURIComponent(idConfig)}`,
      body,
    );
  } else {
    // sem config ainda → cria. Garante defaults mínimos.
    body.horarioDaily = body.horarioDaily ?? '09:00';
    body.onde = body.onde ?? '';
    await beeforHttp.post('/PraticaAgil/ConfigurarDaily', body);
  }
  return { ok: true };
}

// ─── Termômetro de Práticas ──────────────────────────────────
// GET /PraticaAgil/TermometroPraticasAgeis/{idTime}/{praticas}/{assessments}
export async function getTermometro(
  idTime: string,
  incluiPraticas = true,
  incluiAssessments = true,
): Promise<TermometroGrafico> {
  const raw = await beeforHttp.get<any[]>(
    `/PraticaAgil/TermometroPraticasAgeis/${encodeURIComponent(idTime)}/${incluiPraticas}/${incluiAssessments}`,
  );
  return {
    competencias: arr(raw).map((c) => ({
      nome: String(pick(c, 'nomeCompetencia', 'NomeCompetencia') ?? ''),
      pontos: num(pick(c, 'pontos', 'Pontos')),
    })),
  };
}

// ─── Assessment radar ────────────────────────────────────────
// GET /Assessment/RadarAssesment/{idTime}
export async function getAssessmentRadar(idTime: string): Promise<AssessmentRadar> {
  const raw = await beeforHttp.get<any[]>(
    `/Assessment/RadarAssesment/${encodeURIComponent(idTime)}`,
  );
  return {
    competencias: arr(raw).map((c) => ({
      competencia: String(pick(c, 'competencia', 'Competencia') ?? ''),
      eixos: arr(pick(c, 'radarLinhas', 'RadarLinhas')).map((r) => ({
        chave: String(pick(r, 'chave', 'Chave') ?? ''),
        valor: num(pick(r, 'valor', 'Valor')),
      })),
    })),
  };
}

/** Logs de diagnóstico do casing real (chamar 1x no dev). */
export async function debugConfigShape(idTime: string): Promise<void> {
  await getValidSession();
  const raw = await beeforHttp.get<any[]>(
    `/PraticaAgil/PraticasAgeisTime/${encodeURIComponent(idTime)}`,
  );
  logger.info(`PraticasAgeisTime amostra: ${JSON.stringify(raw).slice(0, 400)}`);
}
