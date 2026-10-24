// Nomes e assinatura dos cookies de sessão/CSRF — plan.md §Nomenclatura e research.md §7.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'drivo_session';
const DEV_CSRF_COOKIE_NAME = 'drivo_csrf';
const SECURE_CSRF_COOKIE_NAME = '__Host-drivo_csrf';

/**
 * `__Host-` só faz sentido com `Secure` (P-06): em `http://localhost` o cookie
 * é `drivo_csrf`; com HTTPS/produção vira `__Host-drivo_csrf`.
 */
export function csrfCookieName(secure: boolean): string {
  return secure ? SECURE_CSRF_COOKIE_NAME : DEV_CSRF_COOKIE_NAME;
}

/** Valor do cookie: `<nonce>.<HMAC-SHA256(CSRF_SECRET, nonce + '.' + jti)>`. */
export function createCsrfToken(nonce: string, jti: string, secret: string): string {
  return `${nonce}.${sign(nonce, jti, secret)}`;
}

export function isValidCsrfToken(token: string, jti: string, secret: string): boolean {
  const separator = token.indexOf('.');
  if (separator <= 0) {
    return false;
  }

  const nonce = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  return safeEqual(signature, sign(nonce, jti, secret));
}

/** Comparação em tempo constante, tolerante a tamanhos diferentes. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

function sign(nonce: string, jti: string, secret: string): string {
  return createHmac('sha256', secret).update(`${nonce}.${jti}`).digest('base64url');
}
