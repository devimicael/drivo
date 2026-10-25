import { Body, Controller, HttpCode, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { SessionUser } from '../../common/auth/session-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  userUpdateSchema,
  type UserUpdateInput,
} from './schemas/user-update.schema.js';
import { UsersService } from './users.service.js';
import { RateLimitEnv } from '../../common/guards/rate-limit.guard.js';
import {
  passwordUpdateSchema,
  type PasswordUpdateInput,
} from './schemas/password-update.schema.js';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me/password')
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @HttpCode(204)
  @RateLimitEnv('AUTH_THROTTLE_LIMIT')
  @ApiOperation({
    summary: 'Alterar a senha mediante confirmação da senha atual',
  })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      additionalProperties: false,
      properties: {
        currentPassword: { type: 'string', maxLength: 128 },
        newPassword: { type: 'string', minLength: 8, maxLength: 128 },
      },
    },
  })
  @ApiNoContentResponse({
    description: 'Senha alterada; sessão atual permanece ativa.',
  })
  @ApiBadRequestResponse({
    description: 'Senha atual incorreta ou nova senha inválida.',
  })
  @ApiUnauthorizedResponse({
    description: 'Sessão ausente, inválida ou expirada.',
  })
  updatePassword(
    @CurrentUser() user: SessionUser,
    @Body({ schema: passwordUpdateSchema, pipes: [ZodValidationPipe] })
    body: PasswordUpdateInput,
  ) {
    return this.users.updatePassword(user.id, body);
  }

  @Patch('me')
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: false,
    description: 'Token double-submit do cookie CSRF.',
  })
  @ApiOperation({ summary: 'Atualizar o nome do usuário autenticado' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string', minLength: 1, maxLength: 120 } },
      additionalProperties: false,
    },
  })
  @ApiOkResponse({
    description: 'Perfil atualizado; não inclui senha nem hash.',
    schema: {
      type: 'object',
      required: ['id', 'name', 'email', 'createdAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 120 },
        email: { type: 'string', format: 'email' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Nome inválido ou tentativa de alterar o e-mail.',
  })
  @ApiUnauthorizedResponse({
    description: 'Sessão ausente, inválida ou expirada.',
  })
  @ApiNotFoundResponse({ description: 'Usuário da sessão não encontrado.' })
  updateMe(
    @CurrentUser() user: SessionUser,
    @Body({ schema: userUpdateSchema, pipes: [ZodValidationPipe] })
    body: UserUpdateInput,
  ) {
    return this.users.updateName(user.id, body);
  }
}
