import { useCallback, useEffect, useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import type { AtividadeDetalhes } from './useAtividadeDetalhes';

export interface Opcao {
  id: string;
  nome: string;
}

/** Pontos Fibonacci usados no planning poker. */
export const PONTOS_FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34];

/** Tipos de card (espelha enum TipoColunaCard: Tarefa=0, Historia=1, Bug=2). */
export const TIPOS_CARD: Array<{ valor: number; nome: string }> = [
  { valor: 0, nome: 'Tarefa' },
  { valor: 1, nome: 'História' },
  { valor: 2, nome: 'Bug' },
];

export interface EdicaoForm {
  nome: string;
  descricao: string;
  idColuna: string | null;
  tipo: number | null;
  idResponsavel: string | null;
  idProjeto: string | null;
  idEpico: string | null;
  idIteracao: string | null;
  nomeIteracao: string | null;
  idCardHistoria: string | null;
  pontos: number | null;
  esforco: string | null; // "h:m"
  dataInicio: string | null; // yyyy-mm-dd
  dataPrevistaEntrega: string | null; // yyyy-mm-dd
  bloqueado: boolean;
  motivoBloqueio: string | null;
}

function mapOpcoes(raw: unknown, idKeys: string[], nomeKeys: string[]): Opcao[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const id = idKeys.map((k) => o[k]).find((v) => typeof v === 'string' && v) as string | undefined;
      const nome = nomeKeys.map((k) => o[k]).find((v) => typeof v === 'string' && v) as
        | string
        | undefined;
      return id && nome ? { id, nome } : null;
    })
    .filter((x): x is Opcao => x !== null);
}

