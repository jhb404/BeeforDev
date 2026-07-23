import { BrowserWindow } from 'electron';
import crypto from 'node:crypto';
import { getBeeforAppUrl } from '../../shared/constants';
import { logger } from '../logger';

/**
 * Login com Google — mesmo fluxo do webapp, agora com UX limpa no Electron.
 *
 * Por quê assim: o webapp usa Google Identity Services (popup GIS), validado por
 * "JavaScript origin" (app.beefor.io), NÃO por redirect_uri. OAuth nativo direto no
 * Electron dá `redirect_uri_mismatch` (loopback não autorizado no client Web, e não
 * temos acesso ao Google Cloud Console). O único jeito sem Console é rodar o GIS numa
 * página servida pela origin autorizada (app.beefor.io).
 *
 * Então abrimos app.beefor.io/login numa janela isolada, mas:
 *   1. injetamos uma tela limpa que mostra SÓ o botão "Entrar com Google" (esconde o
 *      formulário do site) — resolve a UX de "abre a página inteira do Beefor";
 *   2. hookamos o XMLHttpRequest da página p/ capturar a RESPOSTA de
 *      /Token/LoginComGoogle e emitir via console-message — robusto e imune à
 *      navegação que o site faz após logar (antes era CDP getResponseBody, frágil).
 *
 * A resposta é a mesma sessão do login normal; o handler chama applyGoogleSession.
 */

/** Shape da sessão retornada por /Token/LoginComGoogle (mesmo do login normal). */
export type GoogleLoginSession = Record<string, unknown>;

/** Conta Google não cadastrada no Beefor — mensagem amigável pro usuário. */
export class BeeforNoGoogleAccountError extends Error {
  constructor(message = 'Você não possui uma conta Google no Beefor.') {
    super(message);
    this.name = 'BeeforNoGoogleAccountError';
  }
}

/** Sentinela usada pelo script injetado p/ mandar o resultado via console-message. */
const RESULT_PREFIX = '__BEEFOR_GOOGLE__';

function loginUrl(): string {
  return `${getBeeforAppUrl()}/login`;
}

