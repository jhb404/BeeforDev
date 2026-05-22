import { beeforHttp, getValidSession } from './beeforHttpClient';
import { PersistentCache } from './diskCache';
import type { Mood } from '../../shared/types/index';
import { MOOD_BY_SENTIMENTO } from '../../shared/types/index';

const SENTIMENTO_BY_MOOD: Record<Mood, number> = {
  'Dia feliz': 1,
  'Dia bom': 2,
  'Dia não tão bom': 3,
  'Dia triste': 4,
};

export interface InformaHumorResult {
  sentimento: number;
  mood: Mood | null;
  idSentimentoPessoa?: string;
  dataCriacao?: string;
  raw: unknown;
}

export interface AdicionarHumorBody {
  IdPessoa: string;
  Sentimento: number;
  IdResponsavelCriacao: string;
}

export interface EditarHumorBody {
  IdSentimentoPessoa: string;
  Sentimento: number;
  IdResponsavelEdicao: string;
}

export async function getCurrentMood(idPessoa?: string): Promise<InformaHumorResult> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any>('/Home/InformaHumor', { IdPessoa: target });
  const sentimento = Number(data?.sentimento ?? data?.Sentimento ?? 0);
  return {
    sentimento,
    mood: sentimento ? MOOD_BY_SENTIMENTO[sentimento] ?? null : null,
    idSentimentoPessoa:
      typeof data?.idSentimentoPessoa === 'string'
        ? data.idSentimentoPessoa
        : typeof data?.IdSentimentoPessoa === 'string'
          ? data.IdSentimentoPessoa
          : undefined,
    dataCriacao:
      typeof data?.dataCriacao === 'string'
        ? data.dataCriacao
        : typeof data?.DataCriacao === 'string'
          ? data.DataCriacao
          : undefined,
    raw: data,
  };
}

export async function addMood(mood: Mood, idPessoa?: string): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const body: AdicionarHumorBody = {
    IdPessoa: target,
    Sentimento: SENTIMENTO_BY_MOOD[mood],
    IdResponsavelCriacao: session.idPessoa,
  };
  const result = await beeforHttp.post('/Home/AdicionarHumor', body);
  void invalidateStreakCache(); // mood novo muda streak
  return result;
}

export async function editMood(
  idSentimentoPessoa: string,
  mood: Mood,
): Promise<unknown> {
  const session = await getValidSession();
  const body: EditarHumorBody = {
    IdSentimentoPessoa: idSentimentoPessoa,
    Sentimento: SENTIMENTO_BY_MOOD[mood],
    IdResponsavelEdicao: session.idPessoa,
  };
  return beeforHttp.put(
    `/Home/EditarHumor/${encodeURIComponent(idSentimentoPessoa)}`,
    body,
  );
}

export async function commentMood(
  idPessoa: string,
  comentario: string,
): Promise<unknown> {
  const body = { IdPessoa: idPessoa, Comentario: comentario };
  return beeforHttp.put(
    `/Home/ComentarHumor/${encodeURIComponent(idPessoa)}`,
    body,
  );
}

export interface MoodDiaApi {
  data: string;
  sentimento: number;
}

export interface MoodStreakPessoaApi {
  idPessoa: string;
  nome: string;
  email?: string;
  foto?: string;
  streakAtual: number;
  maiorStreak: number;
  diasUteisTotal: number;
  diasComMood: number;
  ultimoRegistro?: string | null;
  ultimoSentimento?: number | null;
  faltasDiasUteis: string[];
  historico: MoodDiaApi[];
}

export interface MoodStreakOrganizacaoApi {
  dataInicio: string;
  dataFim: string;
  diasUteisTotal: number;
  feriadosConsiderados: string[];
  pessoas: MoodStreakPessoaApi[];
  totalPessoasOrganizacao: number;
  posicaoUsuarioAtual: number;
  streakUsuarioAtual: number;
  usuarioAtualNoTop: boolean;
  meuRanking?: MoodStreakPessoaApi | null;
}

async function fetchMoodStreakOrganizacao(
  dataInicio?: Date | string,
  dataFim?: Date | string,
  topN: number = 30,
): Promise<MoodStreakOrganizacaoApi> {
  const toIso = (d?: Date | string) =>
    d === undefined ? undefined : typeof d === 'string' ? d : d.toISOString();
  return beeforHttp.get<MoodStreakOrganizacaoApi>('/Home/MoodStreakOrganizacao', {
    dataInicio: toIso(dataInicio),
    dataFim: toIso(dataFim),
    topN,
  });
}

// Cache disco SWR — streak org é pesado (calcula org inteira). Serve cache + revalida background.
const streakCache = new PersistentCache<MoodStreakOrganizacaoApi>(
  'mood-streak-org',
  () => fetchMoodStreakOrganizacao(undefined, undefined, 30),
);

export function invalidateStreakCache(): Promise<void> {
  return streakCache.clear();
}

/** Stale-while-revalidate: cache disco instantâneo + revalida background. */
export async function getMoodStreakOrganizacao(
  dataInicio?: Date | string,
  dataFim?: Date | string,
  topN: number = 30,
): Promise<MoodStreakOrganizacaoApi> {
  // Caso default (sem range, top30) usa cache. Range custom → fetch direto.
  if (dataInicio === undefined && dataFim === undefined && topN === 30) {
    return streakCache.getStaleWhileRevalidate();
  }
  return fetchMoodStreakOrganizacao(dataInicio, dataFim, topN);
}

/** Força revalidação (boot warm). */
export async function warmStreakCache(): Promise<void> {
  await streakCache.revalidate().catch(() => null);
}
