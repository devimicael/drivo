'use client';

import { useMutation } from '@tanstack/react-query';
import { crlvService } from '@/services/crlv';

export function useCrlvScan() {
  return useMutation({ mutationFn: (file: File) => crlvService.scan(file), retry: false });
}
