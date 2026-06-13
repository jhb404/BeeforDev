import { useEffect, useState } from 'react';
import type { SessionStatus } from '@shared/types/index';

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useProfileName(sessionStatus: SessionStatus): string {
  const [initials, setInitials] = useState('');

  useEffect(() => {
    if (sessionStatus !== 'connected') return;
    let cancelled = false;
    void (async () => {
      try {
        const http = window.beeforHttp;
        if (!http?.perfil) return;
        const res = await http.perfil.get();
        if (cancelled) return;
        if (!res.ok) return;
        const nome = (res as { ok: true; data: unknown }).data as { nome?: string } | null;
        const nameStr = nome?.nome ?? '';
        if (nameStr) setInitials(initialsFrom(nameStr));
      } catch {
        // silently ignore — fallback stays empty, TopBar uses its own default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  return initials;
}
