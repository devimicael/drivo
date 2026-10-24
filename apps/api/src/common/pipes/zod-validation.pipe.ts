// Traduz os issues do Standard Schema (Zod) para `{ error: { code, message, details } }`.
import { BadRequestException, Injectable } from '@nestjs/common';
import { StandardSchemaValidationPipe } from '@nestjs/common';

interface StandardIssue {
  message: string;
  path?: readonly (PropertyKey | { readonly key: PropertyKey })[];
}

function pathToString(path: StandardIssue['path']): string {
  return (path ?? [])
    .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
    .join('.');
}

@Injectable()
export class ZodValidationPipe extends StandardSchemaValidationPipe {
  constructor() {
    super({
      exceptionFactory: (issues: readonly StandardIssue[]) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Verifique os campos destacados.',
          details: issues.map((issue) => ({
            path: pathToString(issue.path),
            message: issue.message,
          })),
        }),
    });
  }
}
