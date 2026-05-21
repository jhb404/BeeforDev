import crypto from 'node:crypto';

/**
 * Replica o RequestInterceptor do front goobeeteams (request.interceptor.ts + rsa.service.ts).
 *
 * Para POST/PUT em `baseUrl` (não-FormData), o backend exige:
 *  - body = AES-128-CBC(PKCS7) do JSON, key=iv = string numérica de 16 dígitos
 *  - header `X-Encryption-Key` = base64(RSA_PKCS1_v1_5(chaveNumerica))
 *
 * Chave pública RSA: copiada de rsa.service.ts.
 */

const RSA_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIS8UybkTYYjNjj34NMc
AIPyITVyhUj3H/qG2jjseNXBhHO+vJz70hARMW6Z4aHsTkUGkOFZ5RYq5GckBkze
3ldxZvRBl1Vm5FHed3SAzfJX4ho3a9UZjjvSPoCTY5FFiCUJn7O3GQJzkDpw7VQt
5C72wePFqkh9e+QyqGahrGXa8UNorg7QrQjuJMl8LbvhTn5MGDHxI8ni8ZIm7Umq
79NEwVpjS4TXmmJYNLhIkM8c30sohsfGNGLrwCMgvQZJCtx6pL/Jh8Ma96g5s9VX
BNy2GpNERboJ/ZIH2X4GrmeEFKdukVQSvsGsy0ZHo+Ebpqyvo1iFXoVWK4UYA3zh
3QIDAQAB
-----END PUBLIC KEY-----`;

function generate16DigitKey(): string {
  let n = '';
  while (n.length < 16) {
    n += Math.floor(Math.random() * 10).toString();
  }
  return n;
}

/** AES-128-CBC PKCS7. key=iv = bytes UTF-8 da string de 16 dígitos. */
function aesEncrypt(plaintext: string, key16: string): string {
  const keyBuf = Buffer.from(key16, 'utf-8'); // 16 bytes → AES-128
  const ivBuf = Buffer.from(key16, 'utf-8');
  const cipher = crypto.createCipheriv('aes-128-cbc', keyBuf, ivBuf);
  let encrypted = cipher.update(plaintext, 'utf-8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted; // CryptoJS .toString() devolve base64
}

/** RSA encrypt PKCS#1 v1.5 (default node-forge), saída base64. */
function rsaEncryptKey(key16: string): string {
  const encrypted = crypto.publicEncrypt(
    {
      key: RSA_PUBLIC_KEY_PEM,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(key16, 'utf-8'),
  );
  // front faz window.btoa(rsa.encrypt(...)) — rsa.encrypt devolve bytes binários,
  // btoa transforma em base64. crypto.publicEncrypt já devolve Buffer → base64 direto.
  return encrypted.toString('base64');
}

export interface EncryptedRequest {
  body: string;
  headers: Record<string, string>;
}

/**
 * Cripto body p/ baseUrl POST/PUT. Retorna body AES + header X-Encryption-Key.
 */
export function encryptBeeforBody(payload: unknown): EncryptedRequest {
  const json = JSON.stringify(payload);
  const key16 = generate16DigitKey();
  const encryptedBody = aesEncrypt(json, key16);
  const encKeyHeader = rsaEncryptKey(key16);
  return {
    body: encryptedBody,
    headers: { 'X-Encryption-Key': encKeyHeader },
  };
}
