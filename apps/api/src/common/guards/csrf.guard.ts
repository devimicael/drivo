// CSRF em duas camadas — research.md §7, T019.
// Camada 1: Origin/Referer/Sec-Fetch-Site em todo método mutável (falha fechada).
// Camada 2: double-submit assinado por HMAC, amarrado ao `jti` do JWT da sessão.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { csrfCookieName, isValidCsrfToken, safeEqual } from '../auth/cookies.js';
import type { AuthenticatedRequest } from '../auth/session-user.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'x-csrf-token';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: string[];
  private readonly csrfSecret: string;
  private readonly secureCookies: boolean;

  constructor(config: ConfigService) {
    this.allowedOrigins = config.getOrThrow<string[]>('CORS_ORIGINS');
    this.csrfSecret = config.getOrThrow<string>('CSRF_SECRET');
    this.secureCookies =
      config.getOrThrow<string>('NODE_ENV') === 'production' ||
      config.getOrThrow<boolean>('COOKIE_SECURE');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    this.assertTrustedOrigin(request);

    // Sem sessão ativa (register/login) não há `jti` para amarrar o HMAC:
    // a Camada 1 continua valendo, a Camada 2 não se aplica (research.md §7.7).
    if (!request.user) {
      return true;
    }

    const cookieToken = request.cookies?.[csrfCookieName(this.secureCookies)];
    const headerToken = request.headers[CSRF_HEADER];

    if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
      throw new ForbiddenException('Requisição não permitida.');
    }

    // Double-submit: o header precisa ecoar exatamente o cookie...
    if (!safeEqual(headerToken, cookieToken)) {
      throw new ForbiddenException('Requisição não permitida.');
    }

    // ...e a assinatura precisa casar com o `jti` da sessão atual.
    if (!isValidCsrfToken(cookieToken, request.user.jti, this.csrfSecret)) {
      throw new ForbiddenException('Requisição não permitida.');
    }

    return true;
  }

  private assertTrustedOrigin(request: AuthenticatedRequest): void {
    const origin = request.headers.origin;
    const referer = request.headers.referer;

    if (origin) {
      if (!this.allowedOrigins.includes(origin)) {
        throw new ForbiddenException('Requisição não permitida.');
      }
    } else if (referer) {
      let refererOrigin: string;
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        throw new ForbiddenException('Requisição não permitida.');
      }
      if (!this.allowedOrigins.includes(refererOrigin)) {
        throw new ForbiddenException('Requisição não permitida.');
      }
    } else {
      // Falha fechada: sem Origin nem Referer não há como validar a origem.
      throw new ForbiddenException('Requisição não permitida.');
    }

    const fetchSite = request.headers['sec-fetch-site'];
    if (fetchSite === 'cross-site' || fetchSite === 'none') {
      throw new ForbiddenException('Requisição não permitida.');
    }
  }
}
