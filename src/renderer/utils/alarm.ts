let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

async function ensureRunning(audio: AudioContext) {
  if (audio.state === 'suspended') {
    try {
      await audio.resume();
    } catch {
      /* ignore */
    }
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

// PJ (Ajustar Pontos): tema único — "alerta burocrático" insistente.
// Padrão de 4 toques em dois tons alternados (estilo sino de recepção) +
// nota grave de fechamento. Distinto dos demais alarmes.
async function playPjAlarm(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const start = audio.currentTime;
  // 4 dings alternando B5 / E5 (sino metálico)
  const dings = [
    { f: 988, t: 0.0 },
    { f: 659, t: 0.2 },
    { f: 988, t: 0.4 },
    { f: 659, t: 0.6 },
  ];
  for (const d of dings) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = d.f;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.0001, start + d.t);
    gain.gain.exponentialRampToValueAtTime(0.4, start + d.t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + d.t + 0.25);
    osc.connect(gain).connect(audio.destination);
    osc.start(start + d.t);
    osc.stop(start + d.t + 0.28);
  }
  // nota grave de fechamento (A3) — dá peso "oficial"
  const sub = audio.createOscillator();
  const subGain = audio.createGain();
  sub.frequency.value = 220;
  sub.type = 'sine';
  subGain.gain.setValueAtTime(0.0001, start + 0.82);
  subGain.gain.exponentialRampToValueAtTime(0.28, start + 0.86);
  subGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
  sub.connect(subGain).connect(audio.destination);
  sub.start(start + 0.82);
  sub.stop(start + 1.25);
}

type Note = { freq: number; offset: number; dur: number; gain: number; type?: OscillatorType };

function playSequence(notes: Note[]) {
  const audio = getCtx();
  void ensureRunning(audio).then(() => {
    const start = audio.currentTime;
    for (const n of notes) {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = n.type ?? 'square';
      osc.frequency.value = n.freq;
      g.gain.setValueAtTime(0.0001, start + n.offset);
      g.gain.exponentialRampToValueAtTime(n.gain, start + n.offset + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, start + n.offset + n.dur);
      osc.connect(g).connect(audio.destination);
      osc.start(start + n.offset);
      osc.stop(start + n.offset + n.dur + 0.02);
    }
  });
}

// generic minimal click — short tick, like Switch UI
export async function playUiClick(): Promise<void> {
  playSequence([{ freq: 1760, offset: 0, dur: 0.04, gain: 0.06, type: 'sine' }]);
}

// soft close — lower tick
export async function playUiClose(): Promise<void> {
  playSequence([{ freq: 660, offset: 0, dur: 0.06, gain: 0.05, type: 'sine' }]);
}

// tab home: bright two-note up
export async function playUiTabHome(): Promise<void> {
  playSequence([
    { freq: 988, offset: 0, dur: 0.08, gain: 0.08, type: 'triangle' },
    { freq: 1319, offset: 0.06, dur: 0.1, gain: 0.08, type: 'triangle' },
  ]);
}

// tab settings: bright two-note down
export async function playUiTabSettings(): Promise<void> {
  playSequence([
    { freq: 1319, offset: 0, dur: 0.08, gain: 0.08, type: 'triangle' },
    { freq: 988, offset: 0.06, dur: 0.1, gain: 0.08, type: 'triangle' },
  ]);
}

// calendar cell pick: pluck
export async function playUiCalendarPick(): Promise<void> {
  playSequence([{ freq: 1175, offset: 0, dur: 0.07, gain: 0.07, type: 'square' }]);
}

// mood selected: ascending arpeggio
export async function playUiMoodSelect(): Promise<void> {
  playSequence([
    { freq: 523, offset: 0, dur: 0.12, gain: 0.18, type: 'sine' },
    { freq: 659, offset: 0.08, dur: 0.12, gain: 0.18, type: 'sine' },
    { freq: 784, offset: 0.16, dur: 0.18, gain: 0.2, type: 'sine' },
  ]);
}

