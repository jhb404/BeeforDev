import { useCallback, useEffect, useRef, useState } from 'react';

/** Participante como o servidor expõe (voto oculto até revelar). */
export type PokerRole = 'seated' | 'bench' | 'spectator';

export interface PokerParticipant {
  id: string;
  name: string;
  dogId: number;
  role: PokerRole;
  voted: boolean;
  vote: string | null;
}

export interface PokerRoom {
  id: string;
  revealed: boolean;
  participants: PokerParticipant[];
  takenDogs: number[];
  seatsTaken: number;
  maxSeats: number;
  average: number | null;
}

/** Snapshot de um round encerrado, guardado no histórico local. */
export interface RoundRecord {
  roundIndex: number;
  average: number | null;
  votes: { name: string; vote: string | null }[];
  at: number; // Date.now()
}

export type ConnState = 'connecting' | 'connected' | 'reconnecting' | 'closed';

/** Reação efêmera recebida — some sozinha após alguns segundos. */
export interface LiveReaction {
  key: number;
  fromId: string;
  fromName: string;
  emoji: string;
  /** efeito sonoro a tocar (kind do alarm.ts), se houver */
  sound?: string;
}

interface UsePokerRoomArgs {
  /** URL WebSocket completa do servidor, ex: "wss://abc.trycloudflare.com". */
  wsUrl: string | null;
  roomId: string | null;
  name: string;
  /** personagem escolhido (1..14); servidor garante unicidade. */
  dogId?: number;
  /** papel inicial ao entrar: 'seated' (default) ou 'spectator'. */
  initialRole?: PokerRole;
}

/**
 * Conexão WebSocket nativa com o servidor de poker.
 * Reconecta com backoff simples e reenvia o `join` ao religar.
 */
export function usePokerRoom({ wsUrl, roomId, name, dogId, initialRole }: UsePokerRoomArgs) {
  const [room, setRoom] = useState<PokerRoom | null>(null);
  const [conn, setConn] = useState<ConnState>('connecting');
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const roundIndexRef = useRef(0);
  const prevRevealedRef = useRef(false);
  const lastRevealedRef = useRef<PokerRoom | null>(null);
  const reactionSeq = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const closedByUs = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // name/dogId/role mudam SEM reconectar — lidos por ref no momento do join.
  // (antes, dogId nas deps reconectava e o servidor criava um participante duplicado)
  const nameRef = useRef(name);
  const dogIdRef = useRef(dogId);
  const roleRef = useRef<PokerRole>(initialRole ?? 'seated');
  nameRef.current = name;
  dogIdRef.current = dogId;
  if (initialRole) roleRef.current = initialRole;

  const send = useCallback((msg: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  // troca de sala: zera histórico/estado da sala anterior
  useEffect(() => {
    setRoom(null);
    setHistory([]);
    setReactions([]);
    setSelfId(null);
    roundIndexRef.current = 0;
    prevRevealedRef.current = false;
    lastRevealedRef.current = null;
  }, [wsUrl, roomId]);

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
        ws.send(
          JSON.stringify({
            type: 'join',
            roomId,
            name: nameRef.current,
            dogId: dogIdRef.current,
            role: roleRef.current,
          }),
        );
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string);
          if (data?.type === 'welcome') {
            setSelfId(data.selfId as string);
          } else if (data?.type === 'roomUpdate') {
            const incoming = data.room as PokerRoom;
            // captura histórico ao passar de revealed=true → false (reset).
            // Snapshot fica em lastRevealedRef (fora do updater) pra não duplicar
            // no StrictMode, que invoca o updater de setRoom 2x em dev.
            if (prevRevealedRef.current && !incoming.revealed && lastRevealedRef.current) {
              const snap = lastRevealedRef.current;
              setHistory((h) => [
                ...h,
                {
                  roundIndex: roundIndexRef.current++,
                  average: snap.average,
                  votes: snap.participants.map((p) => ({ name: p.name, vote: p.vote })),
                  at: Date.now(),
                },
              ]);
              lastRevealedRef.current = null;
            }
            if (incoming.revealed) lastRevealedRef.current = incoming;
            setRoom(incoming);
            prevRevealedRef.current = incoming.revealed;
          } else if (data?.type === 'reaction') {
            const key = ++reactionSeq.current;
            setReactions((prev) => [
              ...prev,
              {
                key,
                fromId: data.fromId,
                fromName: data.fromName,
                emoji: data.emoji,
                sound: data.sound,
              },
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
    // ATENÇÃO: name/dogId/role NÃO entram aqui (lidos por ref) — senão reconecta e duplica.
     
  }, [wsUrl, roomId]);

  const vote = useCallback((value: string) => send({ type: 'vote', value }), [send]);
  const reveal = useCallback(() => send({ type: 'reveal' }), [send]);
  const reset = useCallback(() => send({ type: 'reset' }), [send]);
  const sendReaction = useCallback(
    (emoji: string, sound?: string) => send({ type: 'reaction', emoji, sound }),
    [send],
  );
  const rename = useCallback(
    (newName: string) => {
      nameRef.current = newName;
      send({ type: 'rename', name: newName });
    },
    [send],
  );
  const changeDog = useCallback(
    (id: number) => {
      dogIdRef.current = id;
      send({ type: 'changeDog', dogId: id });
    },
    [send],
  );
  const sit = useCallback(
    (id?: number) => {
      roleRef.current = 'seated';
      if (id) dogIdRef.current = id;
      send({ type: 'sit', dogId: id });
    },
    [send],
  );
  const spectate = useCallback(() => {
    roleRef.current = 'spectator';
    send({ type: 'spectate' });
  }, [send]);

  return {
    room,
    conn,
    reactions,
    history,
    selfId,
    vote,
    reveal,
    reset,
    sendReaction,
    rename,
    changeDog,
    sit,
    spectate,
  };
}
