import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Público: alvo do healthcheck do Compose (sem sessão).
  @Public()
  @Get('health')
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
