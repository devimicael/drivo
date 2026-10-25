import { describe, expect, it } from '@jest/globals';
import { normalizePlaca, placaField } from './schemas/vehicle-fields.js';

describe('vehicle fields', () => {
  describe('normalizePlaca', () => {
    it('converts lowercase and a hyphen to the canonical plate format', () => {
      expect(normalizePlaca('abc-1d23')).toBe('ABC1D23');
    });

    it('removes spaces and other separators before validation', () => {
      expect(normalizePlaca(' abc 1d-23 ')).toBe('ABC1D23');
    });

    it('accepts both Brazilian seven-character plate patterns', () => {
      expect(placaField.parse('abc-1234')).toBe('ABC1234');
      expect(placaField.parse('abc-1d23')).toBe('ABC1D23');
    });

    it('rejects values that do not normalize to seven alphanumeric characters', () => {
      expect(placaField.safeParse('ABC-123').success).toBe(false);
      expect(placaField.safeParse('ABCD-1234').success).toBe(false);
    });
  });
});
