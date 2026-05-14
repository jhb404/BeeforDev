import { BrowserWindow } from 'electron';
import { getBuildIconPath } from './window';

type LogoVariant = 'orange' | 'purple';

const MIN_SPLASH_MS = 5000;
const FADE_MS = 260;

let createdAt = 0;
let playedBootSound = false;

function startupLogoSvg(): string {
  return `<svg class="logo-svg" viewBox="0 0 1024 1024" aria-hidden="true">
    <path class="logo-wing logo-wing--top-left" d="M46.6971 315.833V484.735L184.341 568.226L321.984 484.735V315.833L184.341 232.34L46.6971 315.833Z" stroke="currentColor" stroke-width="44" fill="none"/>
    <path class="logo-wing logo-wing--bottom-left" d="M325.647 629.812V696.823L272.097 729.347L218.548 696.823V629.812L272.097 597.289L325.647 629.812Z" stroke="currentColor" stroke-width="44" fill="none"/>
    <path class="logo-wing logo-wing--top-right" d="M977.303 315.833V484.735L839.659 568.226L702.016 484.735V315.833L839.659 232.34L977.303 315.833Z" stroke="currentColor" stroke-width="44" fill="none"/>
    <path class="logo-wing logo-wing--bottom-right" d="M805.452 629.812V696.823L751.903 729.347L698.353 696.823V629.812L751.903 597.289L805.452 629.812Z" stroke="currentColor" stroke-width="44" fill="none"/>
    <g class="logo-core">
      <path d="M662.093 750.788H361.907V273.242H662.093V750.788ZM395.573 695.058H627.493V622.994H395.573V695.058ZM395.573 511.535V583.598H627.493V511.535H395.573ZM395.573 472.139H627.493V400.075H395.573V472.139Z" fill="currentColor"/>
      <path d="M361.412 750.818H662.588L512 843.654L361.412 750.818Z" fill="currentColor"/>
      <path d="M662.588 273.836L361.412 273.836L512 181L662.588 273.836Z" fill="currentColor"/>
    </g>
  </svg>`;
}

