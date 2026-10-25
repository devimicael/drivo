// Testes unitários da janela, dos limites, dos buckets e da resposta 429.
// Sem mocks de `jest` global (ESM-VM): stubs manuais e janela curta real.
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  RateLimitEnv,
  RATE_LIMIT_ENV_KEY,
  RateLimitGuard,
  type LimiterRequest,
} from './rate-limit.guard.js';

const WINDOW_MS = 100;

function makeStubs(overrideEnvKey?: string) {
  // Nas rotas reais, `getAllAndOverride` devolve a chave carimbada por
  // `@RateLimitEnv` (ou undefined: recebimento global sem override).
  const reflector = {
    getAllAndOverride: () => overrideEnvKey,
  } as unknown as Reflector;

  const config = {
    getOrThrow: (key: string) => {
      const values: Record<string, unknown> = {
        THROTTLE_TTL_MS: WINDOW_MS,
        THROTTLE_LIMIT: 3,
        AUTH_THROTTLE_LIMIT: 1,
      };
      return values[key];
    },
  } as unknown as ConfigService;

  return { reflector, config };
}

interface ContextStub {
  context: {
    switchToHttp: () => {
      getRequest: () => LimiterRequest;
      getResponse: () => { setHeader: (name: string, value: string | number) => void };
    };
  };
  headers: Array<[string, string | number]>;
}

function makeContext(ip = '203.0.113.9'): ContextStub {
  const headers: Array<[string, string | number]> = [];

  const request: LimiterRequest = {
    method: 'POST',
    ip,
    url: '/auth/login',
    headers: {},
  };

  const context = {
    getHandler: () => 'handler-token',
    getClass: () => 'class-token',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({
        setHeader: (name: string, value: string | number) => {
          headers.push([name, value]);
        },
      }),
    }),
  };

  return { context, headers };
}

function makeGuard(stubs: ReturnType<typeof makeStubs>): RateLimitGuard {
  return new RateLimitGuard(stubs.reflector, stubs.config);
}

describe('RateLimitGuard', () => {
  it('admite até o limite e rejeita o excedente com 429 RATE_LIMITED', () => {
    const stubs = makeStubs();
    const guard = makeGuard(stubs);
    const { context, headers } = makeContext();

    for (let index = 0; index < 3; index += 1) {
      expect(guard.canActivate(context as never)).toBe(true);
    }

    expect(() => guard.canActivate(context as never)).toThrow(/Muitas tentativas/u);
    expect(headers).toEqual([['Retry-After', 1]]);
  });

  it('rota com override tem bucket próprio e não consome o balde global', () => {
    const overrideStubs = makeStubs('AUTH_THROTTLE_LIMIT');
    const overrideGuard = makeGuard(overrideStubs);
    const { context: overrideContext } = makeContext();

    expect(overrideGuard.canActivate(overrideContext as never)).toBe(true);
    expect(() => overrideGuard.canActivate(overrideContext as never)).toThrow();

    const globalStubs = makeStubs();
    const globalGuard = makeGuard(globalStubs);
    const { context: globalContext } = makeContext('203.0.113.10');
    expect(globalGuard.canActivate(globalContext as never)).toBe(true);
  });

  it('IPs distintos não compartilham o balde', () => {
    const stubs = makeStubs();
    const guard = makeGuard(stubs);

    for (let index = 0; index < 3; index += 1) {
      guard.canActivate(makeContext('198.51.100.1').context as never);
    }

    expect(guard.canActivate(makeContext('198.51.100.2').context as never)).toBe(true);
  });

  it('a janela deslizante expira e volta a admitir', async () => {
    const stubs = makeStubs();
    const guard = makeGuard(stubs);
    const { context } = makeContext();

    for (let index = 0; index < 3; index += 1) {
      guard.canActivate(context as never);
    }
    expect(() => guard.canActivate(context as never)).toThrow();

    await new Promise((resolve) => setTimeout(resolve, WINDOW_MS + 60));

    expect(guard.canActivate(context as never)).toBe(true);
  });
});

describe('RateLimitEnv', () => {
  it('carimba a chave de configuração no handler (usada pelo guard)', () => {
    class FakeController {
      method(): void {}
    }

    const descriptor = Object.getOwnPropertyDescriptor(FakeController.prototype, 'method');
    expect(descriptor).toBeDefined();
    if (!descriptor) {
      return;
    }

    RateLimitEnv('AUTH_THROTTLE_LIMIT')(FakeController.prototype, 'method', descriptor);

    expect(
      Reflect.getMetadata(RATE_LIMIT_ENV_KEY, descriptor.value),
    ).toBe('AUTH_THROTTLE_LIMIT');
  });
});
