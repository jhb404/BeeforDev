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
 *   bots N   -> sobe N bots com nomes aleatórios (votam aleatório)
 *   fill     -> sobe 6 bots com nomes aleatórios de uma vez
 *   react    -> você manda uma reação (emoji aleatório); react 🔥 = emoji específico
 *   reacts   -> todos os bots reagem com emoji aleatório
 *   sound    -> reação SONORA: sound latido|aplauso|vaia|suspense (vazio = aleatório)
 *   sounds   -> todos os bots mandam um som aleatório
 *   quit     -> sai
 */
import WebSocket from 'ws';
import readline from 'node:readline';

const args = process.argv.slice(2);
const CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

/** Nomes aleatórios pros bots. */
const NAMES = [
  'Sara', 'Lucas', 'Michael', 'Jennifer', 'Bruno', 'Paula', 'Diego', 'Aline',
  'Rafa', 'Bia', 'Caio', 'Duda', 'Theo', 'Nina', 'Igor', 'Lara',
];
const EMOJIS = ['🔥', '👏', '😂', '👍', '❤️', '🤔'];
/** Reações sonoras (mesmas do app): atalho -> { emoji, sound } */
const SOUNDS = {
  latido: { emoji: '🐶', sound: 'dog-bark' },
  aplauso: { emoji: '👏', sound: 'clap' },
  vaia: { emoji: '👎', sound: 'boo' },
  suspense: { emoji: '🥁', sound: 'drumroll' },
};
const usedNames = new Set();
function randomName() {
  const free = NAMES.filter((n) => !usedNames.has(n));
  const pool = free.length ? free : NAMES;
  const name = pool[Math.floor(Math.random() * pool.length)];
  usedNames.add(name);
  return name;
}

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
  if (msg.type === 'reaction') {
    const snd = msg.sound ? ` 🔊 ${msg.sound}` : '';
    console.log(`\n💬 reação: ${msg.fromName} → ${msg.emoji}${snd}`);
    process.stdout.write('> ');
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

/** Sobe N bots com nomes aleatórios. Cada um vota uma carta aleatória. */
function spawnBots(n) {
  for (let i = 0; i < n; i++) {
    const botName = randomName();
    const b = connect(botName);
    b.on('open', () => {
      const card = CARDS[Math.floor(Math.random() * CARDS.length)];
      setTimeout(() => {
        if (b.readyState === WebSocket.OPEN) b.send(JSON.stringify({ type: 'vote', value: card }));
      }, 500);
    });
    bots.push(b);
  }
  console.log(`+${n} bots subindo com nomes aleatórios (votam aleatório)`);
}

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
  } else if (cmd === 'fill') {
    spawnBots(6);
  } else if (cmd.startsWith('bots ')) {
    spawnBots(parseInt(cmd.slice(5), 10) || 0);
  } else if (cmd === 'react' || cmd.startsWith('react ')) {
    const emoji = cmd.slice(5).trim() || EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    send({ type: 'reaction', emoji });
    console.log(`enviou reação: ${emoji}`);
  } else if (cmd === 'reacts') {
    // todos os bots reagem com emoji aleatório
    for (const b of bots) {
      if (b.readyState === WebSocket.OPEN) {
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        b.send(JSON.stringify({ type: 'reaction', emoji }));
      }
    }
    console.log(`${bots.length} bots reagiram`);
  } else if (cmd === 'sound' || cmd.startsWith('sound ')) {
    // reação SONORA: sound latido|aplauso|vaia|suspense (vazio = aleatório)
    const key = cmd.slice(6).trim();
    const entry = SOUNDS[key] || SOUNDS[Object.keys(SOUNDS)[Math.floor(Math.random() * 4)]];
    send({ type: 'reaction', emoji: entry.emoji, sound: entry.sound });
    console.log(`enviou som: ${entry.sound} ${entry.emoji}`);
  } else if (cmd === 'sounds') {
    // todos os bots mandam um som aleatório (cuidado: vira festa)
    const keys = Object.keys(SOUNDS);
    for (const b of bots) {
      if (b.readyState === WebSocket.OPEN) {
        const entry = SOUNDS[keys[Math.floor(Math.random() * keys.length)]];
        b.send(JSON.stringify({ type: 'reaction', emoji: entry.emoji, sound: entry.sound }));
      }
    }
    console.log(`${bots.length} bots mandaram som`);
  } else if (CARDS.includes(cmd)) {
    send({ type: 'vote', value: cmd });
  } else {
    console.log(
      'comandos: <carta> | reveal | reset | fill | bots N | react [emoji] | reacts | sound [latido|aplauso|vaia|suspense] | sounds | quit',
    );
  }
  process.stdout.write('> ');
});
