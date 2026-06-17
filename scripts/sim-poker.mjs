#!/usr/bin/env node
/*
 * Simulador de participante do Planning Poker (teste manual, sem browser/CSP).
 *
 * Uso — 2 formas:
 *   1) cola o convite inteiro (entre aspas):
 *      node scripts/sim-poker.mjs "wss://abc.trycloudflare.com|HZZPU" "Bot Maria"
 *   2) url e sala separados:
 *      node scripts/sim-poker.mjs wss://abc.trycloudflare.com HZZPU "Bot Maria"
 *      node scripts/sim-poker.mjs 192.168.0.225:4242 HZZPU "Bot Maria"  (rede local)
 *
 * Comandos interativos (digite + Enter):
 *   8        -> vota 8 (cartas: 1 2 3 5 8 13 21 ? ☕)
 *   reveal   -> revela
 *   reset    -> novo round
 *   bots N   -> sobe N bots extras que votam aleatório
 *   quit     -> sai
 */
import WebSocket from 'ws';
import readline from 'node:readline';

const args = process.argv.slice(2);
const CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

/** Normaliza endereço em URL WebSocket. host:porta -> ws://host:porta */
function toWsUrl(raw) {
  let url = raw.trim();
  if (!/^wss?:\/\//i.test(url)) url = `ws://${url}`;
  return url;
}

/** Aceita "url|sala" ou "url" "sala" (em args separados). */
function parseArgs() {
  if (!args[0]) return null;
  // forma 1: convite inteiro no primeiro arg
  if (args[0].includes('|')) {
    const [u, r] = args[0].split('|');
    return { url: toWsUrl(u), room: (r || '').toUpperCase(), name: args[1] || 'Bot Sim' };
  }
  // forma 2: url e sala separados
  if (!args[1]) return null;
  return { url: toWsUrl(args[0]), room: args[1].toUpperCase(), name: args[2] || 'Bot Sim' };
}

const cfg = parseArgs();
if (!cfg || !cfg.room) {
  console.error('Uso: node scripts/sim-poker.mjs "<convite>" [nome]');
  console.error('  ou: node scripts/sim-poker.mjs <url> <SALA> [nome]');
  process.exit(1);
}

const { url: URL, room: ROOM, name: NAME } = cfg;
console.log(`alvo: ${URL} | sala: ${ROOM}`);

/**
 * Conecta com retry — túnel novo do Cloudflare demora alguns segundos
 * pra propagar o DNS (ENOTFOUND nas primeiras tentativas).
 */
function connect(name, { onMessage, attempt = 1 } = {}) {
  const ws = new WebSocket(URL);
  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'join', roomId: ROOM, name }));
    console.log(`✅ ${name} entrou na sala ${ROOM}`);
  });
  if (onMessage) ws.on('message', onMessage);
  ws.on('close', () => console.log(`❌ ${name} desconectou`));
  ws.on('error', (e) => {
    console.error(`erro (${name}, tentativa ${attempt}): ${e.message}`);
    if (attempt < 8) {
      setTimeout(() => {
        const next = connect(name, { onMessage, attempt: attempt + 1 });
        // substitui referência do principal se for ele
        if (name === NAME) mainRef.ws = next;
      }, 4000);
    }
  });
  return ws;
}

function render(buf) {
  let msg;
  try {
    msg = JSON.parse(buf.toString());
  } catch {
    return;
  }
  if (msg.type !== 'roomUpdate') return;
  const { room } = msg;
  console.log(`\n🃏 sala ${room.id} | revelado: ${room.revealed} | média: ${room.average ?? '—'}`);
  for (const p of room.participants) {
    const status = room.revealed ? `voto=${p.vote ?? '—'}` : p.voted ? '✓ votou' : 'aguardando';
    console.log(`   • ${p.name.padEnd(14)} ${status}`);
  }
  process.stdout.write('> ');
}

const mainRef = { ws: connect(NAME, { onMessage: render }) };
const send = (obj) => {
  const ws = mainRef.ws;
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  else console.log('(ainda conectando, tente de novo em 1s)');
};

const bots = [];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => {
  const cmd = line.trim();
  if (!cmd) return process.stdout.write('> ');

  if (cmd === 'reveal') {
    send({ type: 'reveal' });
  } else if (cmd === 'reset') {
    send({ type: 'reset' });
  } else if (cmd === 'quit') {
    send({ type: 'leave' });
    for (const b of bots) b.close();
    rl.close();
    setTimeout(() => process.exit(0), 200);
    return;
  } else if (cmd.startsWith('bots ')) {
    const n = parseInt(cmd.slice(5), 10) || 0;
    for (let i = 0; i < n; i++) {
      const botName = `Bot ${bots.length + 1}`;
      const b = connect(botName);
      b.on('open', () => {
        const card = CARDS[Math.floor(Math.random() * CARDS.length)];
        setTimeout(() => {
          if (b.readyState === WebSocket.OPEN) b.send(JSON.stringify({ type: 'vote', value: card }));
        }, 500);
      });
      bots.push(b);
    }
    console.log(`+${n} bots subindo (votam aleatório)`);
  } else if (CARDS.includes(cmd)) {
    send({ type: 'vote', value: cmd });
  } else {
    console.log('comandos: <carta> | reveal | reset | bots N | quit');
  }
  process.stdout.write('> ');
});
