import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca uma rota como pública — o `JwtAuthGuard` global a libera (T018). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
