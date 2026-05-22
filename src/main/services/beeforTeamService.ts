import { beeforHttp } from './beeforHttpClient';
import type { TeamMember } from '../../shared/types/index';

/**
 * POST /Pessoa/ListarTodas — body com filtro + paginação. Body cifrado (AES+RSA) via beeforHttp.
 * Front: pessoas-list.component.ts loadData() manda { comecaCom, terminaCom, visaoLista, TelaPessoa }.
 */
interface ListarTodasFiltro {
  comecaCom: number;
  terminaCom: number;
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
    ultimoCheckpoint:
      typeof raw?.ultimoCheckpoint === 'string' ? raw.ultimoCheckpoint : null,
    respostasUltimoChecklist: Array.isArray(raw?.respostasUltimoChecklist)
      ? raw.respostasUltimoChecklist.map((r: any) => ({
          titulo: String(r?.titulo ?? ''),
          resposta: String(r?.resposta ?? ''),
        }))
      : [],
  };
}

export async function fetchTeamMembers(pageSize = 200): Promise<TeamMember[]> {
  const filtro: ListarTodasFiltro = {
    comecaCom: 0,
    terminaCom: pageSize,
    visaoLista: true,
    TelaPessoa: true,
  };
  const data = await beeforHttp.post<any>('/Pessoa/ListarTodas', filtro);
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
