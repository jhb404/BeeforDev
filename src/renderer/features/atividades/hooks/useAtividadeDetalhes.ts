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

function mapCard(raw: any): Partial<AtividadeDetalhes> {
  if (!raw || typeof raw !== 'object') return {};
  return {
    responsavel: asString(raw.responsavel) ?? asString(raw.nomeResponsavel),
    projeto: asString(raw.projeto) ?? asString(raw.nomeProjeto),
    epico: asString(raw.epico) ?? asString(raw.nomeEpico),
    historia: asString(raw.historia) ?? asString(raw.nomeHistoria),
    sprint: asString(raw.sprint) ?? asString(raw.iteracao) ?? asString(raw.nomeIteracao),
    esforcoHoras: asNumber(raw.esforcoHoras) ?? asNumber(raw.esforco),
    pontosEstimados: asNumber(raw.pontosEstimados) ?? asNumber(raw.pontos),
    dataInicio: asString(raw.dataInicio),
    dataEntrega: asString(raw.dataEntrega) ?? asString(raw.dataConclusao),
    dataPrevistaEntrega: asString(raw.dataPrevistaEntrega) ?? asString(raw.dataPrevista),
    descricao: asString(raw.descricao),
    bloqueado: Boolean(raw.bloqueado),
    motivoBloqueio: asString(raw.motivoBloqueio),
    etiquetas: Array.isArray(raw.etiquetas)
      ? raw.etiquetas
          .map((e: any) =>
            typeof e === 'string' ? e : asString(e?.nome) ?? asString(e?.titulo) ?? '',
          )
          .filter(Boolean)
      : [],
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
          sessionRes.ok && sessionRes.data ? sessionRes.data.idOrganizacao ?? undefined : undefined;

        const idTime = atividade.idTime ?? '';
        const idOrganizacao = atividade.idOrganizacao ?? idOrg;

        // Bundle resumo (espelha o que front goobeeteams faz ao abrir modal de card):
        //  - /Quadro/PegaCardResumo/{id}
        //  - /Quadro/PegaColunaCard/{id}
        //  - /Quadro/PegarComentarios/{id}
        const bundleRes = await window.beeforHttp.atividades.resumo(atividade.id);
        const detailFromBundle =
          bundleRes.ok && bundleRes.data && typeof bundleRes.data === 'object'
            ? (bundleRes.data as { card?: unknown; comentarios?: unknown }).card ?? null
            : null;

        const detailPromise = !detailFromBundle && idTime
          ? window.beeforHttp.atividades.detail(atividade.id, idTime, idOrganizacao)
          : null;

        const detailRes = detailPromise ? await detailPromise : null;

        if (cancelled) return;

        const base: AtividadeDetalhes = { ...EMPTY };
        if (detailFromBundle) {
          Object.assign(base, mapCard(detailFromBundle));
        } else if (detailRes && detailRes.ok && detailRes.data) {
          Object.assign(base, mapCard(detailRes.data));
        }
        if (bundleRes.ok && bundleRes.data && typeof bundleRes.data === 'object') {
          const comentariosRaw = (bundleRes.data as { comentarios?: unknown }).comentarios;
          base.comentarios = mapComentarios(comentariosRaw);
        }

        setDetalhes(base);

        const partialErr = !bundleRes.ok
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
  }, [atividade?.id]);

  return { detalhes, loading, error };
}
