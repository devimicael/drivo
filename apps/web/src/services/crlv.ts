import { apiFetch } from '@/lib/api';

export interface CrlvScanResponse {
  data: {
    extracted: Record<string, string | number>;
    missingRequiredFields: Array<'placa' | 'marca' | 'modelo' | 'ano' | 'chassi'>;
    source: 'GEMINI';
  };
}

export const crlvService = {
  scan(file: File): Promise<CrlvScanResponse> {
    const form = new FormData();
    form.append('file', file);
    return apiFetch('/vehicles/scan-crlv', { method: 'POST', body: form });
  },
};
