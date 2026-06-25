#!/usr/bin/env node
/*
 * Servidor de sala REAL de Planning Poker + túnel + link — pra TESTE num PC só.
 *
 * Replica a lógica de sala do app (main/services/pokerServer.ts), sem depender
 * do Electron. Serve a página /join e roda a sala de verdade: dá pra clicar o
 * link, abrir o app e JOGAR contra este servidor.
 *
 * 1. Sobe HTTP+WS na porta do poker (serve /join + lógica de sala).
 * 2. Sobe cloudflared apontando pra cá.
 * 3. Imprime o link de convite: https://<tunnel>/join?room=<CODE>
 *
 * Rodar:  node scripts/poker-invite.mjs            (código aleatório)
 *         node scripts/poker-invite.mjs BEF4F      (código fixo)
 *         POKER_PORT=4343 node scripts/poker-invite.mjs   (outra porta)
 *
 * IMPORTANTE: feche o app (npm run dev) OU use outra porta — a 4242 não pode
 * estar ocupada pelo servidor do app. Ctrl+C encerra.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.POKER_PORT) || 4242;

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genRoom() {
  let c = '';
  for (let i = 0; i < 5; i++) c += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  return c;
}
const room = (process.argv[2] || genRoom()).toUpperCase().replace(/[^A-Z0-9]/g, '') || genRoom();

/* ───────────────────────── lógica de sala (porta do app) ───────────────────────── */

const NON_NUMERIC = new Set(['?', '☕']);
const DOG_COUNT = 14;
const MAX_SEATS = 7;
const rooms = new Map();
const sockets = new WeakMap();

function seatedCount(r) {
  return r.participants.filter((p) => p.role === 'seated').length;
}
function pickDog(r, preferred, excludeId) {
  const taken = new Set(r.participants.filter((p) => p.id !== excludeId).map((p) => p.dogId));
  if (preferred && preferred >= 1 && preferred <= DOG_COUNT && !taken.has(preferred)) return preferred;
  for (let d = 1; d <= DOG_COUNT; d++) if (!taken.has(d)) return d;
  return (r.participants.length % DOG_COUNT) + 1;
}
function promoteFromBench(r) {
  while (seatedCount(r) < MAX_SEATS) {
    const next = r.participants.find((p) => p.role === 'bench');
    if (!next) break;
    next.dogId = pickDog(r, next.dogId, next.id);
    next.role = 'seated';
  }
}
function average(r) {
  const nums = r.participants
    .filter((p) => p.role !== 'spectator')
    .map((p) => p.vote)
    .filter((v) => v !== null && !NON_NUMERIC.has(v))
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
function roomPayload(r) {
  return {
    type: 'roomUpdate',
    room: {
      id: r.id,
      revealed: r.revealed,
      participants: r.participants.map((p) => ({
        id: p.id,
        name: p.name,
        dogId: p.dogId,
        role: p.role,
        voted: p.vote !== null,
        vote: r.revealed ? p.vote : null,
      })),
      takenDogs: r.participants.filter((p) => p.role === 'seated').map((p) => p.dogId),
      seatsTaken: seatedCount(r),
      maxSeats: MAX_SEATS,
      average: r.revealed ? average(r) : null,
    },
  };
}
let wss = null;
function broadcast(r) {
  if (!wss) return;
  const data = JSON.stringify(roomPayload(r));
  for (const client of wss.clients) {
    const st = sockets.get(client);
    if (st?.roomId === r.id && client.readyState === WebSocket.OPEN) client.send(data);
  }
}
function broadcastReaction(r, fromId, fromName, emoji, sound) {
  if (!wss) return;
  const data = JSON.stringify({ type: 'reaction', fromId, fromName, emoji, sound });
  for (const client of wss.clients) {
    const st = sockets.get(client);
    if (st?.roomId === r.id && client.readyState === WebSocket.OPEN) client.send(data);
  }
}
function removeFromRoom(ws) {
  const st = sockets.get(ws);
  if (!st) return;
  sockets.delete(ws);
  const r = rooms.get(st.roomId);
  if (!r) return;
  r.participants = r.participants.filter((p) => p.id !== st.participantId);
  if (r.participants.length === 0) rooms.delete(r.id);
  else {
    promoteFromBench(r);
    broadcast(r);
  }
}
function handleMessage(ws, raw) {
  if (raw.type === 'join') {
    const roomId = String(raw.roomId || '').trim().toUpperCase();
    const name = String(raw.name || '').trim().slice(0, 40) || 'Anônimo';
    if (!roomId) return;
    let r = rooms.get(roomId);
    if (!r) {
      r = { id: roomId, participants: [], revealed: false };
      rooms.set(roomId, r);
    }
    const participantId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const role = raw.role === 'spectator' ? 'spectator' : seatedCount(r) < MAX_SEATS ? 'seated' : 'bench';
    const dogId = pickDog(r, raw.dogId);
    r.participants.push({ id: participantId, name, vote: null, dogId, role });
    sockets.set(ws, { roomId, participantId });
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'welcome', selfId: participantId }));
    }
    console.log(`[sala ${roomId}] entrou "${name}" (${role}) — ${r.participants.length} na sala`);
    broadcast(r);
    return;
  }
  const st = sockets.get(ws);
  if (!st) return;
  const r = rooms.get(st.roomId);
  if (!r) return;
  switch (raw.type) {
    case 'rename': {
      const p = r.participants.find((x) => x.id === st.participantId);
      const nm = String(raw.name || '').trim().slice(0, 40);
      if (p && nm) { p.name = nm; broadcast(r); }
      break;
    }
    case 'changeDog': {
      const p = r.participants.find((x) => x.id === st.participantId);
      if (p) { p.dogId = pickDog(r, raw.dogId, st.participantId); broadcast(r); }
      break;
    }
    case 'sit': {
      const p = r.participants.find((x) => x.id === st.participantId);
      if (p && p.role !== 'seated') {
        p.role = seatedCount(r) < MAX_SEATS ? 'seated' : 'bench';
        if (p.role === 'seated' && raw.dogId) p.dogId = pickDog(r, raw.dogId, st.participantId);
        broadcast(r);
      }
      break;
    }
    case 'spectate': {
      const p = r.participants.find((x) => x.id === st.participantId);
      if (p && p.role !== 'spectator') {
        p.role = 'spectator';
        p.vote = null;
        promoteFromBench(r);
        broadcast(r);
      }
      break;
    }
    case 'vote': {
      const p = r.participants.find((x) => x.id === st.participantId);
      if (p) p.vote = String(raw.value);
      broadcast(r);
      break;
    }
    case 'reveal': { r.revealed = true; broadcast(r); break; }
    case 'reset': { r.revealed = false; for (const p of r.participants) p.vote = null; broadcast(r); break; }
    case 'reaction': {
      const p = r.participants.find((x) => x.id === st.participantId);
      const sound = raw.sound ? String(raw.sound).slice(0, 20) : undefined;
      broadcastReaction(r, st.participantId, p?.name ?? '?', String(raw.emoji).slice(0, 8), sound);
      break;
    }
    case 'leave': { removeFromRoom(ws); break; }
  }
}

