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
  | 'notify';

export function playUiSound(kind: UiSoundKind): void {
  switch (kind) {
    case 'click': void playUiClick(); return;
    case 'close': void playUiClose(); return;
    case 'tab-home': void playUiTabHome(); return;
    case 'tab-settings': void playUiTabSettings(); return;
    case 'calendar-pick': void playUiCalendarPick(); return;
    case 'mood-select': void playUiMoodSelect(); return;
    case 'auto-lancar-start': void playUiAutoLancarStart(); return;
    case 'auto-lancar-success': void playUiAutoLancarSuccess(); return;
    case 'kudo-open': void playUiKudoOpen(); return;
    case 'kudo-sent': void playUiKudoSent(); return;
    case 'theme-toggle': void playUiThemeToggle(); return;
    case 'journal': void playUiJournal(); return;
    case 'lancar-dia': void playUiLancarDia(); return;
    case 'notify': void playUiNotify(); return;
  }
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
