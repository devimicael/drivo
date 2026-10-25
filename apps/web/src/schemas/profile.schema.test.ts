import { describe, expect, it } from 'vitest';
import { passwordSchema, profileDetailsSchema } from './profile.schema';

describe('Figma profile forms', () => {
  it('combines first and last names into the existing API name contract', () => {
    expect(profileDetailsSchema.parse({ firstName: ' Maria ', lastName: ' da Silva ' })).toEqual({ name: 'Maria da Silva' });
    expect(profileDetailsSchema.parse({ firstName: 'Maria', lastName: '' })).toEqual({ name: 'Maria' });
  });
  it('enforces the combined name limit before sending to the API', () => {
    expect(profileDetailsSchema.safeParse({ firstName: 'A'.repeat(80), lastName: 'B'.repeat(80) }).success).toBe(false);
  });
  it('requires matching, strong and different new passwords', () => {
    expect(passwordSchema.safeParse({ currentPassword: 'old-password', newPassword: 'new-password', confirmPassword: 'different' }).success).toBe(false);
    expect(passwordSchema.safeParse({ currentPassword: 'old-password', newPassword: 'old-password', confirmPassword: 'old-password' }).success).toBe(false);
    expect(passwordSchema.safeParse({ currentPassword: 'old-password', newPassword: 'short', confirmPassword: 'short' }).success).toBe(false);
  });
});