/* ───────────────────────── página /join ───────────────────────── */

function joinPageHtml() {
  return `<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Entrar na sala — Beefor Planning Poker</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#16110d;color:#f4ece3;text-align:center;padding:24px}
  .card{max-width:380px;background:#211913;border:1px solid #3a2c20;border-radius:16px;padding:32px 28px}
  h1{font-size:22px;margin:0 0 8px}
  p{color:#c8b8a8;font-size:14px;line-height:1.5;margin:0 0 20px}
  .room{font-size:28px;letter-spacing:4px;font-weight:800;color:#ffb454;margin:4px 0 16px}
  a.btn{display:inline-block;background:#ff9e2c;color:#1a1208;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px}
  small{display:block;margin-top:18px;color:#7d6f60;font-size:12px}
</style></head>
<body><div class="card">
  <h1>🃏 Bora pontuar!</h1>
  <p>Você foi convidado pra uma sala de Planning Poker no Beefor.</p>
  <div class="room" id="room">—</div>
  <a class="btn" id="open" href="#">Abrir no Beefor</a>
  <small>Não abriu? <a id="raw" href="#" style="color:#ffb454">clique aqui</a> ou abra o app e cole o código.</small>
</div>
<script>
(function(){
  var params=new URLSearchParams(location.search);
  var room=(params.get('room')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  var ws=location.origin.replace(/^http/i,'ws');
  var deep='beefor://join?ws='+encodeURIComponent(ws)+'&room='+encodeURIComponent(room);
  document.getElementById('room').textContent=room||'—';
  document.getElementById('open').href=deep;
  document.getElementById('raw').href=deep;
  if(room){try{location.href=deep;}catch(e){}}
})();
</script></body></html>`;
}

/* ───────────────────────── servidor + túnel ───────────────────────── */

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (req.method === 'GET' && (url === '/join' || url.startsWith('/join?'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(joinPageHtml());
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Beefor Planning Poker (teste)');
});

wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  ws.on('message', (buf) => {
    try {
      handleMessage(ws, JSON.parse(buf.toString()));
    } catch (e) {
      console.warn('[teste] mensagem inválida:', e?.message ?? e);
    }
  });
  ws.on('close', () => removeFromRoom(ws));
  ws.on('error', () => removeFromRoom(ws));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[!] Porta ${PORT} ocupada. Feche o app (npm run dev) ou rode com outra porta:\n` +
        `    POKER_PORT=4343 node scripts/poker-invite.mjs ${room}\n`,
    );
  } else {
    console.error('[teste] erro no servidor:', err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`[teste] servidor de sala REAL na porta ${PORT}`);
  startTunnel();
});

function cloudflaredPath() {
  const name =
    process.platform === 'win32'
      ? 'cloudflared.exe'
      : process.platform === 'darwin'
        ? 'cloudflared-darwin'
        : 'cloudflared-linux';
  const p = resolve(__dirname, '../resources', name);
  if (!existsSync(p)) {
    console.error(`[!] ${name} não encontrado em resources/. Rode: node scripts/fetch-cloudflared.mjs`);
    process.exit(1);
  }
  return p;
}

function startTunnel() {
  const bin = cloudflaredPath();
  console.log('[teste] subindo cloudflared…\n');
  const proc = spawn(bin, ['tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate']);
  const urlRe = /(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/i;
  let printed = false;

  const onData = (buf) => {
    const text = buf.toString();
    process.stdout.write(text);
    const m = text.match(urlRe);
    if (m && !printed) {
      printed = true;
      const invite = `${m[1]}/join?room=${room}`;
      console.log('\n========================================');
      console.log('LINK DE CONVITE (cole no Discord / clique pra testar):');
      console.log(invite);
      console.log('----------------------------------------');
      console.log(`Sala:  ${room}`);
      console.log('========================================\n');
      console.log('Clique o link → abre o app → entra e JOGA nesta sala. Ctrl+C encerra.\n');
    }
  };

  proc.stdout?.on('data', onData);
  proc.stderr?.on('data', onData);
  proc.on('exit', (code) => {
    console.log(`\n[teste] cloudflared encerrou (code ${code})`);
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    console.log('\n[teste] encerrando…');
    proc.kill();
    server.close();
    process.exit(0);
  });
}
