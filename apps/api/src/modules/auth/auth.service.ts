// Regras de cadastro, login e sessão.
import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { ARGON2_OPTIONS } from '../../common/auth/password-options.js';
import { isUniqueConstraintError } from '../../common/prisma/is-unique-constraint-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { LoginInput } from './schemas/login.schema.js';
import type { UserCreateInput } from './schemas/user-create.schema.js';

/** Hash descartável para equalizar o tempo de resposta de e-mail inexistente (RN-11). */
const TIMING_EQUALIZATION_PASSWORD = 'drivo-timing-equalization';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export interface IssuedSession {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  session: IssuedSession;
}

@Injectable()
export class AuthService {
  private readonly ttlSeconds: number;
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.ttlSeconds = config.getOrThrow<number>('JWT_TTL_SECONDS');
  }

  async register(input: UserCreateInput): Promise<AuthResult> {
    const passwordHash = await hash(input.password, ARGON2_OPTIONS);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
        select: publicUserSelect,
      });

      return { user, session: await this.issueSession(user) };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // Não revelar se a conta já existe.
        throw new ConflictException({
          code: 'EMAIL_ALREADY_IN_USE',
          message: 'Este e-mail já está em uso.',
        });
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...publicUserSelect, passwordHash: true },
    });

    if (!user) {
      // Verifica contra um hash descartável: e-mail inexistente e senha errada
      // mantêm o mesmo tempo de resposta.
      await verify(await this.getDummyHash(), input.password);
      throw invalidCredentials();
    }

    const passwordMatches = await verify(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw invalidCredentials();
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { user: publicUser, session: await this.issueSession(publicUser) };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Sessão ausente, inválida ou expirada.');
    }

    return user;
  }

  private async issueSession(user: PublicUser): Promise<IssuedSession> {
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      jti,
    });

    return { token, jti, expiresAt };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hash(TIMING_EQUALIZATION_PASSWORD, ARGON2_OPTIONS);
    return this.dummyHash;
  }
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'Credenciais inválidas.',
  });
}
