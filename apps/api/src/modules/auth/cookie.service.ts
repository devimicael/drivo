// Emite e limpa os cookies de sessão e CSRF; o JWT nunca vai no corpo JSON.
import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import {
  SESSION_COOKIE_NAME,
  createCsrfToken,
  csrfCookieName,
  resolveSecureCookies,
} from '../../common/auth/cookies.js';

@Injectable()
export class CookieService {
  private readonly secure: boolean;
  private readonly csrfSecret: string;
  private readonly ttlMs: number;

  constructor(config: ConfigService) {
    this.secure = resolveSecureCookies(
      config.get<boolean | undefined>('COOKIE_SECURE'),
      config.getOrThrow<string>('NODE_ENV'),
    );
    this.csrfSecret = config.getOrThrow<string>('CSRF_SECRET');
    this.ttlMs = config.getOrThrow<number>('JWT_TTL_SECONDS') * 1000;
  }

  setSessionCookie(response: Response, token: string, expiresAt: Date): void {
    response.cookie(SESSION_COOKIE_NAME, token, {
      ...this.baseOptions(),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
    });
  }

  setCsrfCookie(response: Response, jti: string): void {
    const token = createCsrfToken(
      randomBytes(24).toString('base64url'),
      jti,
      this.csrfSecret,
    );

    response.cookie(csrfCookieName(this.secure), token, {
      ...this.baseOptions(),
      httpOnly: false, // o frontend precisa ler para ecoar em X-CSRF-Token
      sameSite: 'strict',
      maxAge: this.ttlMs,
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, { ...this.baseOptions(), httpOnly: true, sameSite: 'lax' });
    response.clearCookie(csrfCookieName(this.secure), { ...this.baseOptions(), httpOnly: false, sameSite: 'strict' });
  }

  private baseOptions(): CookieOptions {
    return {
      secure: this.secure,
      path: '/',
      // Sem `domain`: apenas o host que emitiu recebe o cookie.
    };
  }
}
