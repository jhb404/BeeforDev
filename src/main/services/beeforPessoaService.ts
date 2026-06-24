import {
  beeforHttp,
  getValidSession,
  trocarOrganizacaoToken,
  type BeeforSession,
} from './beeforHttpClient';
import { PersistentCache } from './diskCache';
import { logger } from '../logger';

export interface PessoaListItem {
  id: string;
  nome: string;
  email?: string;
  foto?: string;
  funcao?: string;
  idTime?: string;
  ativo?: boolean;
}

export interface TimeComboItem {
  id: string;
  nome: string;
}

export interface OrganizacaoListItem {
  idOrganizacao: string;
  nomeOrganizacao: string;
  imagem?: string;
  perfil?: string;
}

function mapPessoa(raw: any): PessoaListItem {
  return {
    id: String(raw?.id ?? raw?.idPessoa ?? '').trim(),
    nome: String(raw?.nome ?? raw?.name ?? '').trim(),
    email: typeof raw?.email === 'string' ? raw.email : undefined,
    foto: typeof raw?.foto === 'string' ? raw.foto : undefined,
    funcao: typeof raw?.funcao === 'string' ? raw.funcao : undefined,
    idTime: typeof raw?.idTime === 'string' ? raw.idTime : undefined,
    ativo: typeof raw?.ativo === 'boolean' ? raw.ativo : undefined,
  };
}

function mapTime(raw: any): TimeComboItem {
  return {
    id: String(raw?.id ?? raw?.idTime ?? '').trim(),
    nome: String(raw?.nome ?? raw?.name ?? '').trim(),
  };
}

function mapOrganizacao(raw: any): OrganizacaoListItem {
  return {
    idOrganizacao: String(raw?.idOrganizacao ?? raw?.id ?? '').trim(),
    nomeOrganizacao: String(raw?.nomeOrganizacao ?? raw?.nome ?? '').trim(),
    imagem: typeof raw?.imagem === 'string' ? raw.imagem : undefined,
    perfil: typeof raw?.perfil === 'string' ? raw.perfil : undefined,
  };
}

// ─── Cache persistente (disco + SWR). Sobrevive restart, revalida em background. ───
// Front busca 1x e filtra local; replicamos com persistência + diff-update.

const pessoasCache = new PersistentCache<PessoaListItem[]>('kudo-recipients-pessoas', async () => {
  const session = await getValidSession();
  const data = await beeforHttp.get<any[]>(
    `/Pessoa/PegarPessoasUsuarioNaoInclusivo/${encodeURIComponent(session.idPessoa)}`,
  );
  return Array.isArray(data) ? data.map(mapPessoa).filter((p) => p.nome) : [];
});

const timesCache = new PersistentCache<TimeComboItem[]>('kudo-recipients-times', async () => {
  const data = await beeforHttp.get<any[]>('/Pessoa/PegarTimesComboBox');
  return Array.isArray(data) ? data.map(mapTime).filter((t) => t.nome) : [];
});

export async function invalidateRecipientCache(): Promise<void> {
  await Promise.all([pessoasCache.clear(), timesCache.clear()]);
}

/** Pessoas (kudo recipient). Serve cache disco imediato + revalida background. */
export async function listKudoRecipients(): Promise<PessoaListItem[]> {
  return pessoasCache.getStaleWhileRevalidate();
}

export async function listTimesCombo(): Promise<TimeComboItem[]> {
  return timesCache.getStaleWhileRevalidate();
}

/**
 * Pré-aquece no boot: força revalidação (busca fresh, atualiza disco se diff).
 * UI já tem valor antigo instantâneo via getStaleWhileRevalidate.
 */
export async function warmRecipientCache(): Promise<void> {
  await Promise.allSettled([pessoasCache.revalidate(), timesCache.revalidate()]);
}

