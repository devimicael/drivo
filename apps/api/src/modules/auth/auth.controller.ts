// Endpoints de sessão; tokens são emitidos em cookies, nunca no corpo JSON.
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
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

const authResponseSchema = {
  type: 'object', required: ['data', 'session'], properties: {
    data: { type: 'object', required: ['id', 'name', 'email', 'createdAt'], properties: {
      id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, createdAt: { type: 'string', format: 'date-time' },
    } },
    session: { type: 'object', required: ['expiresAt'], properties: { expiresAt: { type: 'string', format: 'date-time' } } },
  },
};
const publicUserSchema = authResponseSchema.properties.data;

// Rate limiting de auth é configurável por AUTH_THROTTLE_LIMIT.
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: CookieService,
  ) {}

  @Public()
  @RateLimitEnv('AUTH_THROTTLE_LIMIT')
  @Post('register')
  @ApiOperation({ summary: 'Criar conta e iniciar sessão' })
  @ApiBody({ schema: { type: 'object', required: ['name', 'email', 'password'], additionalProperties: false, properties: { name: { type: 'string', maxLength: 120 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, maxLength: 128 } } } })
  @ApiCreatedResponse({ description: 'Conta criada; sessão emitida em cookie HttpOnly.', schema: authResponseSchema, headers: { 'Set-Cookie': { description: 'Cookie HttpOnly com o JWT de sessão.', schema: { type: 'string' } } } })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  @ApiTooManyRequestsResponse({ description: 'Limite de tentativas por minuto excedido.' })
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
  @ApiOperation({ summary: 'Autenticar' })
  @ApiBody({ schema: { type: 'object', required: ['email', 'password'], additionalProperties: false, properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, maxLength: 128 } } } })
  @ApiOkResponse({ description: 'Sessão emitida em cookie HttpOnly.', schema: authResponseSchema, headers: { 'Set-Cookie': { description: 'Cookie HttpOnly com o JWT de sessão.', schema: { type: 'string' } } } })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  @ApiTooManyRequestsResponse({ description: 'Limite de tentativas por minuto excedido.' })
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
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @ApiOperation({ summary: 'Encerrar a sessão e limpar os cookies' })
  @ApiNoContentResponse({ description: 'Cookies de sessão e CSRF expirados.', headers: { 'Set-Cookie': { description: 'Cookies de sessão e CSRF limpos.', schema: { type: 'string' } } } })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  logout(@Res({ passthrough: true }) response: Response): void {
    this.cookies.clear(response);
  }

  @Get('me')
  @ApiSecurity('cookieAuth')
  @ApiOperation({ summary: 'Retornar a sessão autenticada' })
  @ApiOkResponse({ description: 'Perfil público do usuário autenticado.', schema: publicUserSchema })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  me(@CurrentUser() user: SessionUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }
}
