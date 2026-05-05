/**
 * Plays an alarm sound using WebAudio.
 * No external mp3/wav needed — synthesized 3-beep pattern.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export async function playAlarm(durationMs = 2500): Promise<void> {
  const audio = getCtx();
  if (audio.state === 'suspended') {
    try {
      await audio.resume();
    } catch {
      /* ignore */
    }
  }
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
