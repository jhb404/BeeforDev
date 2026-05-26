import { useEffect, useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';

export interface AtividadeDetalhes {
  responsavel: string | null;
  projeto: string | null;
  epico: string | null;
  historia: string | null;
  sprint: string | null;
  esforcoHoras: number | null;
  pontosEstimados: number | null;
  dataInicio: string | null;
  dataEntrega: string | null;
  dataPrevistaEntrega: string | null;
  descricao: string | null;
  bloqueado: boolean;
  motivoBloqueio: string | null;
  etiquetas: string[];
  comentarios: Array<{ autor: string; texto: string; data: string }>;
  anexos: Array<{ nome: string; url: string; tipo: string }>;
  historico: Array<{ acao: string; data: string; usuario: string }>;
  /** Ids para edicao (bind dos selects/inputs). */
  ids: {
    idColuna: string | null;
    idResponsavel: string | null;
    idProjeto: string | null;
    idEpico: string | null;
    idIteracao: string | null;
    nomeIteracao: string | null;
    idCardHistoria: string | null;
    tipo: number | null;
    /** Esforco bruto "h:m" como veio do backend. */
    esforcoRaw: string | null;
  };
}

const EMPTY: AtividadeDetalhes = {
  responsavel: null,
  projeto: null,
  epico: null,
  historia: null,
  sprint: null,
  esforcoHoras: null,
  pontosEstimados: null,
  dataInicio: null,
  dataEntrega: null,
  dataPrevistaEntrega: null,
  descricao: null,
  bloqueado: false,
  motivoBloqueio: null,
  etiquetas: [],
  comentarios: [],
  anexos: [],
  historico: [],
  ids: {
    idColuna: null,
    idResponsavel: null,
    idProjeto: null,
    idEpico: null,
    idIteracao: null,
    nomeIteracao: null,
    idCardHistoria: null,
    tipo: null,
    esforcoRaw: null,
  },
};

function asString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v !== 'number') return null;
  return Number.isFinite(v) ? v : null;
}

/** Remove chaves null/undefined p/ nao sobrescrever valores ja preenchidos no overlay. */
function stripNullish<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    const v = obj[k];
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Extrai um nome de um campo que pode ser string OU objeto aninhado.
 * O backend retorna entidades aninhadas (projeto.nome, epico.nome, iteracao.nome...).
 */
/** Extrai um id de campo objeto aninhado, testando varias chaves. */
function idOf(v: unknown, ...keys: string[]): string | null {
  if (typeof v === 'string') return asString(v);
  if (v && typeof v === 'object') {
    for (const k of keys) {
      const s = asString((v as Record<string, unknown>)[k]);
      if (s) return s;
    }
  }
  return null;
}

function nameOf(v: unknown, ...keys: string[]): string | null {
  if (typeof v === 'string') return asString(v);
  if (v && typeof v === 'object') {
    for (const k of keys) {
      const val = (v as Record<string, unknown>)[k];
      const s = asString(val);
      if (s) return s;
    }
  }
  return null;
}

/** "12:11" (h:m) ou "12" -> horas decimais. Tolera number direto. */
function parseEsforco(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  const [h, m] = t.split(':');
  const horas = Number(h);
  const min = m != null ? Number(m) : 0;
  if (!Number.isFinite(horas)) return null;
  return horas + (Number.isFinite(min) ? min / 60 : 0);
}

