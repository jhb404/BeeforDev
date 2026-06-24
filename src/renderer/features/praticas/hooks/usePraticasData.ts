import { useEffect, useState } from 'react';
import type { PraticaAgilTime } from '@shared/types/index';

/** Lista de práticas ativas do time (config-driven). */
export function usePraticasConfig(idTime: string | null) {
  const [config, setConfig] = useState<PraticaAgilTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idTime) {
      setConfig([]);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    void window.beeforHttp.praticas
      .config(idTime)
      .then((res) => {
        if (!alive) return;
        if (res.ok) setConfig(res.data);
        else setError(res.error);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [idTime]);

  return { config, loading, error };
}

/** Dados de um card específico (busca on-demand por chave). */
export function usePraticaCard<T>(chave: string, idTime: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idTime) return;
    let alive = true;
    setLoading(true);
    setError(null);
    void window.beeforHttp.praticas
      .card<T>(chave, idTime)
      .then((res) => {
        if (!alive) return;
        if (res.ok) setData((res.data ?? null) as T | null);
        else setError(res.error);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [chave, idTime]);

  return { data, loading, error };
}
