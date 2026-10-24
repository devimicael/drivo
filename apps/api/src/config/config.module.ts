// Config global validada por Zod — plan.md §config/config.module.ts (T013).
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { parseEnv } from './env.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Nest/Prisma não carregam `.env` sozinhos; o arquivo vive em apps/api/.env.
      envFilePath: ['.env'],
      validate: (raw: Record<string, unknown>) => parseEnv(raw),
    }),
  ],
})
export class AppConfigModule {}
