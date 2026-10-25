export const crlvJsonSchema = {
  type: 'object',
  properties: {
    placa: { type: 'string' }, marca: { type: 'string' }, modelo: { type: 'string' },
    ano: { type: 'integer' }, chassi: { type: 'string' }, renavam: { type: 'string' },
    cor: { type: 'string' }, combustivel: { type: 'string' }, cilindrada: { type: 'integer' }, tipo: { type: 'string' },
    uf: { type: 'string' }, anoFabricacao: { type: 'integer' },
  },
} as const;
