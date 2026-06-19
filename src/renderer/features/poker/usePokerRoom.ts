import { useCallback, useEffect, useRef, useState } from 'react';

/** Participante como o servidor expõe (voto oculto até revelar). */
export interface PokerParticipant {
  id: string;
  name: string;
  voted: boolean;
  vote: string | null;
}

export interface PokerRoom {
  id: string;
  revealed: boolean;
  participants: PokerParticipant[];
  average: number | null;
}

export type ConnState = 'connecting' | 'connected' | 'reconnecting' | 'closed';

/** Reação efêmera recebida — some sozinha após alguns segundos. */
export interface LiveReaction {
  key: number;
  fromId: string;
  fromName: string;
  emoji: string;
}

interface UsePokerRoomArgs {
  /** URL WebSocket completa do servidor, ex: "wss://abc.trycloudflare.com". */
  wsUrl: string | null;
  roomId: string | null;
  name: string;
}

/**
 * Conexão WebSocket nativa com o servidor de poker.
 * Reconecta com backoff simples e reenvia o `join` ao religar.
 */
export function usePokerRoom({ wsUrl, roomId, name }: UsePokerRoomArgs) {
  const [room, setRoom] = useState<PokerRoom | null>(null);
  const [conn, setConn] = useState<ConnState>('connecting');
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const reactionSeq = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const closedByUs = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((msg: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    if (!wsUrl || !roomId) return;
    closedByUs.current = false;

    const connect = () => {
      setConn(retryRef.current === 0 ? 'connecting' : 'reconnecting');
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        scheduleRetry();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setConn('connected');
        ws.send(JSON.stringify({ type: 'join', roomId, name }));
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string);
          if (data?.type === 'roomUpdate') {
            setRoom(data.room as PokerRoom);
          } else if (data?.type === 'reaction') {
            const key = ++reactionSeq.current;
            setReactions((prev) => [
              ...prev,
              { key, fromId: data.fromId, fromName: data.fromName, emoji: data.emoji },
            ]);
            // some após a animação
            setTimeout(() => {
              setReactions((prev) => prev.filter((r) => r.key !== key));
            }, 2600);
          }
        } catch {
          /* ignora frame inválido */
        }
      };
      ws.onclose = () => {
        if (closedByUs.current) return;
        setConn('reconnecting');
        scheduleRetry();
      };
      ws.onerror = () => ws.close();
    };

    const scheduleRetry = () => {
      retryRef.current += 1;
      const delay = Math.min(1000 * 2 ** (retryRef.current - 1), 8000);
      timerRef.current = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closedByUs.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave' }));
      }
      ws?.close();
      wsRef.current = null;
      setConn('closed');
    };
  }, [wsUrl, roomId, name]);

  const vote = useCallback((value: string) => send({ type: 'vote', value }), [send]);
  const reveal = useCallback(() => send({ type: 'reveal' }), [send]);
  const reset = useCallback(() => send({ type: 'reset' }), [send]);
  const sendReaction = useCallback((emoji: string) => send({ type: 'reaction', emoji }), [send]);

  return { room, conn, reactions, vote, reveal, reset, sendReaction };
}
