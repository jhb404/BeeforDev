import { useCallback, useEffect, useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';

export interface Comentario {
  autor: string;
  texto: string;
  data: string;
}

export interface LogItem {
  acao: string;
  data: string;
  usuario: string;
}

export interface Anexo {
  idAnexo: string;
  nome: string;
  url: string;
  tipo: string;
}

function mapComentarios(raw: unknown): Comentario[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: any) => ({
    autor: String(c?.nomePessoa ?? c?.autor ?? 'Anônimo'),
    texto: String(c?.texto ?? c?.comentario ?? ''),
    data: String(c?.dataCriacao ?? c?.data ?? ''),
  }));
}

function mapLogs(raw: unknown): LogItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l: any) => ({
    acao: String(l?.acao ?? l?.tipo ?? l?.descricao ?? '—'),
    data: String(l?.data ?? l?.dataCriacao ?? l?.dataMovimentacao ?? ''),
    usuario: String(l?.nomePessoa ?? l?.usuario ?? l?.nomePessoaMoveu ?? ''),
  }));
}

function mapAnexos(raw: unknown): Anexo[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x: any) => ({
    idAnexo: String(x?.idAnexo ?? x?.id ?? ''),
    nome: String(x?.nome ?? x?.nomeArquivo ?? x?.nomeAnexo ?? 'arquivo'),
    url: String(x?.url ?? x?.caminho ?? x?.link ?? ''),
    tipo: String(x?.tipo ?? x?.extensao ?? ''),
  }));
}

export interface UseCardInteracoesResult {
  comentarios: Comentario[];
  logs: LogItem[];
  anexos: Anexo[];
  loadingComentarios: boolean;
  loadingLogs: boolean;
  loadingAnexos: boolean;
  enviandoComentario: boolean;
  enviandoAnexo: boolean;
  erro: string | null;
  adicionarComentario: (texto: string) => Promise<boolean>;
  adicionarAnexo: (file: File) => Promise<boolean>;
  removerAnexo: (idAnexo: string) => Promise<boolean>;
  recarregarComentarios: () => void;
  recarregarLogs: () => void;
  recarregarAnexos: () => void;
}

/**
 * Comentarios, historico (logs) e anexos do card.
 * Comentarios podem vir pre-carregados do bundle; este hook permite recarregar e mutar.
 */
export function useCardInteracoes(
  atividade: BeeforAtividade | null,
  comentariosIniciais: Comentario[],
): UseCardInteracoesResult {
  const idCard = atividade?.id ?? '';
  const idTime = atividade?.idTime ?? '';

  const [comentarios, setComentarios] = useState<Comentario[]>(comentariosIniciais);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Sincroniza comentarios do bundle quando o card muda
  useEffect(() => {
    setComentarios(comentariosIniciais);
  }, [comentariosIniciais]);

  const recarregarComentarios = useCallback(() => {
    if (!idCard || !window.beeforHttp) return;
    setLoadingComentarios(true);
    window.beeforHttp.atividades
      .comments(idCard)
      .then((res) => {
        if (res.ok) setComentarios(mapComentarios(res.data));
      })
      .finally(() => setLoadingComentarios(false));
  }, [idCard]);

  const recarregarLogs = useCallback(() => {
    if (!idCard || !window.beeforHttp) return;
    setLoadingLogs(true);
    window.beeforHttp.atividades
      .logs(idCard)
      .then((res) => {
        if (res.ok) setLogs(mapLogs(res.data));
      })
      .finally(() => setLoadingLogs(false));
  }, [idCard]);

  const recarregarAnexos = useCallback(() => {
    if (!idCard || !window.beeforHttp) return;
    setLoadingAnexos(true);
    window.beeforHttp.atividades
      .anexos(idCard)
      .then((res) => {
        if (res.ok) setAnexos(mapAnexos(res.data));
      })
      .finally(() => setLoadingAnexos(false));
  }, [idCard]);

  // Carrega logs e anexos ao abrir o card
  useEffect(() => {
    if (!idCard) return;
    recarregarLogs();
    recarregarAnexos();
  }, [idCard, recarregarLogs, recarregarAnexos]);

  const adicionarComentario = useCallback(
    async (texto: string): Promise<boolean> => {
      const t = texto.trim();
      if (!t || !idCard || !window.beeforHttp) return false;
      setEnviandoComentario(true);
      setErro(null);
      try {
        const res = await window.beeforHttp.atividades.addComment(idCard, t);
        if (!res.ok) {
          setErro(res.error || 'Falha ao comentar.');
          return false;
        }
        recarregarComentarios();
        return true;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao comentar.');
        return false;
      } finally {
        setEnviandoComentario(false);
      }
    },
    [idCard, recarregarComentarios],
  );

  const adicionarAnexo = useCallback(
    async (file: File): Promise<boolean> => {
      if (!idCard || !idTime || !window.beeforHttp) {
        setErro(!idTime ? 'Time do card indisponível para anexar.' : null);
        return false;
      }
      setEnviandoAnexo(true);
      setErro(null);
      try {
        const bytes = await file.arrayBuffer();
        const res = await window.beeforHttp.atividades.adicionarAnexo({
          idCard,
          idTime,
          fileName: file.name,
          fileType: file.type,
          fileBytes: bytes,
        });
        if (!res.ok) {
          setErro(res.error || 'Falha ao anexar.');
          return false;
        }
        recarregarAnexos();
        return true;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao anexar.');
        return false;
      } finally {
        setEnviandoAnexo(false);
      }
    },
    [idCard, idTime, recarregarAnexos],
  );

  const removerAnexo = useCallback(
    async (idAnexo: string): Promise<boolean> => {
      if (!idAnexo || !window.beeforHttp) return false;
      setErro(null);
      try {
        const res = await window.beeforHttp.atividades.removerAnexo(idAnexo);
        if (!res.ok) {
          setErro(res.error || 'Falha ao remover anexo.');
          return false;
        }
        recarregarAnexos();
        return true;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao remover anexo.');
        return false;
      }
    },
    [recarregarAnexos],
  );

  return {
    comentarios,
    logs,
    anexos,
    loadingComentarios,
    loadingLogs,
    loadingAnexos,
    enviandoComentario,
    enviandoAnexo,
    erro,
    adicionarComentario,
    adicionarAnexo,
    removerAnexo,
    recarregarComentarios,
    recarregarLogs,
    recarregarAnexos,
  };
}
