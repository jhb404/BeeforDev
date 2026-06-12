import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'beefor_hkr_unlocked';
const SECRET = '1234';

type Phase = 'lock' | 'error' | 'success' | 'unlocked';

function playSound(type: 'open' | 'error' | 'success') {
  try {
    const ctx = new AudioContext();

    if (type === 'open') {
      const seq: Array<[number, number, OscillatorType]> = [
        [440, 0.0, 'square'],
        [660, 0.05, 'square'],
        [880, 0.1, 'square'],
        [1100, 0.15, 'square'],
        [1320, 0.2, 'square'],
        [880, 0.25, 'square'],
        [1760, 0.33, 'sine'],
        [880, 0.35, 'sine'],
      ];
      seq.forEach(([freq, t, type]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = type;
        osc.frequency.value = freq;
        const s = ctx.currentTime + t;
        g.gain.setValueAtTime(0.07, s);
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.04);
        osc.start(s);
        osc.stop(s + 0.05);
      });
    }

    if (type === 'error') {
      [320, 260, 210].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const s = ctx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.1, s);
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.08);
        osc.start(s);
        osc.stop(s + 0.09);
      });
    }

    if (type === 'success') {
      [440, 554, 659, 880, 1108].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const s = ctx.currentTime + i * 0.07;
        g.gain.setValueAtTime(0.09, s);
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.35);
        osc.start(s);
        osc.stop(s + 0.36);
      });
    }
  } catch {
    /* noop */
  }
}

interface Props {
  onClose: () => void;
}

export function HackerModal({ onClose }: Props) {
  const alreadyUnlocked = localStorage.getItem(STORAGE_KEY) === '1';
  const [phase, setPhase] = useState<Phase>(alreadyUnlocked ? 'unlocked' : 'lock');
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    playSound(alreadyUnlocked ? 'success' : 'open');
    inputRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === SECRET) {
      localStorage.setItem(STORAGE_KEY, '1');
      setPhase('success');
      playSound('success');
      setTimeout(onClose, 1800);
    } else {
      setPhase('error');
      playSound('error');
      setPassword('');
      setTimeout(() => setPhase('lock'), 900);
    }
  }

  const isSuccess = phase === 'success' || phase === 'unlocked';
  const isError = phase === 'error';

  return (
    <div
      className="hkr-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={['hkr-modal', isError && 'hkr-modal--error', isSuccess && 'hkr-modal--success']
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* halftone overlay */}
        <div className="hkr-halftone" aria-hidden />

        {/* gif com glitch Spider-Verse */}
        <div className="hkr-symbol" aria-hidden>
          <div className="hkr-speedlines" aria-hidden />
          <div className="hkr-gif-wrap">
            <img
              className="hkr-gif"
              src="https://media1.tenor.com/m/hUBXfYvvOlUAAAAd/sus-suspicious.gif"
              alt="sus"
              draggable={false}
            />
          </div>
        </div>

        <p
          className={`hkr-label ${isError ? 'hkr-label--err' : ''} ${isSuccess ? 'hkr-label--ok' : ''}`}
        >
          {phase === 'error' && 'ACESSO NEGADO'}
          {phase === 'success' && 'ACESSO CONCEDIDO'}
          {phase === 'unlocked' && 'SISTEMA LIBERADO'}
          {phase === 'lock' && 'Não era nem pra tu clicar aq man...tu é especialzinho é!?'}
        </p>

        {!isSuccess && (
          <form className="hkr-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={`hkr-input ${isError ? 'hkr-input--err' : ''}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="off"
              spellCheck={false}
              disabled={isError}
            />
            <button className="hkr-btn" type="submit" disabled={isError}>
              EXECUTE
            </button>
          </form>
        )}

        {isSuccess && (
          <div className="hkr-success-icon" aria-hidden>
            ✓
          </div>
        )}
      </div>
    </div>
  );
}
