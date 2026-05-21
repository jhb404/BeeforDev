import { beeforHttp, getValidSession } from './beeforHttpClient';
import type { BeeforAtividade } from '../../shared/types/index';

export interface CardComentario {
  id: string;
  idCard: string;
  idPessoa: string;
  nomePessoa?: string;
  texto: string;
  dataCriacao: string;
}

export interface CardLog {
  id: string;
  idCard: string;
  acao: string;
  descricao?: string;
  data: string;
  idPessoa?: string;
  nomePessoa?: string;
}

export interface AdicionarCardBody {
  IdQuadro: string;
  IdColuna: string;
  Nome: string;
  Descricao?: string;
  Tipo?: number;
  IdResponsavelCriacao: string;
}

export interface EditarCardBody {
  Nome?: string;
  Descricao?: string;
  Tipo?: number;
  IdResponsavel?: string;
  DataConclusao?: string | null;
}

export interface MoverCardBody {
  IdColunaDestino: string;
  IndiceDestino: number;
}

export interface AdicionarComentarioBody {
  IdCard: string;
  Texto: string;
  IdPessoa: string;
}

function mapAtividade(raw: any): BeeforAtividade {
  const idTime = typeof raw?.idTime === 'string' ? raw.idTime : undefined;
  const idOrganizacao = typeof raw?.idOrganizacao === 'string' ? raw.idOrganizacao : undefined;
  return {
    id: String(raw?.id ?? raw?.idCard ?? '').trim(),
    idQuadro: String(raw?.idQuadro ?? '').trim(),
    idTime,
    idOrganizacao,
    nome: String(raw?.nome ?? raw?.titulo ?? '').trim(),
    tipo: Number(raw?.tipo ?? 0),
    projeto: String(raw?.projeto ?? raw?.nomeProjeto ?? ''),
    timeBoard: String(raw?.timeBoard ?? raw?.nomeTime ?? ''),
    momento: String(raw?.momento ?? raw?.status ?? ''),
    dataCriacao: String(raw?.dataCriacao ?? ''),
    numeroCard: String(raw?.numeroCard ?? raw?.numero ?? ''),
  };
}

export async function listMinhasAtividades(idUsuario?: string): Promise<BeeforAtividade[]> {
  const session = await getValidSession();
  const target = idUsuario ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(
    `/Quadro/ListarMinhasTarefas/${encodeURIComponent(target)}`,
  );
  return Array.isArray(data) ? data.map(mapAtividade).filter((c) => c.id) : [];
}

export async function listAtividadesTime(idTime: string): Promise<BeeforAtividade[]> {
  if (!idTime) throw new Error('idTime obrigatório');
  const data = await beeforHttp.get<any[]>(
    `/Quadro/ListarTarefasPorTime/${encodeURIComponent(idTime)}`,
  );
  return Array.isArray(data) ? data.map(mapAtividade).filter((c) => c.id) : [];
}

export async function listAtividadesGrupo(idGrupo: string): Promise<BeeforAtividade[]> {
  if (!idGrupo) throw new Error('idGrupo obrigatório');
  const data = await beeforHttp.get<any[]>(
    `/Quadro/ListarTarefasPorGrupo/${encodeURIComponent(idGrupo)}`,
  );
  return Array.isArray(data) ? data.map(mapAtividade).filter((c) => c.id) : [];
}

export async function getCardDetail(
  idCard: string,
  idTime: string,
  idOrganizacao?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const org = idOrganizacao ?? session.idOrganizacao;
  if (!org) throw new Error('idOrganizacao indisponível.');
  return beeforHttp.get(
    `/Quadro/PegaCard/${encodeURIComponent(idCard)}/${encodeURIComponent(idTime)}/${encodeURIComponent(org)}`,
  );
}

export async function getCardResumo(idCard: string): Promise<unknown> {
  return beeforHttp.get(`/Quadro/PegaCardResumo/${encodeURIComponent(idCard)}`);
}

export async function getCardColuna(idCard: string): Promise<unknown> {
  return beeforHttp.get(`/Quadro/PegaColunaCard/${encodeURIComponent(idCard)}`);
}

export async function adicionarCard(body: AdicionarCardBody): Promise<unknown> {
  return beeforHttp.post('/Quadro/AdicionarCard', body);
}

export async function editarCard(idCard: string, body: EditarCardBody): Promise<unknown> {
  return beeforHttp.put(`/Quadro/EditarCard/${encodeURIComponent(idCard)}`, body);
}

export async function moverCard(idCard: string, body: MoverCardBody): Promise<unknown> {
  return beeforHttp.put(`/Quadro/EditarIndiceCard/${encodeURIComponent(idCard)}`, body);
}

export async function removerCard(idCard: string): Promise<unknown> {
  return beeforHttp.delete(`/Quadro/RemoverCard/${encodeURIComponent(idCard)}`);
}