export async function listPessoasAtivas(idPessoa?: string): Promise<PessoaListItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(`/Pessoa/PessoasAtivas/${encodeURIComponent(target)}`);
  return Array.isArray(data) ? data.map(mapPessoa).filter((p) => p.nome) : [];
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); // tira acentos (igual TratarStringService.busca)
}

export async function searchPessoas(query: string): Promise<PessoaListItem[]> {
  const q = normalize((query ?? '').trim());
  const all = await listKudoRecipients(); // cacheado — sem fetch repetido
  if (q.length < 1) return all.slice(0, 50);
  return all
    .filter((p) => normalize(p.nome).includes(q))
    .sort((a, b) => {
      const ai = normalize(a.nome).indexOf(q);
      const bi = normalize(b.nome).indexOf(q);
      if (ai !== bi) return ai - bi;
      return a.nome.localeCompare(b.nome);
    })
    .slice(0, 25);
}

export async function searchTimes(query: string): Promise<TimeComboItem[]> {
  const q = normalize((query ?? '').trim());
  const all = await listTimesCombo(); // cacheado
  if (q.length < 1) return all.slice(0, 50);
  return all
    .filter((t) => normalize(t.nome).includes(q))
    .sort((a, b) => {
      const ai = normalize(a.nome).indexOf(q);
      const bi = normalize(b.nome).indexOf(q);
      if (ai !== bi) return ai - bi;
      return a.nome.localeCompare(b.nome);
    })
    .slice(0, 25);
}

export async function listOrganizacoes(idUsuario?: string): Promise<OrganizacaoListItem[]> {
  const session = await getValidSession();
  // Endpoint espera idUsuario (usuario.id), NÃO idPessoa — espelha listar(this.usuario.id) do front.
  const target = idUsuario ?? session.idUsuario ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(`/Organizacao/Listar/${encodeURIComponent(target)}`);
  return Array.isArray(data) ? data.map(mapOrganizacao).filter((o) => o.idOrganizacao) : [];
}

export async function selecionarOrganizacao(idOrganizacao: string): Promise<unknown> {
  return beeforHttp.get(`/Organizacao/Selecionar/${encodeURIComponent(idOrganizacao)}`);
}

export async function obterUsuariosOrganizacao(idOrganizacao?: string): Promise<PessoaListItem[]> {
  const session = await getValidSession();
  const target = idOrganizacao ?? session.idOrganizacao;
  if (!target) {
    logger.warn('obterUsuariosOrganizacao sem idOrganizacao.');
    return [];
  }
  const data = await beeforHttp.get<any[]>(
    `/Organizacao/ObterUsuariosOrganizacao/${encodeURIComponent(target)}`,
  );
  return Array.isArray(data) ? data.map(mapPessoa).filter((p) => p.nome) : [];
}

// ─── Times (combobox com favorito/grupo) — espelha new-selecionar-time ───────

export interface TimeFavoritoItem {
  id: string;
  nome: string;
  favorito: boolean;
  idGrupo?: string;
  logo?: string;
}

function mapTimeFavorito(raw: any): TimeFavoritoItem {
  return {
    id: String(raw?.id ?? raw?.idTime ?? '').trim(),
    nome: String(raw?.nome ?? raw?.name ?? '').trim(),
    favorito: Boolean(raw?.favorito),
    idGrupo: raw?.idGrupo ? String(raw.idGrupo) : undefined,
    logo: typeof raw?.logo === 'string' ? raw.logo : undefined,
  };
}

/**
 * Lista os times da pessoa na org ativa (combobox), incluindo flag `favorito`.
 * Endpoint resolve a org pelo token → re-lista sozinho após troca de organização.
 */
export async function listTimesComboFavorito(): Promise<TimeFavoritoItem[]> {
  const session = await getValidSession();
  const data = await beeforHttp.get<any[]>('/Time/listar/combobox/times', {
    idPessoa: session.idPessoa,
  });
  return Array.isArray(data) ? data.map(mapTimeFavorito).filter((t) => t.nome) : [];
}