function toNum(v: unknown): number | null {
  const n = asNumber(v);
  if (n != null) return n;
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Mapeia o card vindo de PegaCard (Card completo) OU PegaCardResumo (CardColuna).
 * Ambos usam entidades aninhadas; cobrimos as duas formas + fallbacks flat.
 */
function mapCard(raw: any): Partial<AtividadeDetalhes> {
  if (!raw || typeof raw !== 'object') return {};

  // Responsável: PegaCard usa responsavelCards[]; CardColuna usa responsaveis[]
  const respArr: any[] = Array.isArray(raw.responsavelCards)
    ? raw.responsavelCards
    : Array.isArray(raw.responsaveis)
      ? raw.responsaveis
      : [];
  const responsavel =
    respArr.length > 0
      ? nameOf(respArr[0], 'nomeMembro', 'nome', 'nomePessoa')
      : (nameOf(raw.responsavel, 'nomeMembro', 'nome') ?? asString(raw.nomeResponsavel));

  const etiquetasArr: any[] = Array.isArray(raw.cardEtiqueta)
    ? raw.cardEtiqueta
    : Array.isArray(raw.etiquetas)
      ? raw.etiquetas
      : [];

  const ids = {
    idColuna: idOf(raw.status, 'id', 'idColuna') ?? idOf(raw.idColuna) ?? null,
    idResponsavel:
      respArr.length > 0 ? idOf(respArr[0], 'idPessoa', 'id') : idOf(raw.idResponsavel),
    idProjeto: idOf(raw.projeto, 'idProjeto', 'id') ?? idOf(raw.idProjeto),
    idEpico: idOf(raw.epico, 'idEpico', 'id') ?? idOf(raw.idEpico),
    idIteracao: idOf(raw.iteracao, 'idIteracao', 'id') ?? idOf(raw.idIteracao),
    nomeIteracao: nameOf(raw.iteracao, 'nome'),
    idCardHistoria: idOf(raw.cardHistoria, 'id', 'idCard') ?? idOf(raw.idCardHistoria),
    tipo: toNum(raw.tipo),
    esforcoRaw: asString(raw.esforco),
  };

  return {
    ids,
    responsavel,
    projeto: nameOf(raw.projeto, 'nome') ?? asString(raw.nomeProjeto),
    epico: nameOf(raw.epico, 'nome') ?? asString(raw.nomeEpico),
    // PegaCard: cardHistoria{nome}; fallbacks
    historia:
      nameOf(raw.cardHistoria, 'nome') ??
      nameOf(raw.historia, 'nome') ??
      asString(raw.nomeHistoria),
    sprint: nameOf(raw.iteracao, 'nome') ?? asString(raw.sprint) ?? asString(raw.nomeIteracao),
    esforcoHoras: parseEsforco(raw.esforco) ?? toNum(raw.esforcoHoras),
    pontosEstimados: toNum(raw.pontuacao) ?? toNum(raw.pontosEstimados) ?? toNum(raw.pontos),
    dataInicio: asString(raw.dataInicio),
    dataEntrega: asString(raw.dataEntrega) ?? asString(raw.dataConclusao),
    dataPrevistaEntrega:
      asString(raw.dataEntregaPrevista) ??
      asString(raw.dataPrevistaEntrega) ??
      asString(raw.dataPrevista),
    descricao: asString(raw.descricao),
    bloqueado: Boolean(raw.bloqueado),
    motivoBloqueio: asString(raw.motivoBloqueio),
    etiquetas: etiquetasArr
      .map((e: any) =>
        typeof e === 'string'
          ? e
          : (asString(e?.nomeEtiqueta) ?? asString(e?.nome) ?? asString(e?.titulo) ?? ''),
      )
      .filter(Boolean),
  };
}

function mapComentarios(raw: any): AtividadeDetalhes['comentarios'] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => ({
    autor: asString(c?.nomePessoa) ?? asString(c?.autor) ?? 'Anônimo',
    texto: asString(c?.texto) ?? asString(c?.comentario) ?? '',
    data: asString(c?.dataCriacao) ?? asString(c?.data) ?? '',
  }));
}

function mapLogs(raw: any): AtividadeDetalhes['historico'] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l) => ({
    acao: asString(l?.acao) ?? asString(l?.tipo) ?? '—',
    data: asString(l?.data) ?? asString(l?.dataCriacao) ?? '',
    usuario: asString(l?.nomePessoa) ?? asString(l?.usuario) ?? '',
  }));
}

export interface UseAtividadeDetalhesResult {
  detalhes: AtividadeDetalhes;
  loading: boolean;
  error: string | null;
  /** Card cru (PegaCard completo, ou resumo) p/ montar o body do EditarCard. */
  rawCard: any;
  /** idTime resolvido (atividade -> coluna -> card). */
  idTimeResolved: string;
}

