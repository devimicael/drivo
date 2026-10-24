// Endpoints de sessão — T032. Cookie emitido pelo CookieService, nunca token no corpo.
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { SessionUser } from '../../common/auth/session-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RateLimitEnv } from '../../common/guards/rate-limit.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { PublicUser } from './auth.service.js';
import { AuthService } from './auth.service.js';
import { CookieService } from './cookie.service.js';
import { loginSchema, type LoginInput } from './schemas/login.schema.js';
import { userCreateSchema, type UserCreateInput } from './schemas/user-create.schema.js';

// Rate limiting de auth: 5/min (T021/T032). Sem `@nestjs/throttler`: veja rate-limit.guard.ts.
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: CookieService,
  ) {}

  @Public()
  @RateLimitEnv('AUTH_THROTTLE_LIMIT')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body({ schema: userCreateSchema, pipes: [ZodValidationPipe] }) body: UserCreateInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: PublicUser; session: { expiresAt: string } }> {
    const { user, session } = await this.auth.register(body);

    this.cookies.setSessionCookie(response, session.token, session.expiresAt);
    this.cookies.setCsrfCookie(response, session.jti);

    return { data: user, session: { expiresAt: session.expiresAt.toISOString() } };
  }

  @Public()
  @RateLimitEnv('AUTH_THROTTLE_LIMIT')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body({ schema: loginSchema, pipes: [ZodValidationPipe] }) body: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: PublicUser; session: { expiresAt: string } }> {
    const { user, session } = await this.auth.login(body);

    this.cookies.setSessionCookie(response, session.token, session.expiresAt);
    this.cookies.setCsrfCookie(response, session.jti);

    return { data: user, session: { expiresAt: session.expiresAt.toISOString() } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    this.cookies.clear(response);
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }
}
