import os from 'node:os';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../logger';

/**
 * Servidor WebSocket local para Planning Poker.
 *
 * Roda no main process de QUEM cria a sala (host). Outros membros da squad
 * conectam via ws://<ip-do-host>:<porta>. Estado em memória, sem banco.
 *
 * Funciona apenas na mesma LAN/VPN com a porta liberada no firewall do host.
 */

const PORT = Number(process.env.POKER_PORT) || 4242;

/** Cartas válidas (mesmo set do renderer). Não-numéricas saem da média. */
const NON_NUMERIC = new Set(['?', '☕']);

const DOG_COUNT = 14;

interface Participant {
  id: string;
  name: string;
  vote: string | null;
  dogId: number; // personagem (1..DOG_COUNT), único na sala quando possível
}

interface Room {
  id: string;
  participants: Participant[];
  revealed: boolean;
  lastActivity: number;
}

/** Mensagens que o renderer envia. */
type ClientMessage =
  | { type: 'join'; roomId: string; name: string; dogId?: number }
  | { type: 'vote'; value: string }
  | { type: 'reveal' }
  | { type: 'reset' }
  | { type: 'reaction'; emoji: string; sound?: string }
  | { type: 'leave' };

const rooms = new Map<string, Room>();

/** Liga cada socket à sala + participante que representa. */
interface SocketState {
  roomId: string;
  participantId: string;
}
const sockets = new WeakMap<WebSocket, SocketState>();

let wss: WebSocketServer | null = null;
let cleanupTimer: NodeJS.Timeout | null = null;

const ONE_HOUR = 60 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;

function touch(room: Room): void {
  room.lastActivity = Date.now();
}

/** Payload broadcastado: voto só vai junto quando revelado. */
function roomPayload(room: Room) {
  return {
    type: 'roomUpdate' as const,
    room: {
      id: room.id,
      revealed: room.revealed,
      participants: room.participants.map((p) => ({
        id: p.id,
        name: p.name,
        dogId: p.dogId,
        voted: p.vote !== null,
        vote: room.revealed ? p.vote : null,
      })),
      // cães já em uso (pra UI travar na seleção)
      takenDogs: room.participants.map((p) => p.dogId),
      average: room.revealed ? average(room) : null,
    },
  };
}

/** Escolhe um dogId: usa o pedido se livre; senão o primeiro livre; senão recicla. */
function pickDog(room: Room, preferred?: number): number {
  const taken = new Set(room.participants.map((p) => p.dogId));
  if (preferred && preferred >= 1 && preferred <= DOG_COUNT && !taken.has(preferred)) {
    return preferred;
  }
  for (let d = 1; d <= DOG_COUNT; d++) {
    if (!taken.has(d)) return d;
  }
  return (room.participants.length % DOG_COUNT) + 1; // sala cheia: recicla
}