// auto-lançamento start: spinny chord
export async function playUiAutoLancarStart(): Promise<void> {
  playSequence([
    { freq: 392, offset: 0, dur: 0.1, gain: 0.18, type: 'triangle' },
    { freq: 523, offset: 0.06, dur: 0.1, gain: 0.18, type: 'triangle' },
    { freq: 659, offset: 0.12, dur: 0.14, gain: 0.2, type: 'triangle' },
  ]);
}

// auto-lançamento success: fanfarra Mario coin++
export async function playUiAutoLancarSuccess(): Promise<void> {
  playSequence([
    { freq: 988, offset: 0, dur: 0.08, gain: 0.18, type: 'square' },
    { freq: 1319, offset: 0.07, dur: 0.18, gain: 0.22, type: 'square' },
    { freq: 1568, offset: 0.18, dur: 0.22, gain: 0.18, type: 'triangle' },
  ]);
}

// kudocard modal open: bright pop
export async function playUiKudoOpen(): Promise<void> {
  playSequence([
    { freq: 784, offset: 0, dur: 0.08, gain: 0.14, type: 'triangle' },
    { freq: 1175, offset: 0.06, dur: 0.14, gain: 0.16, type: 'triangle' },
  ]);
}

// kudocard sent: heart fanfare
export async function playUiKudoSent(): Promise<void> {
  playSequence([
    { freq: 659, offset: 0, dur: 0.1, gain: 0.18, type: 'triangle' },
    { freq: 880, offset: 0.08, dur: 0.1, gain: 0.18, type: 'triangle' },
    { freq: 1047, offset: 0.16, dur: 0.14, gain: 0.2, type: 'triangle' },
    { freq: 1319, offset: 0.26, dur: 0.22, gain: 0.18, type: 'sine' },
  ]);
}

// theme toggle: switch flip
export async function playUiThemeToggle(): Promise<void> {
  playSequence([
    { freq: 880, offset: 0, dur: 0.05, gain: 0.1, type: 'square' },
    { freq: 1175, offset: 0.04, dur: 0.06, gain: 0.1, type: 'square' },
  ]);
}

// patch journal open: pageflip
export async function playUiJournal(): Promise<void> {
  playSequence([
    { freq: 1568, offset: 0, dur: 0.04, gain: 0.08, type: 'sine' },
    { freq: 1175, offset: 0.04, dur: 0.06, gain: 0.08, type: 'sine' },
  ]);
}

// lançar dia: punchy chime
export async function playUiLancarDia(): Promise<void> {
  playSequence([
    { freq: 880, offset: 0, dur: 0.08, gain: 0.16, type: 'triangle' },
    { freq: 1319, offset: 0.06, dur: 0.16, gain: 0.18, type: 'triangle' },
  ]);
}

// notification (general): subtle ping
export async function playUiNotify(): Promise<void> {
  playSequence([
    { freq: 1319, offset: 0, dur: 0.08, gain: 0.1, type: 'sine' },
    { freq: 1760, offset: 0.06, dur: 0.1, gain: 0.08, type: 'sine' },
  ]);
}

// team open: Zelda "menu open" feel — pluck triangle arpeggio in major key
// Notes: D5 F#5 A5 D6 (D major triad climb) — clean, melodic, NOT cloying
export async function playUiTeamOpen(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;

  const arpeggio = [
    { f: 587, t: 0.0, d: 0.1 }, // D5
    { f: 740, t: 0.05, d: 0.1 }, // F#5
    { f: 880, t: 0.1, d: 0.12 }, // A5
    { f: 1175, t: 0.15, d: 0.3 }, // D6 — sustained
  ];

  // Triangle (warm, Nintendo-ish bass-mid)
  for (const n of arpeggio) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.18, s + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }

  // Square layer ONLY on top note for sparkle (one octave above)
  const sparkle = audio.createOscillator();
  const sg = audio.createGain();
  sparkle.type = 'square';
  sparkle.frequency.value = 2349; // D7
  sg.gain.setValueAtTime(0.0001, s + 0.15);
  sg.gain.exponentialRampToValueAtTime(0.04, s + 0.16);
  sg.gain.exponentialRampToValueAtTime(0.0001, s + 0.32);
  sparkle.connect(sg).connect(audio.destination);
  sparkle.start(s + 0.15);
  sparkle.stop(s + 0.34);
}

