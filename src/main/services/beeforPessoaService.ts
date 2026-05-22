import { beeforHttp, getValidSession } from './beeforHttpClient';
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

const pessoasCache = new PersistentCache<PessoaListItem[]>(
  'kudo-recipients-pessoas',
  async () => {
    const session = await getValidSession();
    const data = await beeforHttp.get<any[]>(
      `/Pessoa/PegarPessoasUsuarioNaoInclusivo/${encodeURIComponent(session.idPessoa)}`,
    );
    return Array.isArray(data) ? data.map(mapPessoa).filter((p) => p.nome) : [];
  },
);

const timesCache = new PersistentCache<TimeComboItem[]>(
  'kudo-recipients-times',
  async () => {
    const data = await beeforHttp.get<any[]>('/Pessoa/PegarTimesComboBox');
    return Array.isArray(data) ? data.map(mapTime).filter((t) => t.nome) : [];
  },
);

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
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // tira acentos (igual TratarStringService.busca)
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
  const target = idUsuario ?? session.idPessoa;
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
  const data = await beeforHttp.get<any[]>(`/Organizacao/ObterUsuariosOrganizacao/${encodeURIComponent(target)}`);
  return Array.isArray(data) ? data.map(mapPessoa).filter((p) => p.nome) : [];
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
    logger.warn(
      `isTimeSheetHabilitada erro: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}