/** A resposta vem double-wrapped Ok(Ok(vm)): { value: {...} } — desembrulha. */
function unwrapResponse(raw: string): GoogleLoginSession | null {
  try {
    let obj: any = JSON.parse(raw);
    if (typeof obj === 'string') obj = JSON.parse(obj);
    // Ok(Ok(vm)) → { value: { value: {...} } } ou { value: {...} }
    while (obj && typeof obj === 'object' && obj.value && !obj.token) {
      obj = obj.value;
    }
    if (obj && typeof obj === 'object' && (obj.token || obj.idPessoa)) {
      return obj as GoogleLoginSession;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Script injetado na página de login (roda no main world via executeJavaScript).
 * 1) Hooka XHR/fetch p/ capturar a resposta de /Token/LoginComGoogle.
 * 2) Monta overlay limpo com o botão Google; ao clicar, aciona o botão real do site.
 *
 * IMPORTANTE: sem template-literal `${}` aqui dentro — é uma string JS crua.
 */
const INJECTED_SCRIPT = `(function () {
  if (window.__beeforHooked) return;
  window.__beeforHooked = true;

  var PREFIX = '${RESULT_PREFIX}';
  var TARGET = '/Token/LoginComGoogle';
  var sent = false;

  function isTarget(u) { return typeof u === 'string' && u.indexOf(TARGET) > -1; }
  function emit(status, body) {
    if (sent) return;
    sent = true;
    try { console.log(PREFIX + JSON.stringify({ status: status, body: body })); } catch (e) {}
  }

  // Angular HttpClient usa XMLHttpRequest.
  try {
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) { this.__bfUrl = u; return _open.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function () {
      var self = this;
      if (isTarget(self.__bfUrl)) {
        self.addEventListener('loadend', function () {
          try { emit(self.status, self.responseText); } catch (e) { emit(self.status || 0, ''); }
        });
      }
      return _send.apply(this, arguments);
    };
  } catch (e) {}

  // fetch como fallback.
  try {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      var url = (typeof input === 'string') ? input : (input && input.url);
      var p = _fetch.apply(this, arguments);
      if (isTarget(url)) {
        p.then(function (res) {
          try { res.clone().text().then(function (t) { emit(res.status, t); }).catch(function () {}); } catch (e) {}
        }).catch(function () {});
      }
      return p;
    };
  } catch (e) {}

  var OVERLAY_ID = '__bf_overlay';
  var BTN_STYLE = 'display:inline-flex;align-items:center;background:#fff;color:#3c4043;border:none;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.45);transition:filter .15s;';
  var G_SVG = '<svg width="18" height="18" viewBox="0 0 48 48" style="margin-right:10px">'
    + '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>'
    + '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>'
    + '<path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"/>'
    + '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C41.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>'
    + '</svg>';

  function buildOverlay() {
    if (sent) return;
    if (document.getElementById(OVERLAY_ID)) return;
    if (!document.documentElement) return;

    var ov = document.createElement('div');
    ov.id = OVERLAY_ID;
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#0f1115;color:#e7e9ee;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;';

    var title = document.createElement('div');
    title.textContent = 'Entrar no Beefor';
    title.style.cssText = 'font-size:20px;font-weight:600;';

    var sub = document.createElement('div');
    sub.textContent = 'Use sua conta Google';
    sub.style.cssText = 'font-size:13px;opacity:.6;margin-bottom:18px;';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = G_SVG + '<span>Entrar com Google</span>';
    btn.style.cssText = BTN_STYLE;

    var msg = document.createElement('div');
    msg.style.cssText = 'font-size:12px;opacity:.65;min-height:16px;margin-top:16px;';

    btn.addEventListener('click', function () {
      msg.textContent = 'Conectando…';
      var attempts = 0;
      (function tryClick() {
        var real = document.querySelector('button.btn-google');
        if (real) { msg.textContent = 'Abrindo o Google…'; real.click(); return; }
        if (attempts++ < 24) { setTimeout(tryClick, 250); return; }
        // Markup do site mudou — mostra a página real como fallback.
        msg.textContent = '';
        ov.remove();
      })();
    });

    ov.appendChild(title);
    ov.appendChild(sub);
    ov.appendChild(btn);
    ov.appendChild(msg);
    document.documentElement.appendChild(ov);
  }

  buildOverlay();
  // Reconstrói se o Angular reescrever o DOM (overlay é filho de <html>, sobrevive a troca de <body>).
  var ticks = 0;
  var iv = setInterval(function () {
    if (sent || ticks++ > 120) { clearInterval(iv); return; }
    buildOverlay();
  }, 400);
})();`;

export async function signInWithGoogle(parent: BrowserWindow | null): Promise<GoogleLoginSession> {
  const partition = `google-login-${crypto.randomBytes(6).toString('hex')}`;

  const authWindow = new BrowserWindow({
    width: 480,
    height: 620,
    parent: parent ?? undefined,
    modal: !!parent,
    show: true,
    autoHideMenuBar: true,
    title: 'Entrar com Google',
    backgroundColor: '#0f1115',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition,
    },
  });

  // Permite o popup OAuth do Google (window.open) abrir como janela filha.
  authWindow.webContents.setWindowOpenHandler(() => ({ action: 'allow' }));

  return new Promise<GoogleLoginSession>((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
      if (!authWindow.isDestroyed()) authWindow.close();
    };

    const inject = () => {
      if (settled || authWindow.isDestroyed()) return;
      authWindow.webContents.executeJavaScript(INJECTED_SCRIPT, true).catch((err) => {
        logger.warn(`google: injeção falhou: ${err instanceof Error ? err.message : String(err)}`);
      });
    };

    // (Re)injeta a cada carga/navegação do frame principal.
    authWindow.webContents.on('did-finish-load', inject);
    authWindow.webContents.on('did-navigate', inject);

    // O script emite o resultado da captura via console-message (imune à navegação).
    authWindow.webContents.on('console-message', (_event, _level, message) => {
      if (settled || typeof message !== 'string' || message.indexOf(RESULT_PREFIX) !== 0) return;
      let payload: { status?: number; body?: string };
      try {
        payload = JSON.parse(message.slice(RESULT_PREFIX.length));
      } catch {
        return;
      }
      const status = Number(payload.status) || 0;
      // 401/403/404 = conta Google não cadastrada; 200 sem token = conta sem acesso/org.
      if (status === 401 || status === 403 || status === 404) {
        logger.info(`google: LoginComGoogle retornou ${status} → conta não cadastrada.`);
        finish(() => reject(new BeeforNoGoogleAccountError()));
        return;
      }
      const session = unwrapResponse(String(payload.body ?? ''));
      if (session) {
        logger.info('google: sessão capturada da resposta do site.');
        finish(() => resolve(session));
      } else {
        logger.warn('google: resposta de LoginComGoogle sem token → conta não cadastrada.');
        finish(() => reject(new BeeforNoGoogleAccountError()));
      }
    });

    authWindow.on('closed', () => {
      if (!settled) {
        settled = true;
        reject(new Error('Janela do Google fechada antes de concluir o login.'));
      }
    });

    void authWindow.loadURL(loginUrl()).catch((err) => {
      finish(() => reject(err instanceof Error ? err : new Error(String(err))));
    });
  });
}
