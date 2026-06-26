import { beeforHttp, getValidSession } from './beeforHttpClient';
import { logger } from '../logger';
import type { TeamMember } from '../../shared/types/index';

/**
 * POST /Pessoa/ListarTodas — body com filtro + paginação. Body cifrado (AES+RSA) via beeforHttp.
 * Front (pessoas.component.ts + pessoas-list loadData) manda o FiltrosPessoas COMPLETO; o backend
 * espera todos os campos. Em especial `statusPessoa: 1` (ativos) e `idPessoaLogada` — sem eles a
 * query volta vazia/errada. Replicamos o shape inteiro com defaults vazios.
 */
interface ListarTodasFiltro {
  nomeColaborador: string;
  idTime: string;
  idGrupo: string;
  idCliente: string;
  idResponsavel: string;
  status: string;
  statusPessoa: number;
  checkpoints: string;
  habilidade: string;
  comecaCom: number;
  terminaCom: number;
  idPessoaLogada: string;
  idGestor: string;
  semaforoChecklist: string;
  visaoLista: boolean;
  TelaPessoa: boolean;
  [key: string]: unknown;
}

function mapMember(raw: any): TeamMember {
  return {
    nome: String(raw?.nome ?? raw?.name ?? ''),
    foto: String(raw?.foto ?? raw?.imagem ?? ''),
    funcaoPrincipal: String(raw?.funcaoPrincipal ?? raw?.funcao ?? raw?.cargo ?? ''),
    email: String(raw?.email ?? ''),
    status: Boolean(raw?.status ?? raw?.ativo ?? false),
    ultimoCliente: typeof raw?.ultimoCliente === 'string' ? raw.ultimoCliente : null,
    ultimoCheckpoint: typeof raw?.ultimoCheckpoint === 'string' ? raw.ultimoCheckpoint : null,
    respostasUltimoChecklist: Array.isArray(raw?.respostasUltimoChecklist)
      ? raw.respostasUltimoChecklist.map((r: any) => ({
          titulo: String(r?.titulo ?? ''),
          resposta: String(r?.resposta ?? ''),
        }))
      : [],
    idsTimes: Array.isArray(raw?.idsTimes)
      ? raw.idsTimes.map((id: unknown) => String(id)).filter(Boolean)
      : Array.isArray(raw?.times)
        ? raw.times.map((t: any) => String(t?.id ?? '')).filter(Boolean)
        : [],
  };
}

export interface TeamMembersFilter {
  idTime?: string;
  idGrupo?: string;
  pageSize?: number;
}

function extractArray(data: any): any[] {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.pessoas)
        ? data.pessoas
        : Array.isArray(data?.lista)
          ? data.lista
          : [];
}

const MAX_PAGES = 50; // trava de segurança: 50 * pageSize

/**
 * O backend filtra por idTime/idGrupo no body (igual lista-perfil do web) e pagina
 * por intervalo [comecaCom, terminaCom). Buscamos TODAS as páginas — senão um time
 * cujos membros caem além do corte (ex.: 200) volta incompleto.
 */
export async function fetchTeamMembers(opts: TeamMembersFilter = {}): Promise<TeamMember[]> {
  const { idTime = '', idGrupo = '', pageSize = 200 } = opts;
  const session = await getValidSession();
  const out: TeamMember[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const comecaCom = page * pageSize;
    const filtro: ListarTodasFiltro = {
      nomeColaborador: '',
      idTime,
      idGrupo,
      idCliente: '',
      idResponsavel: '',
      status: '',
      statusPessoa: 1, // 1 = ativos (default do front)
      checkpoints: '',
      habilidade: '',
      comecaCom,
      terminaCom: comecaCom + pageSize,
      idPessoaLogada: session.idPessoa,
      idGestor: '',
      semaforoChecklist: '',
      visaoLista: true,
      TelaPessoa: true,
    };
    const data = await beeforHttp.post<any>('/Pessoa/ListarTodas', filtro);
    const arr = extractArray(data);
    for (const raw of arr) {
      const m = mapMember(raw);
      if (!m.nome) continue;
      const key = (m.email || m.nome).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    if (arr.length < pageSize) break; // última página
  }

  logger.info(
    `ListarTodas: ${out.length} pessoas (idTime=${idTime || '-'} idGrupo=${idGrupo || '-'})`,
  );
  return out;
}
