let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

async function ensureRunning(audio: AudioContext) {
  if (audio.state === 'suspended') {
    try { await audio.resume(); } catch { /* ignore */ }
  }
}

// Generic 3-beep used as default
export async function playAlarm(durationMs = 2500): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  const beeps = Math.max(2, Math.floor(durationMs / 500));
  for (let i = 0; i < beeps; i++) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = i % 2 === 0 ? 880 : 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, start + i * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.45, start + i * 0.5 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.5 + 0.4);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + i * 0.5);
    osc.stop(start + i * 0.5 + 0.45);
  }
}

// Mood: soft ascending chime
async function playMoodAlarm(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  const notes = [523, 659, 784]; // C5 E5 G5
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, start + i * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.3, start + i * 0.22 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.22 + 0.35);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + i * 0.22);
    osc.stop(start + i * 0.22 + 0.38);
  });
}

// Lunch: warm double-ding
async function playLunchAlarm(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  [0, 0.35].forEach((offset) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 440;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.5, start + offset + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.55);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.6);
  });
}

// Punch: sharp double-beep
async function playPunchAlarm(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  [0, 0.25].forEach((offset) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 1000;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.15, start + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.2);
  });
}

// Kudocard: fanfarra curta — nota alta + harmônico
async function playKudocardAlarm(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  // três notas ascendentes rápidas: G5 A5 C6
  const notes = [784, 880, 1047];
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.0001, start + i * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.35, start + i * 0.14 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.14 + 0.28);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + i * 0.14);
    osc.stop(start + i * 0.14 + 0.3);
  });
  // eco grave
  const sub = audio.createOscillator();
  const subGain = audio.createGain();
  sub.frequency.value = 392;
  sub.type = 'sine';
  subGain.gain.setValueAtTime(0.0001, start + 0.42);
  subGain.gain.exponentialRampToValueAtTime(0.2, start + 0.45);
  subGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.75);
  sub.connect(subGain).connect(audio.destination);
  sub.start(start + 0.42);
  sub.stop(start + 0.8);
}

// UI click: Nintendo-style coin blip (short two-note up)
export async function playUiClick(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  const notes = [988, 1319]; // B5 E6
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.0001, start + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.08, start + i * 0.06 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.06 + 0.12);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + i * 0.06);
    osc.stop(start + i * 0.06 + 0.14);
  });
}

// UI hover: subtle blip
export async function playUiHover(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 1568;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.04, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + 0.08);
}

export type AlarmKind = 'mood' | 'lunch' | 'punch' | 'kudocard' | 'default';

export async function playAlarmByKind(kind: AlarmKind): Promise<void> {
  switch (kind) {
    case 'mood': return playMoodAlarm();
    case 'lunch': return playLunchAlarm();
    case 'punch': return playPunchAlarm();
    case 'kudocard': return playKudocardAlarm();
    default: return playAlarm();
  }
}