export async function arquivarCard(
  idCard: string,
  arquivado: boolean,
): Promise<unknown> {
  const body = { IdCard: idCard, Arquivado: arquivado };
  const path = arquivado ? 'ArquivarCard' : 'DesarquivarCard';
  return beeforHttp.put(`/Quadro/${path}/${encodeURIComponent(idCard)}`, body);
}

export async function listarComentarios(idCard: string): Promise<CardComentario[]> {
  const data = await beeforHttp.get<any[]>(
    `/Quadro/PegarComentarios/${encodeURIComponent(idCard)}`,
  );
  return Array.isArray(data)
    ? data.map((c) => ({
        id: String(c?.id ?? ''),
        idCard: String(c?.idCard ?? idCard),
        idPessoa: String(c?.idPessoa ?? ''),
        nomePessoa: typeof c?.nomePessoa === 'string' ? c.nomePessoa : undefined,
        texto: String(c?.texto ?? c?.comentario ?? ''),
        dataCriacao: String(c?.dataCriacao ?? ''),
      }))
    : [];
}

export async function adicionarComentario(idCard: string, texto: string): Promise<unknown> {
  const session = await getValidSession();
  const body: AdicionarComentarioBody = {
    IdCard: idCard,
    Texto: texto,
    IdPessoa: session.idPessoa,
  };
  return beeforHttp.post('/Quadro/AdicionarComentario', body);
}

export async function editarComentario(
  idComentario: string,
  texto: string,
): Promise<unknown> {
  return beeforHttp.put(`/Quadro/EditarComentario/${encodeURIComponent(idComentario)}`, {
    IdComentario: idComentario,
    Texto: texto,
  });
}

export async function removerComentario(idComentario: string): Promise<unknown> {
  return beeforHttp.delete(`/Quadro/RemoverComentario/${encodeURIComponent(idComentario)}`);
}

export async function listarLogsCard(idCard: string): Promise<CardLog[]> {
  const data = await beeforHttp.get<any[]>(
    `/Quadro/ListarLogsCard/${encodeURIComponent(idCard)}`,
  );
  return Array.isArray(data)
    ? data.map((l) => ({
        id: String(l?.id ?? ''),
        idCard: String(l?.idCard ?? idCard),
        acao: String(l?.acao ?? l?.tipo ?? ''),
        descricao: typeof l?.descricao === 'string' ? l.descricao : undefined,
        data: String(l?.data ?? l?.dataCriacao ?? ''),
        idPessoa: typeof l?.idPessoa === 'string' ? l.idPessoa : undefined,
        nomePessoa: typeof l?.nomePessoa === 'string' ? l.nomePessoa : undefined,
      }))
    : [];
}

export async function listarTodosQuadrosTime(idTime: string): Promise<unknown[]> {
  const data = await beeforHttp.get<any[]>(`/Quadro/TodosQuadros/${encodeURIComponent(idTime)}`);
  return Array.isArray(data) ? data : [];
}

export async function pegarColunas(idQuadro: string): Promise<unknown[]> {
  const data = await beeforHttp.get<any[]>(`/Quadro/PegarColunas/${encodeURIComponent(idQuadro)}`);
  return Array.isArray(data) ? data : [];
}

export async function listarResponsaveisDoTime(idTime: string): Promise<unknown[]> {
  const data = await beeforHttp.get<any[]>(
    `/Pessoa/ListaResposaveisDoMesmoTime/${encodeURIComponent(idTime)}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function pegarProjetos(idTime?: string): Promise<unknown[]> {
  const data = await beeforHttp.get<any[]>(
    `/Projeto/PegarProjetos/${encodeURIComponent(idTime ?? '')}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function pegarIteracoesBacklog(idTime: string): Promise<unknown[]> {
  const data = await beeforHttp.get<any[]>(
    `/Quadro/PegarIteracoesBacklog/${encodeURIComponent(idTime)}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function pegarEtiquetas(idQuadro: string): Promise<unknown[]> {
  const data = await beeforHttp.get<any[]>(
    `/Quadro/PegarEtiquetas/${encodeURIComponent(idQuadro)}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function pegarCardResumoCompleto(idCard: string): Promise<{
  card: unknown;
  coluna: unknown;
  comentarios: unknown;
}> {
  // Fetch paralelo dos endpoints que front goobeeteams chama abrindo modal de card
  const [coluna, resumo, comentarios] = await Promise.all([
    beeforHttp.get(`/Quadro/PegaColunaCard/${encodeURIComponent(idCard)}`).catch(() => null),
    beeforHttp.get(`/Quadro/PegaCardResumo/${encodeURIComponent(idCard)}`).catch(() => null),
    beeforHttp.get(`/Quadro/PegarComentarios/${encodeURIComponent(idCard)}`).catch(() => []),
  ]);
  return { card: resumo, coluna, comentarios };
}