// birthday alert: cute jingle — C5 E5 G5 C6 E6 (major pentatonic climb) triangle + shimmer
export async function playUiBirthdayAlert(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  // ascending pentatonic jingle
  const melody = [
    { f: 523, t: 0.0, d: 0.12 }, // C5
    { f: 659, t: 0.1, d: 0.12 }, // E5
    { f: 784, t: 0.2, d: 0.12 }, // G5
    { f: 1047, t: 0.3, d: 0.16 }, // C6
    { f: 1319, t: 0.4, d: 0.3 }, // E6 — held
  ];
  for (const n of melody) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.16, s + n.t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }
  // tiny shimmer trill on top (E7 + C7 square blips)
  const trill = [
    { f: 2637, t: 0.4, d: 0.04 },
    { f: 2093, t: 0.46, d: 0.04 },
    { f: 2637, t: 0.52, d: 0.06 },
  ];
  for (const n of trill) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.035, s + n.t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.01);
  }
}

// team refresh: quick 3-note spin (like NES disk load)
export async function playUiTeamRefresh(): Promise<void> {
  playSequence([
    { freq: 880, offset: 0, dur: 0.06, gain: 0.12, type: 'square' },
    { freq: 1047, offset: 0.07, dur: 0.06, gain: 0.12, type: 'square' },
    { freq: 1319, offset: 0.14, dur: 0.1, gain: 0.14, type: 'triangle' },
  ]);
}

// boot sound — memorable bee signature: 5 fast triangle plucks ascending +
// sub-bass swell + shimmer + buzzing bee detune. Chiclete vibe.
export async function playUiBoot(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;

  const flutter = [
    { f: 523, t: 0.0, d: 0.08 },
    { f: 659, t: 0.07, d: 0.08 },
    { f: 784, t: 0.14, d: 0.08 },
    { f: 988, t: 0.21, d: 0.1 },
    { f: 1175, t: 0.3, d: 0.2 },
  ];
  for (const n of flutter) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.22, s + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }

  const sub = audio.createOscillator();
  const subG = audio.createGain();
  sub.type = 'sine';
  sub.frequency.value = 98;
  subG.gain.setValueAtTime(0.0001, s + 0.05);
  subG.gain.exponentialRampToValueAtTime(0.14, s + 0.25);
  subG.gain.exponentialRampToValueAtTime(0.0001, s + 0.7);
  sub.connect(subG).connect(audio.destination);
  sub.start(s + 0.05);
  sub.stop(s + 0.75);

  const shimmer = [
    { f: 2349, t: 0.34, d: 0.05 },
    { f: 2637, t: 0.42, d: 0.05 },
    { f: 3136, t: 0.5, d: 0.1 },
  ];
  for (const n of shimmer) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.04, s + n.t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.01);
  }

  const buzz1 = audio.createOscillator();
  const buzz2 = audio.createOscillator();
  const buzzG = audio.createGain();
  buzz1.type = 'sawtooth';
  buzz2.type = 'sawtooth';
  buzz1.frequency.value = 392;
  buzz2.frequency.value = 394;
  buzzG.gain.setValueAtTime(0.0001, s + 0.3);
  buzzG.gain.exponentialRampToValueAtTime(0.06, s + 0.32);
  buzzG.gain.exponentialRampToValueAtTime(0.0001, s + 0.55);
  buzz1.connect(buzzG);
  buzz2.connect(buzzG);
  buzzG.connect(audio.destination);
  buzz1.start(s + 0.3);
  buzz2.start(s + 0.3);
  buzz1.stop(s + 0.58);
  buzz2.stop(s + 0.58);
}

