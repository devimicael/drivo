// CSRF em duas camadas: validação da origem e double-submit de token.
// Camada 1: Origin/Referer/Sec-Fetch-Site em todo método mutável (falha fechada).
// Camada 2: double-submit assinado por HMAC, amarrado ao `jti` do JWT da sessão.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { csrfCookieName, isValidCsrfToken, safeEqual, resolveSecureCookies } from '../auth/cookies.js';
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
    this.secureCookies = resolveSecureCookies(
      config.get<boolean | undefined>('COOKIE_SECURE'),
      config.getOrThrow<string>('NODE_ENV'),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    this.assertTrustedOrigin(request);

    // Sem sessão ativa (register/login) não há `jti` para amarrar o HMAC:
    // A validação da origem continua valendo; double-submit exige sessão ativa.
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
      if (!this.isTrustedOrigin(origin, request)) {
        throw new ForbiddenException('Requisição não permitida.');
      }
    } else if (referer) {
      let refererOrigin: string;
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        throw new ForbiddenException('Requisição não permitida.');
      }
      if (!this.isTrustedOrigin(refererOrigin, request)) {
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

  /**
   * Origem confiável = lista explícita (`CORS_ORIGINS`) ou a própria origem da
   * API (mesmo Host). O segundo caso é o que faz o "Try it out" do Swagger UI
   * funcionar: o browser envia `Origin: http://localhost:3001`, servido pelo
   * próprio Swagger. Um site atacante não consegue forjar esse Origin — quem
   * define o header é o browser, não o script.
   */
  private isTrustedOrigin(origin: string, request: AuthenticatedRequest): boolean {
    if (this.allowedOrigins.includes(origin)) {
      return true;
    }

    const host = request.headers.host;
    if (!host) {
      return false;
    }

    try {
      return new URL(origin).host.toLowerCase() === host.toLowerCase();
    } catch {
      return false;
    }
  }
}
