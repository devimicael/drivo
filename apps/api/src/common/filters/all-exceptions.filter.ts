// Formato único de erro — contracts/README.md §4 (T016).
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorBody {
  code?: string;
  message?: string | string[];
  details?: unknown;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida.',
  401: 'Sessão ausente, inválida ou expirada.',
  403: 'Requisição não permitida.',
  404: 'Recurso não encontrado.',
  409: 'Não foi possível concluir a operação.',
  429: 'Muitas tentativas. Tente novamente em instantes.',
  502: 'Serviço externo indisponível. Tente novamente mais tarde.',
};

const STATUS_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  502: 'EXTERNAL_SERVICE_UNAVAILABLE',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const normalized: ErrorBody = typeof body === 'string' ? { message: body } : (body as ErrorBody);

      const message =
        status === HttpStatus.TOO_MANY_REQUESTS
          ? DEFAULT_MESSAGES[429]
          : Array.isArray(normalized.message)
            ? normalized.message.join(' ')
            : (normalized.message ?? DEFAULT_MESSAGES[status] ?? 'Requisição inválida.');

      response.status(status).json({
        error: {
          code: normalized.code ?? STATUS_CODES[status] ?? 'REQUEST_FAILED',
          message,
          ...(normalized.details ? { details: normalized.details } : {}),
        },
      });
      return;
    }

    // Nunca vaza stack trace, SQL, caminho de arquivo ou segredo (RN-09, RF19).
    this.logger.error(
      'Erro não tratado',
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno. Tente novamente.',
      },
    });
  }
}