// profile-open — soft major chord chime (Cmaj add9)
export async function playUiProfileOpen(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const notes = [
    { f: 523, t: 0.0, d: 0.3 }, // C5
    { f: 659, t: 0.04, d: 0.3 }, // E5
    { f: 784, t: 0.08, d: 0.32 }, // G5
    { f: 1175, t: 0.12, d: 0.34 }, // D6 (add9)
  ];
  for (const n of notes) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.14, s + n.t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }
}

// activity-open — mesmo estilo do streak mas tom diferente:
// F major ascendente (F4→A4→C5→F5→A5), sine (mais suave que triangle),
// spacing maior (0.09s vs 0.06s), gain menor, sem crackle
export async function playUiActivityOpen(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;

  const notes = [
    { f: 349, t: 0.0, d: 0.22 }, // F4
    { f: 440, t: 0.09, d: 0.22 }, // A4
    { f: 523, t: 0.18, d: 0.24 }, // C5
    { f: 698, t: 0.27, d: 0.28 }, // F5
    { f: 880, t: 0.36, d: 0.38 }, // A5 — held
  ];

  for (const n of notes) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.14, s + n.t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }
}

// streak-open — fire crackle + bright triumphant chord opening leaderboard
export async function playUiStreakOpen(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  // Triumphant rising arpeggio (G major, fanfare-like)
  const notes = [
    { f: 392, t: 0.0, d: 0.18 }, // G4
    { f: 587, t: 0.06, d: 0.18 }, // D5
    { f: 784, t: 0.12, d: 0.22 }, // G5
    { f: 988, t: 0.18, d: 0.26 }, // B5
    { f: 1175, t: 0.24, d: 0.4 }, // D6
  ];
  for (const n of notes) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.18, s + n.t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }
  // Subtle fire crackle (filtered noise burst)
  const noiseDur = 0.5;
  const buf = audio.createBuffer(1, audio.sampleRate * noiseDur, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const decay = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * decay * 0.4;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2200;
  filter.Q.value = 0.8;
  const ng = audio.createGain();
  ng.gain.setValueAtTime(0.06, s);
  ng.gain.exponentialRampToValueAtTime(0.0001, s + noiseDur);
  noise.connect(filter).connect(ng).connect(audio.destination);
  noise.start(s);
  noise.stop(s + noiseDur);
}

// coin pickup — Mario "ding" two-note (B5 → E6)
export async function playUiCoin(): Promise<void> {
  playSequence([
    { freq: 988, offset: 0, dur: 0.09, gain: 0.22, type: 'square' },
    { freq: 1319, offset: 0.07, dur: 0.36, gain: 0.22, type: 'square' },
  ]);
}

// success — saved (lançamento etc): bright two-note up + glide
export async function playUiSuccess(): Promise<void> {
  playSequence([
    { freq: 784, offset: 0, dur: 0.08, gain: 0.18, type: 'triangle' },
    { freq: 1047, offset: 0.07, dur: 0.1, gain: 0.2, type: 'triangle' },
    { freq: 1568, offset: 0.16, dur: 0.18, gain: 0.18, type: 'sine' },
  ]);
}

// poker-open — fichas + baralho: cliques secos de chips + "shuffle" (ruído curto)
export async function playUiPokerOpen(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  // 3 cliques de ficha (curtos, agudos, levemente dessincronizados)
  const chips = [0, 0.06, 0.13];
  for (const t of chips) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = 1200 + Math.random() * 400;
    g.gain.setValueAtTime(0.0001, s + t);
    g.gain.exponentialRampToValueAtTime(0.12, s + t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, s + t + 0.05);
    osc.connect(g).connect(audio.destination);
    osc.start(s + t);
    osc.stop(s + t + 0.06);
  }
  // "shuffle" do baralho — ruído filtrado curto
  const dur = 0.4;
  const buf = audio.createBuffer(1, audio.sampleRate * dur, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const decay = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * decay * 0.5;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3200;
  filter.Q.value = 0.6;
  const ng = audio.createGain();
  ng.gain.setValueAtTime(0.08, s + 0.18);
  ng.gain.exponentialRampToValueAtTime(0.0001, s + 0.18 + dur);
  noise.connect(filter).connect(ng).connect(audio.destination);
  noise.start(s + 0.18);
  noise.stop(s + 0.18 + dur);
}

