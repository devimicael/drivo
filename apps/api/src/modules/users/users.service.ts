import { BadRequestException, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { ARGON2_OPTIONS } from '../../common/auth/password-options.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UserUpdateInput } from './schemas/user-update.schema.js';
import type { PasswordUpdateInput } from './schemas/password-update.schema.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
export type PublicProfile = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateName(
    userId: string,
    input: UserUpdateInput,
  ): Promise<PublicProfile> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
      select: publicUserSelect,
    });
  }

  async updatePassword(
    userId: string,
    input: PasswordUpdateInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user || !(await verify(user.passwordHash, input.currentPassword))) {
      throw new BadRequestException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'A senha atual está incorreta.',
      });
    }
    const passwordHash = await hash(input.newPassword, ARGON2_OPTIONS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
