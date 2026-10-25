// `COOKIE_SECURE` explícito vence o padrão; sem a env, production liga Secure.
import { resolveSecureCookies } from './cookies.js';

describe('resolveSecureCookies', () => {
  it('usa Secure por padrão em production', () => {
    expect(resolveSecureCookies(undefined, 'production')).toBe(true);
  });

  it('desliga Secure fora de production por padrão', () => {
    expect(resolveSecureCookies(undefined, 'development')).toBe(false);
    expect(resolveSecureCookies(undefined, 'test')).toBe(false);
  });

  it('respeita a env explícita nos dois sentidos', () => {
    // Compose de avaliação serve http://localhost: cookie sem Secure.
    expect(resolveSecureCookies(false, 'production')).toBe(false);
    expect(resolveSecureCookies(true, 'development')).toBe(true);
  });
});