// dog-bark — "au-au" pixel: dois ganidos curtos com pitch caindo
export async function playUiDogBark(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const barks = [0, 0.18];
  for (const t of barks) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620, s + t);
    osc.frequency.exponentialRampToValueAtTime(300, s + t + 0.12);
    g.gain.setValueAtTime(0.0001, s + t);
    g.gain.exponentialRampToValueAtTime(0.2, s + t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + t + 0.13);
    osc.connect(g).connect(audio.destination);
    osc.start(s + t);
    osc.stop(s + t + 0.15);
  }
}

// poker-reveal — "virar cartas": varredura ascendente curta + clique final
export async function playUiPokerReveal(): Promise<void> {
  playSequence([
    { freq: 523, offset: 0, dur: 0.07, gain: 0.16, type: 'triangle' },
    { freq: 659, offset: 0.05, dur: 0.07, gain: 0.16, type: 'triangle' },
    { freq: 784, offset: 0.1, dur: 0.07, gain: 0.16, type: 'triangle' },
    { freq: 1047, offset: 0.16, dur: 0.22, gain: 0.18, type: 'sine' },
  ]);
}

// boo — vaia: ruído grave descendente "buuu"
export async function playUiBoo(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(240, s);
  osc.frequency.exponentialRampToValueAtTime(90, s + 0.7);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(0.18, s + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, s + 0.75);
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  osc.connect(filter).connect(g).connect(audio.destination);
  osc.start(s);
  osc.stop(s + 0.8);
}

// clap — aplauso: rajada de cliques de ruído filtrado
export async function playUiClap(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  for (let i = 0; i < 7; i++) {
    const t = s + i * 0.07 + Math.random() * 0.02;
    const dur = 0.05;
    const buf = audio.createBuffer(1, audio.sampleRate * dur, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < data.length; j++) {
      data[j] = (Math.random() * 2 - 1) * (1 - j / data.length);
    }
    const noise = audio.createBufferSource();
    noise.buffer = buf;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1;
    const g = audio.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    noise.connect(filter).connect(g).connect(audio.destination);
    noise.start(t);
    noise.stop(t + dur);
  }
}

// drumroll — rufar de tambor (suspense): cliques graves acelerando + final
export async function playUiDrumroll(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  let t = 0;
  let gap = 0.07;
  while (t < 1.0) {
    const at = s + t;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 90 + Math.random() * 20;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    osc.connect(g).connect(audio.destination);
    osc.start(at);
    osc.stop(at + 0.06);
    t += gap;
    gap = Math.max(0.025, gap * 0.92); // acelera
  }
  // batida final
  const at = s + 1.05;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, at);
  osc.frequency.exponentialRampToValueAtTime(60, at + 0.3);
  g.gain.setValueAtTime(0.3, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
  osc.connect(g).connect(audio.destination);
  osc.start(at);
  osc.stop(at + 0.4);
}

// airhorn — buzina de festa: blasts sawtooth graves com vibrato
export async function playUiAirhorn(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const blasts = [
    { t: 0, d: 0.18 },
    { t: 0.24, d: 0.18 },
    { t: 0.48, d: 0.5 },
  ];
  for (const b of blasts) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    const lfo = audio.createOscillator();
    const lfoG = audio.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 220;
    lfo.frequency.value = 7; // vibrato
    lfoG.gain.value = 12;
    lfo.connect(lfoG).connect(osc.frequency);
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    g.gain.setValueAtTime(0.0001, s + b.t);
    g.gain.exponentialRampToValueAtTime(0.22, s + b.t + 0.02);
    g.gain.setValueAtTime(0.22, s + b.t + b.d - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, s + b.t + b.d);
    osc.connect(filter).connect(g).connect(audio.destination);
    osc.start(s + b.t);
    lfo.start(s + b.t);
    osc.stop(s + b.t + b.d + 0.02);
    lfo.stop(s + b.t + b.d + 0.02);
  }
}

