import os from 'node:os';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../logger';
import {
  computeRoundResults,
  DEFAULT_DECK_ID,
  getDeck,
  type DeckId,
  type RoundResults,
} from '../../shared/poker/decks';

/**
 * Servidor WebSocket local para Planning Poker.
 *
 * Roda no main process de QUEM cria a sala (host). Outros membros da squad
 * conectam via ws://<ip-do-host>:<porta>. Estado em memória, sem banco.
 *
 * Funciona apenas na mesma LAN/VPN com a porta liberada no firewall do host.
 */

const PORT = Number(process.env.POKER_PORT) || 4242;

const DOG_COUNT = 14;
const MAX_SEATS = 7; // lugares na mesa; excedente vai pro banco

type Role = 'seated' | 'bench' | 'spectator';

interface Participant {
  id: string;
  name: string;
  vote: string | null;
  dogId: number; // personagem (1..DOG_COUNT), único na sala quando possível
  role: Role; // seated = na mesa, bench = reserva (vota), spectator = só observa
}

interface Room {
  id: string;
  participants: Participant[];
  revealed: boolean;
  lastActivity: number;
  /** Deck escolhido pelo host na criação da sala. Persiste enquanto a sala existir. */
  deckId: DeckId;
  /** participantId de quem criou a sala (host). Só ele pode encerrar pra todos. */
  creatorId: string;
}

/** Mensagens que o renderer envia. */
type ClientMessage =
  | { type: 'join'; roomId: string; name: string; dogId?: number; role?: Role; deckId?: DeckId }
  | { type: 'rename'; name: string }
  | { type: 'changeDog'; dogId: number }
  | { type: 'sit'; dogId?: number } // entra/volta pra mesa (ou banco se cheia)
  | { type: 'spectate' } // vira espectador
  | { type: 'vote'; value: string }
  | { type: 'reveal' }
  | { type: 'reset' }
  | { type: 'reaction'; emoji: string; sound?: string }
  | { type: 'close' } // host encerra a sala pra todos
  | { type: 'leave' };

const rooms = new Map<string, Room>();

/** Liga cada socket à sala + participante que representa. */
interface SocketState {
  roomId: string;
  participantId: string;
}
const sockets = new WeakMap<WebSocket, SocketState>();

let wss: WebSocketServer | null = null;
let httpServer: http.Server | null = null;
let cleanupTimer: NodeJS.Timeout | null = null;

const ONE_HOUR = 60 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;

function touch(room: Room): void {
  room.lastActivity = Date.now();
}

/** Payload broadcastado: voto só vai junto quando revelado. */
function roomPayload(room: Room) {
  const results = room.revealed ? roundResults(room) : null;
  return {
    type: 'roomUpdate' as const,
    room: {
      id: room.id,
      revealed: room.revealed,
      deckId: room.deckId,
      participants: room.participants.map((p) => ({
        id: p.id,
        name: p.name,
        dogId: p.dogId,
        role: p.role,
        voted: p.vote !== null,
        vote: room.revealed ? p.vote : null,
      })),
      // cães já em uso por quem senta na mesa (pra UI travar na seleção)
      takenDogs: room.participants.filter((p) => p.role === 'seated').map((p) => p.dogId),
      seatsTaken: room.participants.filter((p) => p.role === 'seated').length,
      maxSeats: MAX_SEATS,
      // mantém `average` no payload pra clientes antigos; results tem o set completo.
      average: results?.average ?? null,
      results,
    },
  };
}

/** Quantos estão sentados na mesa. */
function seatedCount(room: Room): number {
  return room.participants.filter((p) => p.role === 'seated').length;
}

/** Abriu vaga na mesa: promove o primeiro do banco (ordem de chegada). */
function promoteFromBench(room: Room): void {
  while (seatedCount(room) < MAX_SEATS) {
    const next = room.participants.find((p) => p.role === 'bench');
    if (!next) break;
    next.dogId = pickDog(room, next.dogId, next.id);
    next.role = 'seated';
  }
}

/** Escolhe um dogId: usa o pedido se livre; senão o primeiro livre; senão recicla.
 *  excludeId: participantId a ignorar no cálculo de "taken" (útil em changeDog). */
