import { Module } from '@nestjs/common';
import { CrlvController } from './crlv.controller.js';
import { CrlvService } from './crlv.service.js';
import { GeminiClient } from './gemini/gemini.client.js';

@Module({ controllers: [CrlvController], providers: [CrlvService, GeminiClient] })
export class CrlvModule {}
