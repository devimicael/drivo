// Guard de sessão JWT com cookies, sem dependência de Passport.
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/cookies.js';
import type { AuthenticatedRequest, JwtPayload } from '../auth/session-user.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Sessão ausente, inválida ou expirada.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);

      if (!payload.sub || !payload.jti) {
        throw new Error('Payload de sessão incompleto.');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        jti: payload.jti,
      };

      return true;
    } catch {
      // Use a mesma mensagem para token ausente, inválido ou expirado.
      throw new UnauthorizedException('Sessão ausente, inválida ou expirada.');
    }
  }
}
