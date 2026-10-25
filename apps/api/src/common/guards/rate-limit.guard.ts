// Rate limit por IP com janela deslizante e limites configuráveis.
// O guard próprio oferece janela deslizante por IP, limite global e overrides
// por chave de configuração, mantendo o comportamento testável no runner ESM.
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';

/** Carimbo por rota: limita pelo valor da env informada (ex.: AUTH_THROTTLE_LIMIT). */
export const RATE_LIMIT_ENV_KEY = 'rate-limit-env-key';

export function RateLimitEnv(configKey: string): MethodDecorator & ClassDecorator {
  return SetMetadata(RATE_LIMIT_ENV_KEY, configKey);
}

interface Entry {
  hits: number[];
}

export interface LimiterRequest {
  method: string;
  ip?: string;
  headers: Record<string, unknown>;
  url: string;
  socket?: { remoteAddress?: string };
}

@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly windowTtlMs: number;
  private readonly globalLimit: number;
  private readonly entries = new Map<string, Entry>();
  private cleanupTimer: NodeJS.Timeout;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {
    this.windowTtlMs = this.config.getOrThrow<number>('THROTTLE_TTL_MS');
    this.globalLimit = this.config.getOrThrow<number>('THROTTLE_LIMIT');
    this.cleanupTimer = setInterval(() => this.cleanup(), this.windowTtlMs);
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<LimiterRequest>();

    const envKey = this.reflector.getAllAndOverride<string>(RATE_LIMIT_ENV_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Rotas com override têm bucket próprio; sem override, conta no balde global de IP.
    const limit = envKey
      ? this.config.getOrThrow<number>(envKey)
      : this.globalLimit;
    const bucket = envKey ? (`rota:${envKey}` as const) : ('global' as const);
    const key = `${clientIp(request)}:${bucket}`;

    const response = context.switchToHttp().getResponse<Response>();

    if (!this.admit(key, limit)) {
      const oldest = this.entries.get(key)?.hits[0] ?? Date.now();
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + this.windowTtlMs - Date.now()) / 1000),
      );
      response.setHeader('Retry-After', retryAfterSeconds);

      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Muitas tentativas. Tente novamente em instantes.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /** Janela deslizante: guarda o instante de cada hit e poda o que expirou. */
  private admit(key: string, limit: number): boolean {
    const now = Date.now();
    const windowStart = now - this.windowTtlMs;

    const entry = this.entries.get(key) ?? { hits: [] };
    entry.hits = entry.hits.filter((hit) => hit > windowStart);

    if (entry.hits.length >= limit) {
      this.entries.set(key, entry);
      return false;
    }

    entry.hits.push(now);
    this.entries.set(key, entry);
    return true;
  }

  private cleanup(): void {
    const windowStart = Date.now() - this.windowTtlMs;

    for (const [key, entry] of this.entries) {
      if (entry.hits.every((hit) => hit <= windowStart)) {
        this.entries.delete(key);
      }
    }
  }
}

function clientIp(request: LimiterRequest): string {
  return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
}
