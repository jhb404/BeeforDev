import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useBeefor } from '../../hooks/useBeefor';

/**
 * Permissões da pessoa logada que vêm do POST /Token (não das settings locais).
 *
 * `usaTimesheet`:
 *   - `null`  → ainda não se sabe (sessão não conectou / sessionInfo não respondeu).
 *   - `true`  → tem TimeSheet Beefor.
 *   - `false` → NÃO tem: toda UI de lançamento de horas (grade, timer de
 *               intervalo, alertas e cards nas Configurações) fica escondida.
 *
 * Só esconde no `false` explícito: enquanto `null`, os loaders normais de boot cobrem
 * a tela, então não há flash da grade pra quem não deveria ver.
 */
interface AccessState {
  usaTimesheet: boolean | null;
  /** Pessoa usa SÓ o TimeSheet (flag `usaSomenteTimeSheetBeefor`). */
  somenteTimesheet: boolean | null;
  /** Atalho: `usaTimesheet === false`. Use pra esconder UI de ponto. */
  semTimesheet: boolean;
}

const AccessContext = createContext<AccessState>({
  usaTimesheet: null,
  somenteTimesheet: null,
  semTimesheet: false,
});

export function AccessProvider({ children }: { children: ReactNode }) {
  const { status } = useBeefor();
  const [state, setState] = useState<{
    usaTimesheet: boolean | null;
    somenteTimesheet: boolean | null;
  }>({ usaTimesheet: null, somenteTimesheet: null });

  useEffect(() => {
    if (status !== 'connected') return;

    const http = typeof window !== 'undefined' ? window.beeforHttp : undefined;
    if (!http?.sessionInfo) return;

    let cancelled = false;

    // O login HTTP pode terminar depois do status 'connected' — sessionInfo devolve
    // null até a sessão existir. Poll curto (igual usePrefetch) em vez de aceitar null.
    (async () => {
      for (let i = 0; i < 15 && !cancelled; i++) {
        try {
          const res = await http.sessionInfo();
          if (res.ok && res.data) {
            if (cancelled) return;
            setState({
              usaTimesheet: res.data.usaTimeSheetBeefor !== false,
              somenteTimesheet: res.data.usaSomenteTimeSheetBeefor === true,
            });
            return;
          }
        } catch {
          // ignora — tenta de novo
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      // Poll esgotou (sessão HTTP não subiu): assume acesso pra não deixar a UI
      // travada em "desconhecido" — quem depende do flag espera ele resolver.
      if (!cancelled) setState({ usaTimesheet: true, somenteTimesheet: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <AccessContext.Provider
      value={{
        usaTimesheet: state.usaTimesheet,
        somenteTimesheet: state.somenteTimesheet,
        semTimesheet: state.usaTimesheet === false,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess(): AccessState {
  return useContext(AccessContext);
}