function splashHtml(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #080b10;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      display: grid;
      place-items: center;
      animation: bodyIn 420ms cubic-bezier(.2,.8,.2,1) both;
    }
    .stage {
      position: relative;
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 50% 44%, rgba(255,148,0,.08), transparent 30%),
        linear-gradient(145deg, #0c1119 0%, #07090d 48%, #10141d 100%);
    }
    .stage::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, transparent 0 48%, rgba(255,148,0,.08) 50%, transparent 52%),
        repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 12px);
      mask-image: radial-gradient(circle at center, black, transparent 72%);
      opacity: .26;
      animation: gridDrift 4s linear infinite;
    }
    .mark {
      position: relative;
      width: 212px;
      height: 212px;
      display: grid;
      place-items: center;
      isolation: isolate;
      transform: translateZ(0);
    }
    .ring {
      position: absolute;
      inset: 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,148,0,.22);
      box-shadow: 0 0 24px rgba(255,148,0,.08), inset 0 0 18px rgba(255,148,0,.04);
      animation: ring 2.4s ease-in-out infinite;
    }
    .logo-svg {
      position: relative;
      z-index: 2;
      width: 188px;
      height: 188px;
      color: #ff9400;
      filter: drop-shadow(0 0 12px rgba(255,148,0,.22)) drop-shadow(0 16px 34px rgba(0,0,0,.52));
      animation: logoAlive 2.2s ease-in-out infinite;
      will-change: transform, filter;
      overflow: visible;
    }
    .logo-wing {
      transform-box: fill-box;
      filter: drop-shadow(0 0 7px rgba(255,148,0,.2));
      will-change: transform, opacity, filter;
    }
    .logo-wing--top-left {
      transform-origin: center;
      animation: wingTopLeft 3.8s cubic-bezier(.22,.75,.2,1) infinite;
    }
    .logo-wing--top-right {
      transform-origin: center;
      animation: wingTopRight 3.8s cubic-bezier(.22,.75,.2,1) infinite;
    }
    .logo-wing--bottom-left {
      transform-origin: center;
      animation: wingBottomLeft 3.8s cubic-bezier(.22,.75,.2,1) .58s infinite;
    }
    .logo-wing--bottom-right {
      transform-origin: center;
      animation: wingBottomRight 3.8s cubic-bezier(.22,.75,.2,1) .58s infinite;
    }
    .logo-core {
      animation: corePulse 2.2s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .messages {
      position: absolute;
      left: 50%;
      bottom: 72px;
      width: 260px;
      height: 22px;
      transform: translateX(-50%);
      color: rgba(240,244,248,.76);
      font-size: 12px;
      font-weight: 650;
      letter-spacing: .03em;
      text-align: center;
    }
    .msg {
      position: absolute;
      inset: 0;
      opacity: 0;
      transform: translateY(6px);
      animation: msgCycle 6s ease infinite;
    }
    .msg:nth-child(2) { animation-delay: 2s; }
    .msg:nth-child(3) { animation-delay: 4s; }
    }
    .caption {
      position: absolute;
      bottom: 44px;
      left: 0;
      right: 0;
      text-align: center;
      color: rgba(240,244,248,.68);
      font-size: 11px;
      font-weight: 650;
      letter-spacing: .22em;
      text-transform: uppercase;
    }
    body.closing { animation: bodyOut ${FADE_MS}ms ease forwards; }
    @keyframes bodyIn { from { opacity: 0; transform: scale(.985); } to { opacity: 1; transform: scale(1); } }
    @keyframes bodyOut { to { opacity: 0; transform: scale(1.015); } }
    @keyframes logoAlive {
      0%,100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 10px rgba(255,148,0,.2)) drop-shadow(0 16px 34px rgba(0,0,0,.52)); }
      50% { transform: translateY(-2px) scale(1.008); filter: drop-shadow(0 0 16px rgba(255,148,0,.3)) drop-shadow(0 18px 38px rgba(0,0,0,.58)); }
    }
    @keyframes wingTopLeft {
      0%,100% { transform: rotate(0deg) translateX(0); opacity: .88; }
      46%,66% { transform: rotate(360deg) translateX(-10px); opacity: 1; }
    }
    @keyframes wingTopRight {
      0%,100% { transform: rotate(0deg) translateX(0); opacity: .88; }
      46%,66% { transform: rotate(360deg) translateX(10px); opacity: 1; }
    }
    @keyframes wingBottomLeft {
      0%,100% { transform: rotate(0deg) translateX(0); opacity: .82; }
      46%,66% { transform: rotate(360deg) translateX(-7px); opacity: 1; }
    }
    @keyframes wingBottomRight {
      0%,100% { transform: rotate(0deg) translateX(0); opacity: .82; }
      46%,66% { transform: rotate(360deg) translateX(7px); opacity: 1; }
    }
    @keyframes corePulse {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.012); }
    }
    @keyframes ring { 0%,100% { transform: scale(.94); opacity: .36; } 50% { transform: scale(1.04); opacity: .9; } }
    @keyframes msgCycle {
      0%, 18% { opacity: 0; transform: translateY(6px); }
      28%, 58% { opacity: 1; transform: translateY(0); }
      70%, 100% { opacity: 0; transform: translateY(-6px); }
    }
    @keyframes gridDrift { to { transform: translateY(12px); } }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; }
    }
  </style>
