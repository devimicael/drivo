import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const PASSWORD = 'senha-segura-123';
const USER_ID = 'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1';

interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface StoredUser extends PublicUser {
  passwordHash: string;
}

interface CreateArgs {
  data: { name: string; email: string; passwordHash: string };
}

let createArgs: CreateArgs[] = [];
let findUniqueArgs: unknown[] = [];
let createResult: () => Promise<PublicUser> = async () => publicUser();
let findUniqueResult: () => Promise<StoredUser | PublicUser | null> = async () => null;

function publicUser(): PublicUser {
  return {
    id: USER_ID,
    name: 'Ana Souza',
    email: 'ana@example.com',
    createdAt: new Date('2026-10-24T00:00:00.000Z'),
  };
}

const prismaMock = {
  user: {
    create: (args: CreateArgs) => {
      createArgs.push(args);
      return createResult();
    },
    findUnique: (args: unknown) => {
      findUniqueArgs.push(args);
      return findUniqueResult();
    },
  },
};

const configMock = {
  getOrThrow: (key: string) => {
    if (key === 'JWT_TTL_SECONDS') {
      return 3600;
    }
    throw new Error(`Chave inesperada: ${key}`);
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let storedHash: string;

  beforeEach(async () => {
    createArgs = [];
    findUniqueArgs = [];
    createResult = async () => publicUser();
    findUniqueResult = async () => null;

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'chave-de-teste-com-32-caracteres!!',
          signOptions: { expiresIn: 3600 },
        }),
      ],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    storedHash = await hash(PASSWORD, {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    });
  });

  it('cadastra com Argon2id e nunca devolve a senha', async () => {
    const result = await service.register({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: PASSWORD,
    });

    const persisted = createArgs[0];

    // PHC com os parâmetros fixados (research.md §5 / P-03).
    expect(persisted?.data.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(persisted?.data.passwordHash).not.toContain(PASSWORD);
    expect(await verify(persisted?.data.passwordHash ?? '', PASSWORD)).toBe(true);

    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.session.token.split('.')).toHaveLength(3);
    expect(result.session.jti).toEqual(expect.any(String));
    expect(result.session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('devolve 409 EMAIL_ALREADY_IN_USE em e-mail duplicado', async () => {
    createResult = async () => {
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    };

    await expect(
      service.register({ name: 'Ana', email: 'ana@example.com', password: PASSWORD }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.register({ name: 'Ana', email: 'ana@example.com', password: PASSWORD }),
    ).rejects.toMatchObject({ response: { code: 'EMAIL_ALREADY_IN_USE' } });
  });

  it('login de e-mail inexistente responde "Credenciais inválidas."', async () => {
    findUniqueResult = async () => null;

    await expect(
      service.login({ email: 'ninguem@example.com', password: PASSWORD }),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas.' },
    });
  });

  it('login com senha errada responde exatamente igual ao e-mail inexistente', async () => {
    findUniqueResult = async () => ({ ...publicUser(), passwordHash: storedHash });

    const wrongPassword = service
      .login({ email: 'ana@example.com', password: 'senha-errada' })
      .catch((error: unknown) => error);

    findUniqueResult = async () => null;
    const unknownEmail = service
      .login({ email: 'ninguem@example.com', password: PASSWORD })
      .catch((error: unknown) => error);

    const [wrongPasswordError, unknownEmailError] = await Promise.all([
      wrongPassword,
      unknownEmail,
    ]);

    expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
    expect((wrongPasswordError as UnauthorizedException).getResponse()).toEqual(
      (unknownEmailError as UnauthorizedException).getResponse(),
    );
  });

  it('login válido emite sessão e não serializa passwordHash', async () => {
    findUniqueResult = async () => ({ ...publicUser(), passwordHash: storedHash });

    const result = await service.login({ email: 'ana@example.com', password: PASSWORD });

    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.session.token.split('.')).toHaveLength(3);
  });

  it('me() lê o usuário pelo id da sessão sem expor o hash', async () => {
    findUniqueResult = async () => publicUser();

    const user = await service.me(USER_ID);

    expect(user.email).toBe('ana@example.com');
    expect(user).not.toHaveProperty('passwordHash');
    expect(findUniqueArgs[0]).toEqual({
      where: { id: USER_ID },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  });

  it('me() com usuário removido responde 401', async () => {
    findUniqueResult = async () => null;

    await expect(service.me('id-inexistente')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
