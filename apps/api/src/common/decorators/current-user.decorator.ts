import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest, SessionUser } from '../auth/session-user.js';

/** Injeta o usuário da sessão (ou 401 se o guard não o tiver preenchido). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Sessão ausente, inválida ou expirada.');
    }

    return request.user;
  },
);