/** Média ignorando `?` e `☕`. null se ninguém votou em número. */
function average(room: Room): number | null {
  const nums = room.participants
    .map((p) => p.vote)
    .filter((v): v is string => v !== null && !NON_NUMERIC.has(v))
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function broadcast(room: Room): void {
  if (!wss) return;
  const data = JSON.stringify(roomPayload(room));
  for (const client of wss.clients) {
    const st = sockets.get(client);
    if (st?.roomId === room.id && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function removeFromRoom(ws: WebSocket): void {
  const st = sockets.get(ws);
  if (!st) return;
  sockets.delete(ws);
  const room = rooms.get(st.roomId);
  if (!room) return;
  room.participants = room.participants.filter((p) => p.id !== st.participantId);
  touch(room);
  if (room.participants.length === 0) {
    rooms.delete(room.id);
  } else {
    broadcast(room);
  }
}

function handleMessage(ws: WebSocket, raw: ClientMessage): void {
  if (raw.type === 'join') {
    const roomId = String(raw.roomId || '')
      .trim()
      .toUpperCase();
    const name =
      String(raw.name || '')
        .trim()
        .slice(0, 40) || 'Anônimo';
    if (!roomId) return;
    let room = rooms.get(roomId);
    if (!room) {
      room = { id: roomId, participants: [], revealed: false, lastActivity: Date.now() };
      rooms.set(roomId, room);
    }
    const participantId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const dogId = pickDog(room, raw.dogId);
    room.participants.push({ id: participantId, name, vote: null, dogId });
    sockets.set(ws, { roomId, participantId });
    touch(room);
    broadcast(room);
    return;
  }

  const st = sockets.get(ws);
  if (!st) return;
  const room = rooms.get(st.roomId);
  if (!room) return;

  switch (raw.type) {
    case 'vote': {
      const p = room.participants.find((x) => x.id === st.participantId);
      if (p) p.vote = String(raw.value);
      touch(room);
      broadcast(room);
      break;
    }
    case 'reveal': {
      room.revealed = true;
      touch(room);
      broadcast(room);
      break;
    }
    case 'reset': {
      room.revealed = false;
      for (const p of room.participants) p.vote = null;
      touch(room);
      broadcast(room);
      break;
    }
    case 'reaction': {
      const p = room.participants.find((x) => x.id === st.participantId);
      const sound = raw.sound ? String(raw.sound).slice(0, 20) : undefined;
      broadcastReaction(
        room,
        st.participantId,
        p?.name ?? '?',
        String(raw.emoji).slice(0, 8),
        sound,
      );
      break;
    }
    case 'leave': {
      removeFromRoom(ws);
      break;
    }
  }
}

/** Reação é efêmera — não guarda estado, só repassa pra todos da sala. */
function broadcastReaction(
  room: Room,
  fromId: string,
  fromName: string,
  emoji: string,
  sound?: string,
): void {
  if (!wss) return;
  const data = JSON.stringify({ type: 'reaction', fromId, fromName, emoji, sound });
  for (const client of wss.clients) {
    const sock = sockets.get(client);
    if (sock?.roomId === room.id && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function startCleanup(): void {
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      if (now - room.lastActivity > ONE_HOUR) rooms.delete(id);
    }
  }, FIVE_MIN);
  // Não segura o processo vivo só por causa do timer.
  cleanupTimer.unref?.();
}

/**
 * Heartbeat: o túnel Cloudflare (e proxies em geral) derruba conexões
 * WebSocket ociosas após ~100s. Mandamos ping a cada 25s pra manter vivo.
 * Sockets que não respondem 2 pings seguidos são considerados mortos.
 */
const PING_INTERVAL = 25_000;
const alive = new WeakMap<WebSocket, boolean>();
let heartbeatTimer: NodeJS.Timeout | null = null;

function startHeartbeat(): void {
  heartbeatTimer = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) {
      if (alive.get(ws) === false) {
        ws.terminate();
        continue;
      }
      alive.set(ws, false);
      try {
        ws.ping();
      } catch {
        /* socket já caindo */
      }
    }
  }, PING_INTERVAL);
  heartbeatTimer.unref?.();
}

/** Sobe o servidor (idempotente). Chamado no setup dos IPC handlers. */
export function startPokerServer(): void {
  if (wss) return;
  try {
    wss = new WebSocketServer({ port: PORT });
    wss.on('connection', (ws) => {
      alive.set(ws, true);
      ws.on('pong', () => alive.set(ws, true));
      ws.on('message', (buf) => {
        alive.set(ws, true); // qualquer tráfego conta como vivo
        try {
          const msg = JSON.parse(buf.toString()) as ClientMessage;
          handleMessage(ws, msg);
        } catch (err) {
          logger.warn(`[poker] mensagem inválida: ${err instanceof Error ? err.message : err}`);
        }
      });
      ws.on('close', () => removeFromRoom(ws));
      ws.on('error', () => removeFromRoom(ws));
    });
    wss.on('error', (err) => {
      logger.error('[poker] erro no servidor WS', err);
    });
    startCleanup();
    startHeartbeat();
    logger.info(`[poker] servidor WS escutando na porta ${PORT}`);
  } catch (err) {
    logger.error('[poker] falha ao iniciar servidor WS', err);
  }
}

export function getPokerPort(): number {
  return PORT;
}

/** IPv4 não-interno da máquina (para montar o link de convite). */
export function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}
