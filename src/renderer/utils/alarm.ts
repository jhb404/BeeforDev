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
  | 'streak-open';

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
  }
}

export type AlarmKind = 'mood' | 'lunch' | 'punch' | 'kudocard' | 'default';

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
    default:
      return playAlarm();
  }
}
