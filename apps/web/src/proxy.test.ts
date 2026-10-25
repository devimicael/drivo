import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

describe('Session navigation', () => {
  it('allows the expired-session login screen even if a stale cookie remains', () => {
    const response = proxy(new NextRequest('http://localhost:3000/login?expirada=1', { headers: { cookie: 'drivo_session=expired' } }));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
  it('redirects a protected URL without a session to login', () => {
    expect(proxy(new NextRequest('http://localhost:3000/garagem')).headers.get('location')).toBe('http://localhost:3000/login');
  });
});
