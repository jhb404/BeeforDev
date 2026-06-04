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
  };
}

export async function fetchTeamMembers(pageSize = 200): Promise<TeamMember[]> {
  const session = await getValidSession();
  const filtro: ListarTodasFiltro = {
    nomeColaborador: '',
    idTime: '',
    idGrupo: '',
    idCliente: '',
    idResponsavel: '',
    status: '',
    statusPessoa: 1, // 1 = ativos (default do front)
    checkpoints: '',
    habilidade: '',
    comecaCom: 0,
    terminaCom: pageSize,
    idPessoaLogada: session.idPessoa,
    idGestor: '',
    semaforoChecklist: '',
    visaoLista: true,
    TelaPessoa: true,
  };
  const data = await beeforHttp.post<any>('/Pessoa/ListarTodas', filtro);
  // DEBUG: inspeciona shape cru do retorno (tipo + amostra) p/ achar por que vem vazio.
  logger.info(
    `ListarTodas retorno: type=${typeof data} isArray=${Array.isArray(data)} ` +
      `len=${Array.isArray(data) ? data.length : 'n/a'} ` +
      `sample=${JSON.stringify(data).slice(0, 300)}`,
  );
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.pessoas)
        ? data.pessoas
        : Array.isArray(data?.lista)
          ? data.lista
          : [];
  return arr.map(mapMember).filter((m: TeamMember) => m.nome);
}
