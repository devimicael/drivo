import { sanitizeCrlvExtraction } from './crlv-extraction.schema.js';

describe('sanitizeCrlvExtraction', () => {
  it('drops invalid values field-by-field and keeps valid evidence unchanged', () => {
    expect(sanitizeCrlvExtraction({ placa: 'ABC1D23', ano: 'not-a-year', chassi: 'invented', uf: 'sp', marca: ' Toyota ', unknown: 'ignored' }))
      .toEqual({ placa: 'ABC1D23', marca: 'Toyota' });
    expect(sanitizeCrlvExtraction({ placa: 'abc1d23', chassi: '9BWZZZ377VT000001' })).toEqual({ chassi: '9BWZZZ377VT000001' });
  });
  it('returns no fields for non-object model output', () => {
    expect(sanitizeCrlvExtraction('not json object')).toEqual({});
  });
});
