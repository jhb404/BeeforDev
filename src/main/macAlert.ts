import { BrowserWindow, screen } from 'electron';
import fs from 'node:fs';
import { getBuildAssetPath } from './window';

const ALERT_W = 320;
const ALERT_H = 76;
const SHOW_MS = 4500;
const ANIM_OUT_MS = 350;

let queue: Array<{ title: string; body: string }> = [];
let active: BrowserWindow | null = null;
let _iconUri = '';

function iconUri(): string {
  if (_iconUri) return _iconUri;
  try {
    const buf = fs.readFileSync(getBuildAssetPath('icon-32.png'));
    _iconUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    _iconUri = '';
  }
  return _iconUri;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:${ALERT_H}px;background:transparent;overflow:hidden;-webkit-user-select:none}
.w{
  height:${ALERT_H}px;display:flex;align-items:center;gap:12px;
  padding:12px 16px;
  background:rgba(28,28,30,0.9);
  backdrop-filter:blur(24px) saturate(180%);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  border-radius:16px;
  border:1px solid rgba(255,255,255,0.1);
  box-shadow:0 6px 20px rgba(0,0,0,0.4);
  font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  color:#fff;
  transform:translateY(-${ALERT_H}px);
  animation:drop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.w.out{animation:rise ${ANIM_OUT_MS}ms ease-in forwards}
@keyframes drop{to{transform:translateY(0)}}
@keyframes rise{to{transform:translateY(-${ALERT_H}px)}}
.ico{flex-shrink:0;line-height:1}
.ico img{width:28px;height:28px;border-radius:6px;display:block}
.txt{min-width:0}
.ttl{font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bod{font-size:12px;opacity:.72;margin-top:2px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style></head><body>
<div class="w" id="w">
  <div class="ico">${iconUri() ? `<img src="${iconUri()}" />` : '🐝'}</div>
  <div class="txt">
    <div class="ttl">${esc(title)}</div>
    ${body ? `<div class="bod">${esc(body)}</div>` : ''}
  </div>
</div>
</body></html>`;
}

export function showMacAlert(title: string, body: string): void {
  if (active && !active.isDestroyed()) {
    queue.push({ title, body });
    return;
  }

  const { bounds, workArea } = screen.getPrimaryDisplay();
  const x = Math.round(bounds.x + (bounds.width - ALERT_W) / 2);
  const y = workArea.y;

  const win = new BrowserWindow({
    x,
    y,
    width: ALERT_W,
    height: ALERT_H,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    show: false,
    hasShadow: false,
     
    type: 'panel' as any,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  active = win;
  win.setAlwaysOnTop(true, 'floating');

  void win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(buildHtml(title, body)));

  win.once('ready-to-show', () => {
    win.showInactive();

    setTimeout(() => {
      if (win.isDestroyed()) return;
      win.webContents
        .executeJavaScript(`document.getElementById('w').classList.add('out')`)
        .catch(() => {});
      setTimeout(() => {
        if (!win.isDestroyed()) win.close();
      }, ANIM_OUT_MS + 50);
    }, SHOW_MS);
  });

  win.on('closed', () => {
    active = null;
    const next = queue.shift();
    if (next) showMacAlert(next.title, next.body);
  });
}
