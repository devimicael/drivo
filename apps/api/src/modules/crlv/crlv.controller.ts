import { BadRequestException, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors, ParseFilePipeBuilder } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadGatewayResponse, ApiBadRequestResponse, ApiConsumes, ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { RateLimitEnv } from '../../common/guards/rate-limit.guard.js';
import { CrlvService } from './crlv.service.js';

@ApiTags('vehicles')
@Controller('vehicles')
export class CrlvController {
  constructor(private readonly crlv: CrlvService, private readonly config: ConfigService) {}

  @Post('scan-crlv')
  @HttpCode(HttpStatus.OK)
  @RateLimitEnv('SCAN_THROTTLE_LIMIT')
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @ApiOperation({ summary: 'Lê campos de um CRLV sem criar o veículo' })
  @ApiHeader({ name: 'X-CSRF-Token', required: false, description: 'Token double-submit do cookie CSRF.' })
  @ApiOkResponse({ description: 'Campos extraídos para revisão; nenhum veículo é persistido.', schema: {
    type: 'object', required: ['data'], properties: { data: {
      type: 'object', required: ['extracted', 'missingRequiredFields', 'source'], properties: {
        extracted: { type: 'object', properties: {
          placa: { type: 'string' }, marca: { type: 'string' }, modelo: { type: 'string' }, ano: { type: 'integer' },
          chassi: { type: 'string' }, renavam: { type: 'string' }, cor: { type: 'string' }, combustivel: { type: 'string' }, cilindrada: { type: 'integer' },
          tipo: { type: 'string' }, uf: { type: 'string' }, anoFabricacao: { type: 'integer' },
        } },
        missingRequiredFields: { type: 'array', items: { type: 'string', enum: ['placa', 'marca', 'modelo', 'ano', 'chassi'] } },
        source: { type: 'string', enum: ['GEMINI'] },
      },
    } },
  } })
  @ApiBadRequestResponse({ description: 'Arquivo ausente, inválido ou acima de 5 MB.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  @ApiTooManyRequestsResponse({ description: 'Limite de dez leituras por minuto excedido.' })
  @ApiBadGatewayResponse({ description: 'Falha na leitura automática. Preencha manualmente.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({ destination: tmpdir(), filename: (_request, _file, callback) => callback(null, randomUUID()) }),
    limits: { fileSize: 5_242_880 },
  }))
  scan(
    @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 5_242_880 }).build({
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: (message) => message === 'File is required'
        ? new BadRequestException({ code: 'FILE_REQUIRED', message: 'Envie um arquivo para continuar.' })
        : new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'O arquivo deve ter até 5 MB.' }),
    }))
    file: Express.Multer.File,
  ) {
    return this.crlv.scan(file);
  }
}
