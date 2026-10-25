import type { Request } from 'express';

/** Usuário injetado pelo `JwtAuthGuard` a partir do payload do JWT. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  /** Identificador único da sessão, usado para assinar o token CSRF. */
  jti: string;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  jti: string;
  iat?: number;
  exp?: number;
}