function pickDog(room: Room, preferred?: number, excludeId?: string): number {
  const taken = new Set(room.participants.filter((p) => p.id !== excludeId).map((p) => p.dogId));
  if (preferred && preferred >= 1 && preferred <= DOG_COUNT && !taken.has(preferred)) {
    return preferred;
  }
  for (let d = 1; d <= DOG_COUNT; d++) {
    if (!taken.has(d)) return d;
  }
  return (room.participants.length % DOG_COUNT) + 1; // sala cheia: recicla
}

/**
 * Resultado da rodada usando o deck da sala — média + distribuição + consenso.
 * Ignora espectadores e participantes sem voto.
 */
function roundResults(room: Room): RoundResults {
  const deck = getDeck(room.deckId);
  const votes = room.participants
    .filter((p) => p.role !== 'spectator')
    .map((p) => p.vote)
    .filter((v): v is string => v !== null);
  return computeRoundResults(deck, votes);
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
    promoteFromBench(room); // abriu vaga? sobe alguém do banco
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
      // Deck só é fixado pelo PRIMEIRO membro a entrar (host). Convidados ignoram.
      const deckId = (raw.deckId && getDeck(raw.deckId).id) || DEFAULT_DECK_ID;
      room = {
        id: roomId,
        participants: [],
        revealed: false,
        lastActivity: Date.now(),
        deckId,
        creatorId: '', // definido abaixo com o participantId do 1º membro
      };
      rooms.set(roomId, room);
    }
    const isNewRoom = room.creatorId === '';
    const participantId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    // 1º membro a entrar vira host — só ele pode encerrar pra todos
    if (isNewRoom) room.creatorId = participantId;
    // entra na mesa se tiver vaga; senão vai pro banco (reserva, vota igual)
    const role: Role =
      raw.role === 'spectator' ? 'spectator' : seatedCount(room) < MAX_SEATS ? 'seated' : 'bench';
    const dogId = pickDog(room, raw.dogId);
    room.participants.push({ id: participantId, name, vote: null, dogId, role });
    sockets.set(ws, { roomId, participantId });
    touch(room);
    // diz ao cliente QUEM ele é (pra identificar "eu" sem depender do dogId)
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'welcome', selfId: participantId }));
    }
    broadcast(room);
    return;
  }

  const st = sockets.get(ws);
  if (!st) return;
  const room = rooms.get(st.roomId);
  if (!room) return;

  switch (raw.type) {
    case 'rename': {
      const p = room.participants.find((x) => x.id === st.participantId);
      const nm = String(raw.name || '')
        .trim()
        .slice(0, 40);
      if (p && nm) {
        p.name = nm;
        touch(room);
        broadcast(room);
      }
      break;
    }
    case 'changeDog': {
      const p = room.participants.find((x) => x.id === st.participantId);
      if (p) {
        const newDog = pickDog(room, raw.dogId, st.participantId);
        p.dogId = newDog;
        touch(room);
        broadcast(room);
      }
      break;
    }
    case 'sit': {
      const p = room.participants.find((x) => x.id === st.participantId);
      if (p && p.role !== 'seated') {
        // só senta se há vaga; senão fica no banco (continua votando)
        p.role = seatedCount(room) < MAX_SEATS ? 'seated' : 'bench';
        if (p.role === 'seated' && raw.dogId) p.dogId = pickDog(room, raw.dogId, st.participantId);
        touch(room);
        broadcast(room);
      }
      break;
    }
    case 'spectate': {
      const p = room.participants.find((x) => x.id === st.participantId);
      if (p && p.role !== 'spectator') {
        p.role = 'spectator';
        p.vote = null; // espectador não vota
        touch(room);
        // libera vaga: se há alguém no banco, promove o primeiro pra mesa
        promoteFromBench(room);
        broadcast(room);
      }
      break;
    }
    case 'vote': {
      const p = room.participants.find((x) => x.id === st.participantId);
      if (p) {
        const value = String(raw.value);
        // só aceita carta válida do deck da sala — evita lixo no broadcast.
        const deck = getDeck(room.deckId);
        if (deck.cards.includes(value)) p.vote = value;
      }
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
    case 'close': {
      // só o criador encerra a sala pra todos; demais são ignorados
      if (st.participantId === room.creatorId) closeRoom(room);
      break;
    }
    case 'leave': {
      removeFromRoom(ws);
      break;
    }
  }
}

