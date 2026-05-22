import { useEffect, useState, useCallback } from 'react';

export interface PerfilDados {
  foto: string;
  nome: string;
  funcaoPrincipal: string;
  ultimoCliente: string;
  miniBio: string;
  quantidadeVisitas: number;
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
  indice: number;
}
export interface AcaoItem {
  id: string;
  titulo: string;
  descricao?: string;
  status?: string;
  data?: string;
}
export interface MappingItem {
  idTitulo: string;
  titulo: string;
  itens: Array<{ idItem?: string; nomeItem: string }>;
}

export interface PerfilData {
  perfil: PerfilDados | null;
  habilidades: HabilidadeItem[];
  habilidadesCombo: HabilidadeItem[];
  motivadores: MotivadorItem[];
  acoes: AcaoItem[];
  mapping: MappingItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addHabilidade: (nome: string) => Promise<boolean>;
  removeHabilidade: (id: string) => Promise<boolean>;
  reorderMotivadores: (ordenados: MotivadorItem[]) => Promise<boolean>;
  addMapping: (titulo: string, itens: string[]) => Promise<boolean>;
  editMapping: (
    idTitulo: string,
    titulo: string,
    itens: Array<{ IdItem?: string; NomeItem: string }>,
  ) => Promise<boolean>;
  delMapping: (idTitulo: string) => Promise<boolean>;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function usePerfilData(open: boolean): PerfilData {
  const [perfil, setPerfil] = useState<PerfilDados | null>(null);
  const [habilidades, setHabilidades] = useState<HabilidadeItem[]>([]);
  const [habilidadesCombo, setHabilidadesCombo] = useState<HabilidadeItem[]>([]);
  const [motivadores, setMotivadores] = useState<MotivadorItem[]>([]);
  const [acoes, setAcoes] = useState<AcaoItem[]>([]);
  const [mapping, setMapping] = useState<MappingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const http = window.beeforHttp;
        if (!http?.perfil) {
          setError('API HTTP indisponível.');
          return;
        }
        const [pRes, hRes, hcRes, mRes, aRes, mapRes] = await Promise.all([
          http.perfil.get(),
          http.perfil.habilidades(),
          http.perfil.habilidadesCombo(),
          http.perfil.motivadores(),
          http.perfil.acoes(),
          http.perfil.mapping(),
        ]);
        if (cancelled) return;

        if (pRes.ok) setPerfil((pRes.data as unknown as PerfilDados) ?? null);
        if (hRes.ok) setHabilidades(arr<HabilidadeItem>(hRes.data));
        if (hcRes.ok) setHabilidadesCombo(arr<HabilidadeItem>(hcRes.data));
        if (mRes.ok) setMotivadores(arr<MotivadorItem>(mRes.data));
        if (aRes.ok) setAcoes(arr<AcaoItem>(aRes.data));
        if (mapRes.ok) setMapping(arr<MappingItem>(mapRes.data));

        if (!pRes.ok) setError(pRes.error || 'Falha ao carregar perfil.');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro inesperado.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, reloadKey]);

  const refetchHabilidades = useCallback(async () => {
    const hRes = await window.beeforHttp.perfil.habilidades();
    if (hRes.ok) setHabilidades(arr<HabilidadeItem>(hRes.data));
  }, []);

  const addHabilidade = useCallback(
    async (nome: string): Promise<boolean> => {
      const res = await window.beeforHttp.perfil.addHabilidade(nome);
      if (res.ok) await refetchHabilidades();
      return res.ok;
    },
    [refetchHabilidades],
  );

  const removeHabilidade = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await window.beeforHttp.perfil.removeHabilidade(id);
      if (res.ok) await refetchHabilidades();
      return res.ok;
    },
    [refetchHabilidades],
  );

  const reorderMotivadores = useCallback(
    async (ordenados: MotivadorItem[]): Promise<boolean> => {
      setMotivadores(ordenados.map((m, i) => ({ ...m, indice: i + 1 })));
      const res = await window.beeforHttp.perfil.editMotivadores(
        ordenados.map((m) => ({ idMotivador: m.idMotivador })),
      );
      return res.ok;
    },
    [],
  );

  const refetchMapping = useCallback(async () => {
    const res = await window.beeforHttp.perfil.mapping();
    if (res.ok) setMapping(arr<MappingItem>(res.data));
  }, []);

  const addMapping = useCallback(
    async (titulo: string, itens: string[]): Promise<boolean> => {
      const res = await window.beeforHttp.perfil.addMapping(titulo, itens);
      if (res.ok) await refetchMapping();
      return res.ok;
    },
    [refetchMapping],
  );

  const editMapping = useCallback(
    async (
      idTitulo: string,
      titulo: string,
      itens: Array<{ IdItem?: string; NomeItem: string }>,
    ): Promise<boolean> => {
      const res = await window.beeforHttp.perfil.editMapping(idTitulo, titulo, itens);
      if (res.ok) await refetchMapping();
      return res.ok;
    },
    [refetchMapping],
  );

  const delMapping = useCallback(
    async (idTitulo: string): Promise<boolean> => {
      const res = await window.beeforHttp.perfil.delMapping(idTitulo);
      if (res.ok) await refetchMapping();
      return res.ok;
    },
    [refetchMapping],
  );

  return {
    perfil,
    habilidades,
    habilidadesCombo,
    motivadores,
    acoes,
    mapping,
    loading,
    error,
    refresh,
    addHabilidade,
    removeHabilidade,
    reorderMotivadores,
    addMapping,
    editMapping,
    delMapping,
  };
}