/** Converte ISO/Date string -> yyyy-mm-dd p/ <input type=date>. */
function toDateInput(v: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export interface UseAtividadeEdicaoResult {
  form: EdicaoForm;
  setCampo: <K extends keyof EdicaoForm>(campo: K, valor: EdicaoForm[K]) => void;
  colunas: Opcao[];
  responsaveis: Opcao[];
  iteracoes: Opcao[];
  projetos: Opcao[];
  loadingListas: boolean;
  salvando: boolean;
  arquivando: boolean;
  erro: string | null;
  salvar: () => Promise<boolean>;
  arquivar: () => Promise<boolean>;
}

/**
 * Gerencia edicao do card: carrega listas de opcoes, mantem o form e persiste.
 * Seed do form vem de `detalhes.ids` apos o card carregar.
 */
export function useAtividadeEdicao(
  atividade: BeeforAtividade | null,
  detalhes: AtividadeDetalhes,
  detalhesLoading: boolean,
  rawCard: any,
): UseAtividadeEdicaoResult {
  const [form, setForm] = useState<EdicaoForm>(seedForm(detalhes, atividade));
  const [colunas, setColunas] = useState<Opcao[]>([]);
  const [responsaveis, setResponsaveis] = useState<Opcao[]>([]);
  const [iteracoes, setIteracoes] = useState<Opcao[]>([]);
  const [projetos, setProjetos] = useState<Opcao[]>([]);
  const [loadingListas, setLoadingListas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [arquivando, setArquivando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Re-seed do form quando o card termina de carregar
  useEffect(() => {
    if (!detalhesLoading) setForm(seedForm(detalhes, atividade));
  }, [detalhesLoading, detalhes, atividade]);

  // Carrega listas de opcoes (colunas dependem do idQuadro; resto do idTime)
  useEffect(() => {
    if (!atividade) return;
    let cancelled = false;
    const idTime = atividade.idTime ?? '';
    const idQuadro = atividade.idQuadro ?? '';

    (async () => {
      if (!window.beeforHttp) return;
      setLoadingListas(true);
      try {
        const [colRes, respRes, iterRes, projRes] = await Promise.all([
          idQuadro ? window.beeforHttp.atividades.colunas(idQuadro).catch(() => null) : null,
          idTime ? window.beeforHttp.atividades.responsaveis(idTime).catch(() => null) : null,
          idTime ? window.beeforHttp.atividades.iteracoes(idTime).catch(() => null) : null,
          window.beeforHttp.atividades.projetos(idTime).catch(() => null),
        ]);
        if (cancelled) return;
        if (colRes?.ok) setColunas(mapOpcoes(colRes.data, ['id', 'idColuna'], ['nome', 'nomeColuna']));
        if (respRes?.ok)
          setResponsaveis(mapOpcoes(respRes.data, ['idPessoa', 'id'], ['nomeMembro', 'nome']));
        if (iterRes?.ok)
          setIteracoes(mapOpcoes(iterRes.data, ['idIteracao', 'id'], ['nome']));
        if (projRes?.ok) setProjetos(mapOpcoes(projRes.data, ['idProjeto', 'id'], ['nome']));
      } finally {
        if (!cancelled) setLoadingListas(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [atividade?.id, atividade?.idQuadro, atividade?.idTime]);

  const setCampo = useCallback(
    <K extends keyof EdicaoForm>(campo: K, valor: EdicaoForm[K]) => {
      setForm((f) => {
        const next = { ...f, [campo]: valor };
        // Trocar iteracao tambem atualiza o nome (backend espera ambos)
        if (campo === 'idIteracao') {
          const it = iteracoes.find((i) => i.id === valor);
          next.nomeIteracao = it ? it.nome : null;
        }
        // Trocar projeto limpa epico (epico pertence ao projeto)
        if (campo === 'idProjeto') {
          next.idEpico = null;
        }
        return next;
      });
    },
    [iteracoes],
  );

  const salvar = useCallback(async (): Promise<boolean> => {
    if (!atividade || !window.beeforHttp) return false;
    setSalvando(true);
    setErro(null);
    try {
      // cardEtiquetas: o backend espera o array (Angular sempre envia). Extrai do raw.
      const etiquetasRaw: any[] = Array.isArray(rawCard?.cardEtiqueta)
        ? rawCard.cardEtiqueta
        : Array.isArray(rawCard?.etiquetas)
          ? rawCard.etiquetas
          : [];
      const cardEtiquetas = etiquetasRaw
        .map((e: any) => ({
          idEtiqueta: String(e?.idEtiqueta ?? ''),
          nomeEtiqueta: String(e?.nomeEtiqueta ?? e?.nome ?? ''),
          corEtiqueta: String(e?.cor ?? e?.corEtiqueta ?? ''),
        }))
        .filter((e) => e.idEtiqueta);

      const res = await window.beeforHttp.atividades.edit(atividade.id, {
        nome: form.nome,
        descricao: form.descricao,
        idColuna: form.idColuna,
        tipo: form.tipo ?? undefined,
        idsResponsaveisCard: form.idResponsavel ? [form.idResponsavel] : [],
        idProjeto: form.idProjeto,
        idEpico: form.idEpico,
        idIteracao: form.idIteracao,
        nomeIteracao: form.nomeIteracao,
        pontuacao: form.pontos,
        esforco: form.esforco,
        // Datas: backend aceita null; envia yyyy-mm-dd (mesmo formato do front Angular)
        dataInicio: form.dataInicio,
        dataPrevistaEntrega: form.dataPrevistaEntrega,
        bloqueado: form.bloqueado,
        motivoBloqueio: form.bloqueado ? form.motivoBloqueio : null,
        // Campos que o backend exige mas nao editamos aqui — preserva do raw
        cardEtiquetas,
        idCardHistoria: form.idCardHistoria,
        quantidadeVagas:
          rawCard?.quantidadeVagas != null ? rawCard.quantidadeVagas : null,
      });
      if (!res.ok) {
        setErro(res.error || 'Falha ao salvar.');
        return false;
      }
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
      return false;
    } finally {
      setSalvando(false);
    }
  }, [atividade, form, rawCard]);

  const arquivar = useCallback(async (): Promise<boolean> => {
    if (!atividade || !window.beeforHttp) return false;
    setArquivando(true);
    setErro(null);
    try {
      const res = await window.beeforHttp.atividades.arquivar(
        atividade.id,
        true,
        atividade.idQuadro,
      );
      if (!res.ok) {
        setErro(res.error || 'Falha ao arquivar.');
        return false;
      }
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao arquivar.');
      return false;
    } finally {
      setArquivando(false);
    }
  }, [atividade]);

  return {
    form,
    setCampo,
    colunas,
    responsaveis,
    iteracoes,
    projetos,
    loadingListas,
    salvando,
    arquivando,
    erro,
    salvar,
    arquivar,
  };
}

function seedForm(d: AtividadeDetalhes, a: BeeforAtividade | null): EdicaoForm {
  return {
    nome: a?.nome ?? '',
    descricao: d.descricao ?? '',
    idColuna: d.ids.idColuna,
    tipo: d.ids.tipo,
    idResponsavel: d.ids.idResponsavel,
    idProjeto: d.ids.idProjeto,
    idEpico: d.ids.idEpico,
    idIteracao: d.ids.idIteracao,
    nomeIteracao: d.ids.nomeIteracao,
    idCardHistoria: d.ids.idCardHistoria,
    pontos: d.pontosEstimados,
    esforco: d.ids.esforcoRaw,
    dataInicio: toDateInput(d.dataInicio),
    dataPrevistaEntrega: toDateInput(d.dataPrevistaEntrega),
    bloqueado: d.bloqueado,
    motivoBloqueio: d.motivoBloqueio,
  };
}
