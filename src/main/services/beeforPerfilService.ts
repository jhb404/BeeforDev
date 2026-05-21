import { beeforHttp, getValidSession } from './beeforHttpClient';

export interface PerfilDados {
  foto: string;
  nome: string;
  funcaoPrincipal: string;
  ultimoCliente: string;
  miniBio: string;
  quantidadeVisitas: number; // checkpoints
  ultimoCheckpoint: string;
  proximoCheckpoint: string;
  mediaSentimentoColaborador: number;
}

export interface HabilidadeItem {
  id: string;
  nome: string;
  nivel?: number;
}

export interface MotivadorItem {
  idMotivador: string;
  nome: string;
  indice: number; // 1-10
}

export interface AcaoColaboradorItem {
  id: string;
  titulo: string;
  descricao?: string;
  status?: string;
  data?: string;
}

export interface PersonalMappingItem {
  idTitulo: string;
  titulo: string;
  itens: Array<{ idItem?: string; nomeItem: string }>;
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export async function getPerfil(idPessoa?: string): Promise<PerfilDados | null> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any>(`/Pessoa/PegarPerfil/${encodeURIComponent(target)}`);
  if (!data) return null;
  return {
    foto: asStr(data.foto),
    nome: asStr(data.nome),
    funcaoPrincipal: asStr(data.funcaoPrincipal),
    ultimoCliente: asStr(data.ultimoCliente),
    miniBio: asStr(data.miniBio),
    quantidadeVisitas: Number(data.quantidadeVisitas ?? 0),
    ultimoCheckpoint: asStr(data.ultimoCheckpoint),
    proximoCheckpoint: asStr(data.proximoCheckpoint),
    mediaSentimentoColaborador: Number(data.mediaSentimentoColaborador ?? 0),
  };
}

export async function getHabilidades(idPessoa?: string): Promise<HabilidadeItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(`/Pessoa/PegarHabilidades/${encodeURIComponent(target)}`);
  return Array.isArray(data)
    ? data.map((h) => ({
        id: asStr(h?.id ?? h?.idHabilidade),
        nome: asStr(h?.nome ?? h?.nomeHabilidade),
        nivel: typeof h?.nivel === 'number' ? h.nivel : undefined,
      })).filter((h) => h.nome)
    : [];
}

export async function getHabilidadesCombo(idPessoa?: string): Promise<HabilidadeItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(
    `/Pessoa/PegarHabilidadesComboBox/${encodeURIComponent(target)}`,
  );
  return Array.isArray(data)
    ? data.map((h) => ({ id: asStr(h?.id), nome: asStr(h?.nome) })).filter((h) => h.nome)
    : [];
}

export async function adicionarHabilidade(
  nomeHabilidade: string,
  idPessoa?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const body = {
    idPessoa: target,
    nomeHabilidade,
    idResponsavelCriacao: session.idPessoa,
  };
  return beeforHttp.post('/Pessoa/AdicionarHabilidade', body);
}

export async function removerHabilidade(
  idHabilidade: string,
  idPessoa?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  // Front: DELETE /pessoa/RemoverHabilidade/{idPessoa} com body = idHabilidade
  return beeforHttp.delete(
    `/Pessoa/RemoverHabilidade/${encodeURIComponent(target)}`,
    undefined,
    idHabilidade, // body cru (string)
  );
}

export async function getMotivadores(idPessoa?: string): Promise<MotivadorItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  // Retorno: { idPessoa, motivadores: [{ id, nome, nomeTraduzido, indice }] }
  const data = await beeforHttp.get<any>(`/Pessoa/PegarMotivadores/${encodeURIComponent(target)}`);
  const arr = Array.isArray(data?.motivadores)
    ? data.motivadores
    : Array.isArray(data)
      ? data
      : [];
  return arr
    .map((m: any) => ({
      idMotivador: asStr(m?.id ?? m?.idMotivador ?? m?.motivador?.id),
      nome: asStr(m?.nomeTraduzido ?? m?.nome ?? m?.motivador?.nome),
      indice: Number(m?.indice ?? 0),
    }))
    .filter((m: MotivadorItem) => m.nome)
    .sort((a: MotivadorItem, b: MotivadorItem) => a.indice - b.indice); // ordem 1..10
}

/** Cria motivadores default (chamado quando pessoa não tem nenhum). */
export async function adicionarMotivadores(idPessoa?: string): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  return beeforHttp.post('/Pessoa/AdicionarMotivadores', {
    idPessoa: target,
    idResponsavelCriacao: session.idPessoa,
  });
}

/** Reordena motivadores: array na ordem desejada → indice = posição+1. */
export async function editarMotivadores(
  motivadoresOrdenados: Array<{ idMotivador: string }>,
  idPessoa?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const body = {
    idPessoa: target,
    idResponsavelEdicao: session.idPessoa,
    motivadoresEditados: motivadoresOrdenados.map((m, i) => ({
      idMotivador: m.idMotivador,
      indice: i + 1,
    })),
  };
  return beeforHttp.put(`/Pessoa/EditarMotivadores/${encodeURIComponent(target)}`, body);
}

export async function getAcoesColaborador(idPessoa?: string): Promise<AcaoColaboradorItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(
    `/Pessoa/ListarAcaoColaborador/${encodeURIComponent(target)}`,
  );
  return Array.isArray(data)
    ? data.map((a) => ({
        id: asStr(a?.id ?? a?.idAcao),
        titulo: asStr(a?.titulo ?? a?.nome ?? a?.acao),
        descricao: typeof a?.descricao === 'string' ? a.descricao : undefined,
        status: typeof a?.status === 'string' ? a.status : undefined,
        data: asStr(a?.data ?? a?.dataCriacao),
      })).filter((a) => a.titulo)
    : [];
}

export async function adicionarPersonalMapping(
  titulo: string,
  itens: string[],
  idPessoa?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const body = {
    IdPessoa: target,
    Titulo: titulo,
    Itens: itens,
    IdResponsavel: session.idPessoa,
    criadoPeloSistema: false,
  };
  return beeforHttp.post(`/Pessoa/AdicionarPersonalMapping/${encodeURIComponent(target)}`, body);
}

export async function editarPersonalMapping(
  idTitulo: string,
  titulo: string,
  itens: Array<{ IdItem?: string; NomeItem: string }>,
  idPessoa?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const body = {
    IdPessoa: target,
    IdTitulo: idTitulo,
    Titulo: titulo,
    Itens: itens,
    IdResponsavel: session.idPessoa,
  };
  return beeforHttp.put(`/Pessoa/EditarPersonalMapping/${encodeURIComponent(target)}`, body);
}

export async function deletarPersonalMapping(
  idMapping: string,
  idPessoa?: string,
): Promise<unknown> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  return beeforHttp.delete(
    `/Pessoa/DeletarPersonalMapping/${encodeURIComponent(idMapping)}/${encodeURIComponent(target)}`,
  );
}

export async function getPersonalMapping(idPessoa?: string): Promise<PersonalMappingItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(
    `/Pessoa/PegarPersonalMapping/${encodeURIComponent(target)}`,
  );
  return Array.isArray(data)
    ? data.map((p) => ({
        idTitulo: asStr(p?.idTitulo ?? p?.id),
        titulo: asStr(p?.titulo),
        itens: Array.isArray(p?.itens)
          ? p.itens.map((it: any) => ({
              idItem: typeof it?.idItem === 'string' ? it.idItem : undefined,
              nomeItem: asStr(it?.nomeItem ?? it),
            }))
          : [],
      })).filter((p) => p.titulo)
    : [];
}
