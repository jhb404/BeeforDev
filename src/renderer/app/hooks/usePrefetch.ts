import { useEffect, useRef } from 'react';

/**
 * Após sessão pronta, dispara fetches paralelos pra esquentar caches HTTP
 * (lista kudo, mood atual, atividades, notificações, streak org).
 * Não bloqueia render — fire & forget com swallow errors.
 */
export function usePrefetch(ready: boolean): void {
  const ran = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (ran.current) return;

    const http = (typeof window !== 'undefined' ? window.beeforHttp : undefined) as
      | typeof window.beeforHttp
      | undefined;
    if (!http) return;

    let cancelled = false;

    (async () => {
      // Espera sessão HTTP estar pronta (login HTTP roda em paralelo ao Playwright,
      // mas pode demorar). Poll a cada 400ms até 6s.
      for (let i = 0; i < 15; i++) {
        if (cancelled) return;
        try {
          const res = await http.sessionInfo();
          if (res.ok && res.data) {
            ran.current = true;
            break;
          }
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!ran.current) {
        // HTTP session nunca subiu — skip prefetch (services usariam fallback Playwright via clients)
        return;
      }

      const warmups: Array<Promise<unknown>> = [];
      if (http.mood?.get) warmups.push(http.mood.get().catch(() => null));
      if (http.kudo?.lists) warmups.push(http.kudo.lists().catch(() => null));
      // Pré-aquece lista de pessoas + times (kudo recipient) — busca 1x, filtra local depois.
      if (http.kudo?.recipients) warmups.push(http.kudo.recipients().catch(() => null));
      if (http.atividades?.minhas) warmups.push(http.atividades.minhas().catch(() => null));
      if (http.notif?.unread) warmups.push(http.notif.unread().catch(() => null));
      if (http.notif?.novidadesTotal)
        warmups.push(http.notif.novidadesTotal().catch(() => null));
      if (http.mood?.streakOrg)
        warmups.push(http.mood.streakOrg(undefined, undefined, 30).catch(() => null));

      await Promise.allSettled(warmups);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);
}
