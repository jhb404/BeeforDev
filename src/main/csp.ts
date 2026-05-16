import { session } from 'electron';
import { BEEFOR_API_BASE, BEEFOR_URL, COIN2U_URL } from '../shared/constants';

/**
 * Installs a Content-Security-Policy on the default session for all renderer requests.
 *
 * Dev: relaxes script-src/connect-src to allow Vite HMR on http://localhost:5177.
 * Prod: locks down script-src to 'self' and connect-src to known backends.
 *
 * Why response header (not <meta>): one source of truth, no HTML edit per env,
 * and 'frame-ancestors' is only honored as a header.
 */
export function installCsp(isDev: boolean): void {
  const devOrigins = 'http://localhost:5177 ws://localhost:5177';

  // Packaged renderer loads from file://. Chromium treats file: as a null origin,
  // so 'self' alone does not match same-folder assets — file: must be allow-listed
  // for script/style/img/font/connect.
  const fileScheme = isDev ? '' : 'file:';

  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' ${devOrigins}`
    : `'self' ${fileScheme}`;

  const connectSrc = [
    "'self'",
    BEEFOR_URL,
    BEEFOR_API_BASE,
    COIN2U_URL,
    isDev ? devOrigins : fileScheme,
  ]
    .filter(Boolean)
    .join(' ');

  const styleSrc = isDev
    ? `'self' 'unsafe-inline' ${devOrigins}`
    : `'self' 'unsafe-inline' ${fileScheme}`;
  const imgSrc = `'self' data: blob: https: ${fileScheme}`.trim();
  const fontSrc = `'self' data: ${fileScheme}`.trim();

  const policy = [
    `default-src 'self' ${isDev ? devOrigins : fileScheme}`.trim(),
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `font-src ${fontSrc}`,
    `connect-src ${connectSrc}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'none'`,
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Skip non-renderer protocols (devtools, etc.) so their internal pages keep working.
    const url = details.url || '';
    if (url.startsWith('devtools://')) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy],
      },
    });
  });
}