/** Host encerrou: avisa todos os sockets da sala, limpa estado e apaga a sala. */
function closeRoom(room: Room): void {
  if (!wss) {
    rooms.delete(room.id);
    return;
  }
  const data = JSON.stringify({ type: 'roomClosed' });
  for (const client of wss.clients) {
    const st = sockets.get(client);
    if (st?.roomId !== room.id) continue;
    if (client.readyState === WebSocket.OPEN) client.send(data);
    sockets.delete(client); // mensagens posteriores desse socket viram no-op
  }
  rooms.delete(room.id);
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

/**
 * Página /join servida pelo próprio host (via túnel Cloudflare https://).
 *
 * Convite vira 1 link clicável: https://<tunnel>/join?room=BEF4F
 * A página descobre o host pela própria origin (this site == o túnel do host),
 * monta o deep link beefor://join?ws=wss://<tunnel>&room=<CODE> e redireciona.
 * Discord/Slack/WhatsApp linkam https:// automaticamente; o beefor:// roda só no clique.
 */
function joinPageHtml(): string {
  // Sem interpolar dados do servidor — tudo vem de location no browser (evita injeção).
  return `<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Entrar na sala — Beefor Planning Poker</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background:#16110d; color:#f4ece3; text-align:center; padding:24px; }
  .card { max-width:380px; background:#211913; border:1px solid #3a2c20; border-radius:16px; padding:32px 28px; }
  h1 { font-size:22px; margin:0 0 8px; }
  p { color:#c8b8a8; font-size:14px; line-height:1.5; margin:0 0 20px; }
  .room { font-size:28px; letter-spacing:4px; font-weight:800; color:#ffb454; margin:4px 0 16px; }
  a.btn { display:inline-block; background:#ff9e2c; color:#1a1208; text-decoration:none;
    font-weight:700; padding:12px 22px; border-radius:10px; }
  small { display:block; margin-top:18px; color:#7d6f60; font-size:12px; }
</style>
</head>
<body>
  <div class="card">
    <h1>🃏 Bora pontuar!</h1>
    <p>Você foi convidado pra uma sala de Planning Poker no Beefor.</p>
    <div class="room" id="room">—</div>
    <a class="btn" id="open" href="#">Abrir no Beefor</a>
    <small>Não abriu? <a id="raw" href="#" style="color:#ffb454">clique aqui</a> ou abra o app e cole o código.</small>
  </div>
<script>
  (function () {
    var params = new URLSearchParams(location.search);
    var room = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    // origin deste site = o túnel do host → wss equivalente
    var ws = location.origin.replace(/^http/i, 'ws');
    var deep = 'beefor://join?ws=' + encodeURIComponent(ws) + '&room=' + encodeURIComponent(room);
    document.getElementById('room').textContent = room || '—';
    var open = document.getElementById('open');
    var raw = document.getElementById('raw');
    open.href = deep;
    raw.href = deep;
    // tenta abrir o app automaticamente
    if (room) { try { location.href = deep; } catch (e) {} }
  })();
</script>
</body>
</html>`;
}

/** Responde requisições HTTP do túnel: serve /join, ignora o resto. */
function handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = req.url ?? '/';
  if (req.method === 'GET' && (url === '/join' || url.startsWith('/join?'))) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(joinPageHtml());
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Beefor Planning Poker');
}

/** Sobe o servidor (idempotente). Chamado no setup dos IPC handlers. */
export function startPokerServer(): void {
  if (wss) return;
  try {
    httpServer = http.createServer(handleHttpRequest);
    wss = new WebSocketServer({ server: httpServer });
    httpServer.listen(PORT);
    httpServer.on('error', (err) => {
      logger.error('[poker] erro no servidor HTTP', err);
    });
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
