import { beeforHttp, getValidSession } from './beeforHttpClient';
import type {
  KudoCardCounts,
  KudoCardDetail,
  KudoCardListItem,
  KudoCardLists,
  KudoCardType,
} from '../../shared/types/index';
import { KUDO_CARD_TIPO_BY_TYPE } from '../../shared/types/index';

export type KudoDestinatarioTipo = 1 | 2; // 1 = pessoa, 2 = time

export interface EnviarKudoBody {
  IdTime?: string;
  De: string;
  Para?: string;
  Mensagem: string;
  TipoDestinatario: KudoDestinatarioTipo;
  TipoKudoCard: number;
  ResponsavelCriacao: string;
  DataCriacao: string;
  IdOrganizacao: string;
  IdKudoCard?: string | null;
}

// Enum TipoKudoCardEnum (backend) — nome → número (1-8). API pode serializar enum como string.
const TIPO_NOME_TO_NUM: Record<string, number> = {
  ObrigadoPelaForca: 1,
  ParabensMestre: 2,
  QueMaravilha: 3,
  QueTrabalhoIncrivel: 4,
  VoceEImbativel: 5,
  SuperTrabalho: 6,
  TimePoderoso: 7,
  Parabens: 8,
};

function parseTipo(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n; // "3"
    if (TIPO_NOME_TO_NUM[v]) return TIPO_NOME_TO_NUM[v]; // "QueMaravilha"
  }
  return 0;
}

function mapItem(raw: any): KudoCardListItem {
  return {
    id: String(raw?.id ?? raw?.idKudoCard ?? '').trim(),
    mensagemBoxKudoCard: String(
      raw?.mensagemBoxKudoCard ?? raw?.mensagemBox ?? raw?.mensagem ?? '',
    ),
    mensagemKudoCard: String(raw?.mensagemKudoCard ?? raw?.mensagem ?? ''),
    nomeOrganizacao: String(raw?.nomeOrganizacao ?? ''),
    destinatario:
      typeof raw?.destinatario === 'string'
        ? raw.destinatario
        : typeof raw?.nomePara === 'string'
          ? raw.nomePara
          : undefined,
    remetente:
      typeof raw?.remetente === 'string'
        ? raw.remetente
        : typeof raw?.nomeDe === 'string'
          ? raw.nomeDe
          : undefined,
    tipoKudoCard: parseTipo(raw?.tipoKudoCard),
    dataEnvio: String(raw?.dataEnvio ?? raw?.dataCriacao ?? ''),
  };
}

export async function getKudoCounts(idPessoa?: string): Promise<KudoCardCounts> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any>('/KudoCard/RecebidosEnviadosPessoa', {
    idPessoa: target,
  });
  return {
    enviados: Number(data?.enviados ?? 0),
    recebidos: Number(data?.recebidos ?? 0),
  };
}

const LISTS_CACHE_TTL_MS = 15_000;
const listsCache = new Map<string, { expiresAt: number; data: KudoCardLists }>();

export function invalidateKudoListsCache(): void {
  listsCache.clear();
}

export async function getKudoLists(
  idPessoa?: string,
  opts: { force?: boolean } = {},
): Promise<KudoCardLists> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const cacheKey = target;

  if (!opts.force) {
    const hit = listsCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) return hit.data;
  }

  const data = await beeforHttp.get<any>('/KudoCard/ListaRecebidosEnviadosPessoa', {
    idPessoa: target,
  });
  const lists: KudoCardLists = {
    enviados: Array.isArray(data?.enviados) ? data.enviados.map(mapItem) : [],
    recebidos: Array.isArray(data?.recebidos) ? data.recebidos.map(mapItem) : [],
  };
  listsCache.set(cacheKey, { expiresAt: Date.now() + LISTS_CACHE_TTL_MS, data: lists });
  return lists;
}

export async function getKudoDetail(id: string): Promise<KudoCardDetail | null> {
  if (!id) throw new Error('idKudoCard obrigatório');
  const data = await beeforHttp.get<any>(`/KudoCard/Buscar/${encodeURIComponent(id)}`);
  if (!data) return null;
  return {
    id: data?.id ? String(data.id) : null,
    mensagemBoxKudoCard: String(data?.mensagemBoxKudoCard ?? ''),
    mensagemKudoCard: String(data?.mensagemKudoCard ?? ''),
    nomeOrganizacao: String(data?.nomeOrganizacao ?? ''),
    remetente: typeof data?.remetente === 'string' ? data.remetente : undefined,
    destinatario:
      typeof data?.destinatario === 'string' ? data.destinatario : undefined,
    imagem: typeof data?.imagem === 'string' ? data.imagem : null,
    nomeTraducao:
      typeof data?.nomeTraducao === 'string' ? data.nomeTraducao : null,
    tipoKudoCard: parseTipo(data?.tipoKudoCard),
    times: Array.isArray(data?.times) ? data.times : [],
    dataEnvio: String(data?.dataEnvio ?? data?.dataCriacao ?? ''),
  };
}

export async function listKudoRecebidosTime(idTime: string): Promise<KudoCardListItem[]> {
  if (!idTime) throw new Error('idTime obrigatório');
  const data = await beeforHttp.get<any[]>('/KudoCard/ListaRecebidosDoTime', { idTime });
  return Array.isArray(data) ? data.map(mapItem) : [];
}

export async function listKudoRecebidosGeral(filters?: {
  idTime?: string;
  idGrupo?: string;
}): Promise<KudoCardListItem[]> {
  const data = await beeforHttp.get<any[]>('/KudoCard/ListaRecebidosGeral', {
    idTime: filters?.idTime,
    idGrupo: filters?.idGrupo,
  });
  return Array.isArray(data) ? data.map(mapItem) : [];
}

export interface SendKudoCardHttpRequest {
  /** Recipient idPessoa (when person) or idTime (when team) */
  idDestinatario: string;
  tipoDestinatario: KudoDestinatarioTipo;
  cardType: KudoCardType;
  mensagem: string;
  /** Optional team scope when sending to a person */
  idTime?: string;
}

export async function sendKudoCard(req: SendKudoCardHttpRequest): Promise<unknown> {
  const session = await getValidSession();
  if (!session.idOrganizacao) {
    throw new Error('Sessão sem idOrganizacao — não é possível enviar KudoCard.');
  }
  if (!req.idDestinatario) throw new Error('idDestinatario vazio.');
  if (!req.mensagem?.trim()) throw new Error('mensagem vazia.');

  const isTeam = req.tipoDestinatario === 2;
  // Front: time → só IdTime; pessoa → só Para. Mutuamente exclusivo.
  const body: EnviarKudoBody = {
    De: session.idPessoa,
    Mensagem: req.mensagem.trim(),
    TipoDestinatario: req.tipoDestinatario,
    TipoKudoCard: KUDO_CARD_TIPO_BY_TYPE[req.cardType],
    ResponsavelCriacao: session.idPessoa,
    DataCriacao: new Date().toISOString(),
    IdOrganizacao: session.idOrganizacao,
    IdKudoCard: null,
    ...(isTeam
      ? { IdTime: req.idTime ?? req.idDestinatario }
      : { Para: req.idDestinatario }),
  };
  const result = await beeforHttp.post('/KudoCard/Enviar', body);
  invalidateKudoListsCache();
  return result;
}