export interface GrupoComboItem {
  idGrupo: string;
  nome: string;
}

function mapGrupo(raw: any): GrupoComboItem {
  return {
    idGrupo: String(raw?.idGrupo ?? raw?.id ?? '').trim(),
    nome: String(raw?.nome ?? raw?.name ?? '').trim(),
  };
}

/**
 * Lista os grupos da pessoa na org ativa. Espelha listarGruposPorPessoa do front
 * (só aparece pra quem não é Stakeholder; em erro/role sem acesso devolve []).
 */
export async function listGruposCombo(): Promise<GrupoComboItem[]> {
  const session = await getValidSession();
  try {
    const data = await beeforHttp.get<any[]>(
      `/Time/ListarGruposPorPessoa/${encodeURIComponent(session.idPessoa)}`,
    );
    return Array.isArray(data) ? data.map(mapGrupo).filter((g) => g.idGrupo && g.nome) : [];
  } catch (err) {
    logger.warn(`listGruposCombo falhou: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function getTimeFavoritado(): Promise<string | null> {
  const session = await getValidSession();
  if (!session.idUsuario || !session.idOrganizacao) return null;
  const data = await beeforHttp.get<unknown>(
    `/pessoa/pegarTimeFavoritado/${encodeURIComponent(session.idUsuario)}/${encodeURIComponent(
      session.idOrganizacao,
    )}`,
  );
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const id = obj.id ?? obj.idTime ?? obj.timeFavoritado;
    return id ? String(id) : null;
  }
  return null;
}

function favoritoBody(session: BeeforSession, idTime: string | null): Record<string, unknown> {
  return {
    id: session.idUsuario,
    idPessoa: session.idPessoa,
    idOrganizacao: session.idOrganizacao,
    timeFavoritado: idTime,
  };
}

export async function favoritarTime(idTime: string): Promise<unknown> {
  const session = await getValidSession();
  return beeforHttp.post('/pessoa/favoritarTime', favoritoBody(session, idTime));
}

export async function desfavoritarTime(): Promise<unknown> {
  const session = await getValidSession();
  return beeforHttp.post('/pessoa/desfavoritarTime', favoritoBody(session, null));
}

// ─── Troca de organização (token novo + invalidação de caches) ───────────────

export interface TrocaOrganizacaoResult {
  idOrganizacao: string | null;
  idPessoa: string;
  nome?: string;
  nomeOrganizacao?: string;
}

/**
 * Orquestra a troca de organização espelhando o goobeeteams:
 * 1. pega token novo escopado pra org (TrocarOrganizacao);
 * 2. invalida todos os caches org-scoped (sobrevivem no main process pós-reload da UI).
 * A UI deve recarregar após o sucesso.
 */
export async function trocarOrganizacao(idOrganizacao: string): Promise<TrocaOrganizacaoResult> {
  const session = await trocarOrganizacaoToken(idOrganizacao);

  await invalidateRecipientCache();
  try {
    const [{ invalidateKudoListsCache }, { invalidateStreakCache }] = await Promise.all([
      import('./beeforKudoService'),
      import('./beeforMoodService'),
    ]);
    invalidateKudoListsCache();
    await invalidateStreakCache();
  } catch (err) {
    logger.warn(
      `Falha ao invalidar caches pós-troca de org: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    idOrganizacao: session.idOrganizacao,
    idPessoa: session.idPessoa,
    nome: session.nome,
    nomeOrganizacao: session.nomeOrganizacao,
  };
}

export async function isTimeSheetHabilitada(): Promise<boolean> {
  try {
    const data = await beeforHttp.get<any>('/Organizacao/HabilitadaTimeSheetBeefor');
    if (typeof data === 'boolean') return data;
    if (data && typeof data === 'object' && 'habilitada' in data) {
      return Boolean((data as any).habilitada);
    }
    return Boolean(data);
  } catch (err) {
    logger.warn(`isTimeSheetHabilitada erro: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
