import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CookieService } from './cookie.service.js';

@Module({
  imports: [
    // `global: true`: o JwtAuthGuard é registrado no AppModule via APP_GUARD (T018).
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.getOrThrow<number>('JWT_TTL_SECONDS') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CookieService],
  exports: [AuthService],
})
export class AuthModule {}
