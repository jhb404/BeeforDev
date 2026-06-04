import { beeforHttp, beeforHttpUpload, getValidSession } from './beeforHttpClient';
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

/**
 * Body do EditarCard espelhando o contrato do front goobeeteams (Quadro/EditarCard).
 * O backend espera o card completo no PUT; enviar parcial pode zerar campos.
 * Todos opcionais aqui pois o renderer monta a partir do card carregado.
 */
export interface EditarCardBody {
  idCard?: string;
  nome?: string;
  descricao?: string;
  idProjeto?: string | null;
  idEpico?: string | null;
  idIteracao?: string | null;
  nomeIteracao?: string | null;
  idColuna?: string | null;
  pontuacao?: number | string | null;
  bloqueado?: boolean;
  motivoBloqueio?: string | null;
  idsResponsaveisCard?: string[];
  cardEtiquetas?: Array<{ idEtiqueta: string; nomeEtiqueta: string; corEtiqueta: string }>;
  backlog?: boolean;
  idResponsavelEdicao?: string;
  esforco?: string | null;
  quantidadeVagas?: number | string | null;
  dataPrevistaEntrega?: string | null;
  tipo?: number;
  idCardHistoria?: string | null;
  dataInicio?: string | null;
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

function pickStr(raw: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = raw?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object') {
      // tenta um nivel aninhado (ex: time.idTime)
      for (const sk of keys) {
        const sv = v[sk];
        if (typeof sv === 'string' && sv.trim()) return sv.trim();
      }
    }
  }
  return undefined;
}

let _loggedRaw = false;

function mapAtividade(raw: any): BeeforAtividade {
  // DEBUG temporario: loga as chaves reais do 1o item p/ achar idTime/idQuadro corretos
  if (!_loggedRaw && raw && typeof raw === 'object') {
    _loggedRaw = true;
    console.log('[ATIV-RAW] keys:', Object.keys(raw), 'sample:', raw);
  }
  const idTime = pickStr(raw, 'idTime', 'idTimeQuadro', 'idTimeBoard', 'time');
  const idOrganizacao = pickStr(raw, 'idOrganizacao', 'idOrg');
  return {
    id: String(raw?.id ?? raw?.idCard ?? '').trim(),
    idQuadro: String(raw?.idQuadro ?? raw?.idBoard ?? '').trim(),
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
  const session = await getValidSession();
  const fullBody: EditarCardBody = {
    backlog: false,
    ...body,
    idCard,
    idResponsavelEdicao: body.idResponsavelEdicao ?? session.idPessoa,
  };
  return beeforHttp.put(`/Quadro/EditarCard/${encodeURIComponent(idCard)}`, fullBody);
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
  idQuadro?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const body = {
    idCard,
    idQuadro: idQuadro ?? '',
    idResponsavelEdicao: session.idPessoa,
  };
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

export async function editarComentario(idComentario: string, texto: string): Promise<unknown> {
  return beeforHttp.put(`/Quadro/EditarComentario/${encodeURIComponent(idComentario)}`, {
    IdComentario: idComentario,
    Texto: texto,
  });
}

export async function removerComentario(idComentario: string): Promise<unknown> {
  return beeforHttp.delete(`/Quadro/RemoverComentario/${encodeURIComponent(idComentario)}`);
}

export async function listarLogsCard(idCard: string): Promise<CardLog[]> {
  const data = await beeforHttp.get<any[]>(`/Quadro/ListarLogsCard/${encodeURIComponent(idCard)}`);
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

export interface CardAnexo {
  idAnexo: string;
  nome: string;
  url: string;
  tipo: string;
}

export async function listarAnexos(idCard: string): Promise<CardAnexo[]> {
  const data = await beeforHttp.get<any[]>(`/Quadro/PegarAnexos/${encodeURIComponent(idCard)}`);
  return Array.isArray(data)
    ? data.map((x) => ({
        idAnexo: String(x?.idAnexo ?? x?.id ?? ''),
        nome: String(x?.nome ?? x?.nomeArquivo ?? x?.nomeAnexo ?? 'arquivo'),
        url: String(x?.url ?? x?.caminho ?? x?.link ?? ''),
        tipo: String(x?.tipo ?? x?.extensao ?? ''),
      }))
    : [];
}

export async function removerAnexo(idAnexo: string): Promise<unknown> {
  return beeforHttp.delete(`/Quadro/RemoverAnexo/${encodeURIComponent(idAnexo)}`);
}

export async function adicionarAnexo(params: {
  idCard: string;
  idTime: string;
  fileName: string;
  fileType: string;
  fileBytes: ArrayBuffer;
}): Promise<unknown> {
  const session = await getValidSession();
  return beeforHttpUpload(
    '/Quadro/AdicionarAnexo',
    {
      IdCard: params.idCard,
      IdTime: params.idTime,
      IdPessoaResponsavel: session.idPessoa,
      ProjetoEpico: 'false',
    },
    { name: params.fileName, type: params.fileType, bytes: params.fileBytes },
  );
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