</head>
<body>
  <main class="stage">
    <section class="mark" aria-label="Beefor U carregando">
      <div class="ring"></div>
      ${startupLogoSvg()}
    </section>
    <div class="caption">Beefor U</div>
  </main>
  <script>
    window.beeforCloseSplash = function () {
      document.body.classList.add('closing');
      setTimeout(function () { window.close(); }, ${FADE_MS});
    };
    window.beeforPlayStartup = function () {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        var a = new Ctx();
        var s = a.currentTime + 0.06;

        // Master limiter via gain to prevent peaking
        var master = a.createGain();
        master.gain.value = 0.85;
        master.connect(a.destination);

        // Soft reverb-ish using delay + feedback
        var delay = a.createDelay();
        delay.delayTime.value = 0.08;
        var feedback = a.createGain();
        feedback.gain.value = 0.18;
        var wet = a.createGain();
        wet.gain.value = 0.22;
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wet);
        wet.connect(master);

        function note(freq, t, dur, gain, type, glide) {
          var o = a.createOscillator();
          var g = a.createGain();
          o.type = type || 'sine';
          o.frequency.setValueAtTime(freq * (glide ? 0.985 : 1), s + t);
          if (glide) {
            o.frequency.exponentialRampToValueAtTime(freq, s + t + 0.05);
          }
          g.gain.setValueAtTime(0.0001, s + t);
          g.gain.exponentialRampToValueAtTime(gain, s + t + 0.018);
          g.gain.exponentialRampToValueAtTime(0.0001, s + t + dur);
          o.connect(g);
          g.connect(master);
          g.connect(delay);
          o.start(s + t);
          o.stop(s + t + dur + 0.05);
        }

        // Cmaj7 arpeggio rising — soft sine plucks with glide
        // C5 E5 G5 B5 D6 ascending — Mario underwater theme vibe
        note(523.25, 0.00, 0.18, 0.18, 'sine', true);   // C5
        note(659.25, 0.09, 0.18, 0.18, 'sine', true);   // E5
        note(783.99, 0.18, 0.20, 0.20, 'sine', true);   // G5
        note(987.77, 0.27, 0.22, 0.22, 'sine', true);   // B5
        note(1174.66, 0.36, 0.55, 0.24, 'sine', true);  // D6 — held

        // Warm pad layer — triangle held chord (C + G)
        note(261.63, 0.10, 0.80, 0.10, 'triangle', false);  // C4
        note(392.00, 0.10, 0.80, 0.09, 'triangle', false);  // G4

        // Bell sparkle — high sine ding at peak
        note(2349.32, 0.40, 0.40, 0.05, 'sine', false);   // D7
        note(3135.96, 0.46, 0.30, 0.035, 'sine', false);  // G7

        // Sub-bass gentle thud at start
        var sub = a.createOscillator();
        var subG = a.createGain();
        sub.type = 'sine';
        sub.frequency.value = 65.41; // C2
        subG.gain.setValueAtTime(0.0001, s);
        subG.gain.exponentialRampToValueAtTime(0.18, s + 0.04);
        subG.gain.exponentialRampToValueAtTime(0.0001, s + 0.45);
        sub.connect(subG);
        subG.connect(master);
        sub.start(s);
        sub.stop(s + 0.5);

        setTimeout(function () { a.close().catch(function(){}); }, 1400);
      } catch (_) {}
    };
  </script>
</body>
</html>`;
}

export function createStartupSplash(variant: LogoVariant): BrowserWindow {
  createdAt = Date.now();
  playedBootSound = false;
  const splash = new BrowserWindow({
    width: 520,
    height: 420,
    resizable: false,
    movable: true,
    frame: false,
    show: false,
    transparent: false,
    backgroundColor: '#080b10',
    autoHideMenuBar: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    icon: getBuildIconPath(variant),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  splash.once('ready-to-show', () => {
    if (splash.isDestroyed()) return;
    splash.show();
    splash.center();
    if (!playedBootSound) {
      playedBootSound = true;
      void splash.webContents
        .executeJavaScript('window.beeforPlayStartup?.()', true)
        .catch(() => undefined);
    }
  });

  void splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml())}`);
  return splash;
}

export async function closeStartupSplash(splash: BrowserWindow | null): Promise<void> {
  if (!splash || splash.isDestroyed()) return;
  const elapsed = Date.now() - createdAt;
  if (elapsed < MIN_SPLASH_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS - elapsed));
  }
  if (splash.isDestroyed()) return;
  await splash.webContents
    .executeJavaScript('window.beeforCloseSplash?.()', true)
    .catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, FADE_MS + 40));
  if (!splash.isDestroyed()) splash.destroy();
}