// sad-trombone — "womp womp womp wooomp": 4 notas descendentes com glide
export async function playUiSadTrombone(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const notes = [
    { f: 311, to: 294, t: 0.0, d: 0.28 }, // Eb4→D4
    { f: 294, to: 277, t: 0.3, d: 0.28 }, // D4→C#4
    { f: 277, to: 262, t: 0.6, d: 0.28 }, // C#4→C4
    { f: 262, to: 196, t: 0.9, d: 0.6 }, // C4→G3 (wooomp)
  ];
  for (const n of notes) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(n.f, s + n.t);
    osc.frequency.linearRampToValueAtTime(n.to, s + n.t + n.d);
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.2, s + n.t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(filter).connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }
}

// crickets — silêncio constrangedor: chirps agudos repetidos, baixinho
export async function playUiCrickets(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  for (let i = 0; i < 4; i++) {
    const base = s + i * 0.4;
    // cada cricri = 3 chirps rápidos
    for (let j = 0; j < 3; j++) {
      const t = base + j * 0.04;
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = 4400;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(g).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }
}

// tada — fanfarra de vitória: acorde maior + brilho
export async function playUiTada(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  // pickup rápido C5→G5 e acorde sustentado C maior
  const lead = [
    { f: 523, t: 0.0, d: 0.1 },
    { f: 784, t: 0.08, d: 0.1 },
  ];
  for (const n of lead) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0.0001, s + n.t);
    g.gain.exponentialRampToValueAtTime(0.2, s + n.t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.t + n.d);
    osc.connect(g).connect(audio.destination);
    osc.start(s + n.t);
    osc.stop(s + n.t + n.d + 0.02);
  }
  const chord = [523, 659, 784, 1047]; // C E G C
  for (const f of chord) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s + 0.18);
    g.gain.exponentialRampToValueAtTime(0.16, s + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.7);
    osc.connect(g).connect(audio.destination);
    osc.start(s + 0.18);
    osc.stop(s + 0.72);
  }
}

// fart — pum cômico: sawtooth grave com wobble de pitch + lowpass
export async function playUiFart(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  osc.type = 'sawtooth';
  // pitch que sobe e desce esquisito
  osc.frequency.setValueAtTime(120, s);
  osc.frequency.linearRampToValueAtTime(90, s + 0.08);
  osc.frequency.linearRampToValueAtTime(150, s + 0.18);
  osc.frequency.linearRampToValueAtTime(70, s + 0.4);
  const lfo = audio.createOscillator();
  const lfoG = audio.createGain();
  lfo.frequency.value = 22;
  lfoG.gain.value = 30;
  lfo.connect(lfoG).connect(osc.frequency);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(0.22, s + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, s + 0.42);
  osc.connect(filter).connect(g).connect(audio.destination);
  osc.start(s);
  lfo.start(s);
  osc.stop(s + 0.45);
  lfo.stop(s + 0.45);
}

