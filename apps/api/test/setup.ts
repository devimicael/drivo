// Ambiente isolado dos testes e2e — real PostgreSQL (`drivo_test`), nunca SQLite.
// Roda como `setupFiles` antes de qualquer import de módulo (jest-e2e.json).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://drivo:drivo@localhost:5433/drivo_test?schema=public';
process.env.JWT_SECRET = 'teste-jwt-secret-com-32-caracteres!!';
process.env.CSRF_SECRET = 'teste-csrf-secret-com-32-caracteres!';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.COOKIE_SECURE = 'false';
// Mesmo com chave local configurada, a suíte determinística nunca usa o Gemini real.
process.env.GOOGLE_API_KEY = '';
// A suíte dispara várias tentativas seguidas em /auth/*: eleva os limites para
// que o rate limiter não transforme casos de teste em 429.
process.env.THROTTLE_LIMIT = '1000';
process.env.AUTH_THROTTLE_LIMIT = '50';