/**
 * Busca detalhes completos de um card via API HTTP (não mais mockado).
 * Endpoints: /Quadro/PegaCard, /Quadro/PegarComentarios, /Quadro/ListarLogsCard.
 */
export function useAtividadeDetalhes(
  atividade: BeeforAtividade | null,
): UseAtividadeDetalhesResult {
  const [detalhes, setDetalhes] = useState<AtividadeDetalhes>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCard, setRawCard] = useState<any>(null);
  const [idTimeResolved, setIdTimeResolved] = useState<string>('');

  useEffect(() => {
    if (!atividade) {
      setDetalhes(EMPTY);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetalhes(EMPTY);

    (async () => {
      try {
        if (!window.beeforHttp) {
          setError('API HTTP indisponível — reinicie o app.');
          return;
        }
        const sessionRes = await window.beeforHttp.sessionInfo();
        const idOrg =
          sessionRes.ok && sessionRes.data
            ? (sessionRes.data.idOrganizacao ?? undefined)
            : undefined;

        const idOrganizacao = atividade.idOrganizacao ?? idOrg;

        // 1) Bundle: resumo + coluna + comentarios (PegaCardResumo/PegaColunaCard/PegarComentarios)
        const bundleRes = await window.beeforHttp.atividades.resumo(atividade.id);
        if (cancelled) return;

        const bundleData =
          bundleRes.ok && bundleRes.data && typeof bundleRes.data === 'object'
            ? (bundleRes.data as { card?: unknown; coluna?: unknown; comentarios?: unknown })
            : null;
        const cardFromBundle = bundleData?.card ?? null;
        const colunaFromBundle = bundleData?.coluna ?? null;

        // 2) Resolve idTime: atividade -> coluna -> card (necessario p/ PegaCard completo)
        const idTime =
          asString(atividade.idTime) ??
          idOf(colunaFromBundle, 'idTime') ??
          idOf(cardFromBundle, 'idTime') ??
          '';

        // 3) PegaCard completo (traz historia/datas/descricao ricos). So com idTime.
        const detailRes = idTime
          ? await window.beeforHttp.atividades
              .detail(atividade.id, idTime, idOrganizacao)
              .catch(() => null)
          : null;

        if (cancelled) return;

        // DEBUG temporario: capturar shapes reais (remover apos validar)
        // eslint-disable-next-line no-console
        console.log('[CARD-DEBUG]', {
          idTime,
          idOrganizacao,
          resumoOk: bundleRes.ok,
          cardFromBundle,
          colunaFromBundle,
          detailOk: detailRes?.ok,
          detailData: detailRes?.ok ? detailRes.data : detailRes?.error,
        });

        const base: AtividadeDetalhes = { ...EMPTY };

        // Base: resumo; overlay: detail (mais rico)
        if (cardFromBundle) {
          Object.assign(base, stripNullish(mapCard(cardFromBundle)));
        }
        if (colunaFromBundle) {
          // coluna (PegaColunaCard) tambem traz responsaveis/projeto/etc em alguns casos
          Object.assign(base, stripNullish(mapCard(colunaFromBundle)));
        }
        if (detailRes && detailRes.ok && detailRes.data) {
          Object.assign(base, stripNullish(mapCard(detailRes.data)));
        }

        if (bundleRes.ok && bundleRes.data && typeof bundleRes.data === 'object') {
          const comentariosRaw = (bundleRes.data as { comentarios?: unknown }).comentarios;
          base.comentarios = mapComentarios(comentariosRaw);
        }

        setDetalhes(base);

        // Card cru p/ montar o body completo do EditarCard (prioriza detail)
        const rawDetail = detailRes && detailRes.ok && detailRes.data ? detailRes.data : null;
        setRawCard(rawDetail ?? cardFromBundle ?? colunaFromBundle ?? null);
        setIdTimeResolved(idTime);

        const partialErr =
          !bundleRes.ok && !(detailRes && detailRes.ok)
            ? bundleRes.error || 'Falha ao carregar detalhes.'
            : null;
        if (partialErr) setError(partialErr);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro inesperado.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividade?.id]);

  return { detalhes, loading, error, rawCard, idTimeResolved };
}
