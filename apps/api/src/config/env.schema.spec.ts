import { envSchema, parseEnv } from './env.schema.js';

const MINIMAL_ENV = {
  DATABASE_URL: 'postgresql://drivo:drivo@localhost:5433/drivo?schema=public',
  JWT_SECRET: 'a'.repeat(32),
  CSRF_SECRET: 'b'.repeat(32),
};

describe('envSchema', () => {
  it('aceita o ambiente mínimo e aplica os defaults', () => {
    const env = parseEnv(MINIMAL_ENV);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
    expect(env.JWT_TTL_SECONDS).toBe(3600);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000']);
    expect(env.GOOGLE_API_KEY).toBe('');
    expect(env.THROTTLE_LIMIT).toBe(120);
    expect(env.AUTH_THROTTLE_LIMIT).toBe(5);
  });

  it('recusa o boot sem JWT_SECRET', () => {
    const { JWT_SECRET: _omit, ...withoutJwt } = MINIMAL_ENV;

    expect(() => parseEnv(withoutJwt)).toThrow(/JWT_SECRET/);
  });

  it('recusa JWT_SECRET curto', () => {
    expect(() => parseEnv({ ...MINIMAL_ENV, JWT_SECRET: 'curto' })).toThrow(/JWT_SECRET/);
  });

  it('recusa o boot sem CSRF_SECRET', () => {
    const { CSRF_SECRET: _omit, ...withoutCsrf } = MINIMAL_ENV;

    expect(() => parseEnv(withoutCsrf)).toThrow(/CSRF_SECRET/);
  });

  it('recusa JWT_SECRET e CSRF_SECRET iguais', () => {
    const secret = 'c'.repeat(32);

    expect(() =>
      parseEnv({ ...MINIMAL_ENV, JWT_SECRET: secret, CSRF_SECRET: secret }),
    ).toThrow(/diferente de JWT_SECRET/);
  });

  it('aceita GOOGLE_API_KEY ausente', () => {
    expect(parseEnv(MINIMAL_ENV).GOOGLE_API_KEY).toBe('');
  });

  it('separa CORS_ORIGINS por vírgula e descarta espaços', () => {
    expect(
      parseEnv({
        ...MINIMAL_ENV,
        CORS_ORIGINS: 'http://localhost:3000, http://localhost:4000',
      }).CORS_ORIGINS,
    ).toEqual(['http://localhost:3000', 'http://localhost:4000']);
  });

  it('coage StringEnums e números vindos do processo', () => {
    const parsed = envSchema.parse({
      ...MINIMAL_ENV,
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
      JWT_TTL_SECONDS: '60',
    });

    expect(parsed.NODE_ENV).toBe('production');
    expect(parsed.COOKIE_SECURE).toBe(true);
    expect(parsed.JWT_TTL_SECONDS).toBe(60);
  });
});