// howl — uivo de lobo/cão: glide subindo até o ápice e descendo lento,
// sawtooth com vibrato + lowpass, sustentado (~1.2s)
export async function playUiHowl(): Promise<void> {
  const audio = getCtx();
  await ensureRunning(audio);
  const s = audio.currentTime;
  const dur = 1.2;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sawtooth';
  // contorno do uivo: sobe rápido, segura agudo, cai lento
  osc.frequency.setValueAtTime(300, s);
  osc.frequency.linearRampToValueAtTime(560, s + 0.25);
  osc.frequency.setValueAtTime(560, s + 0.7);
  osc.frequency.linearRampToValueAtTime(360, s + dur);
  // vibrato (trêmulo do uivo)
  const lfo = audio.createOscillator();
  const lfoG = audio.createGain();
  lfo.frequency.value = 6;
  lfoG.gain.value = 14;
  lfo.connect(lfoG).connect(osc.frequency);
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1500;
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(0.2, s + 0.12);
  g.gain.setValueAtTime(0.2, s + dur - 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  osc.connect(filter).connect(g).connect(audio.destination);
  osc.start(s);
  lfo.start(s);
  osc.stop(s + dur + 0.05);
  lfo.stop(s + dur + 0.05);
}

export type UiSoundKind =
  | 'click'
  | 'close'
  | 'tab-home'
  | 'tab-settings'
  | 'calendar-pick'
  | 'mood-select'
  | 'auto-lancar-start'
  | 'auto-lancar-success'
  | 'kudo-open'
  | 'kudo-sent'
  | 'theme-toggle'
  | 'journal'
  | 'lancar-dia'
  | 'notify'
  | 'coin'
  | 'success'
  | 'team-open'
  | 'team-refresh'
  | 'birthday'
  | 'boot'
  | 'profile-open'
  | 'streak-open'
  | 'activity-open'
  | 'poker-open'
  | 'dog-bark'
  | 'poker-reveal'
  | 'boo'
  | 'clap'
  | 'drumroll'
  | 'airhorn'
  | 'sad-trombone'
  | 'crickets'
  | 'tada'
  | 'fart'
  | 'howl';

export function playUiSound(kind: UiSoundKind): void {
  switch (kind) {
    case 'click':
      void playUiClick();
      return;
    case 'close':
      void playUiClose();
      return;
    case 'tab-home':
      void playUiTabHome();
      return;
    case 'tab-settings':
      void playUiTabSettings();
      return;
    case 'calendar-pick':
      void playUiCalendarPick();
      return;
    case 'mood-select':
      void playUiMoodSelect();
      return;
    case 'auto-lancar-start':
      void playUiAutoLancarStart();
      return;
    case 'auto-lancar-success':
      void playUiAutoLancarSuccess();
      return;
    case 'kudo-open':
      void playUiKudoOpen();
      return;
    case 'kudo-sent':
      void playUiKudoSent();
      return;
    case 'theme-toggle':
      void playUiThemeToggle();
      return;
    case 'journal':
      void playUiJournal();
      return;
    case 'lancar-dia':
      void playUiLancarDia();
      return;
    case 'notify':
      void playUiNotify();
      return;
    case 'coin':
      void playUiCoin();
      return;
    case 'success':
      void playUiSuccess();
      return;
    case 'team-open':
      void playUiTeamOpen();
      return;
    case 'team-refresh':
      void playUiTeamRefresh();
      return;
    case 'birthday':
      void playUiBirthdayAlert();
      return;
    case 'boot':
      void playUiBoot();
      return;
    case 'profile-open':
      void playUiProfileOpen();
      return;
    case 'streak-open':
      void playUiStreakOpen();
      return;
    case 'activity-open':
      void playUiActivityOpen();
      return;
    case 'poker-open':
      void playUiPokerOpen();
      return;
    case 'dog-bark':
      void playUiDogBark();
      return;
    case 'poker-reveal':
      void playUiPokerReveal();
      return;
    case 'boo':
      void playUiBoo();
      return;
    case 'clap':
      void playUiClap();
      return;
    case 'drumroll':
      void playUiDrumroll();
      return;
    case 'airhorn':
      void playUiAirhorn();
      return;
    case 'sad-trombone':
      void playUiSadTrombone();
      return;
    case 'crickets':
      void playUiCrickets();
      return;
    case 'tada':
      void playUiTada();
      return;
    case 'fart':
      void playUiFart();
      return;
    case 'howl':
      void playUiHowl();
      return;
  }
}

export type AlarmKind = 'mood' | 'lunch' | 'punch' | 'kudocard' | 'pj' | 'default';

export async function playAlarmByKind(kind: AlarmKind): Promise<void> {
  switch (kind) {
    case 'mood':
      return playMoodAlarm();
    case 'lunch':
      return playLunchAlarm();
    case 'punch':
      return playPunchAlarm();
    case 'kudocard':
      return playKudocardAlarm();
    case 'pj':
      return playPjAlarm();
    default:
      return playAlarm();
  }
}
