import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test_secret_key_123';

// ─── Mock: Prisma ───
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((cb: any) => {
      if (typeof cb === 'function') return cb({});
      return Promise.resolve([]);
    }),
  },
}));

// ─── Mock: Auth ───
vi.mock('@/lib/auth', () => ({
  signToken: vi.fn().mockResolvedValue('mocked_token'),
  getCookieName: vi.fn().mockReturnValue('donor_session'),
  getSession: vi.fn(),
  verifyToken: vi.fn(),
  SESSION_COOKIE_NAMES: ['session', 'admin_session', 'donor_session', 'ngo_session', 'rider_session'],
}));

// ─── Mock: Redis (named export + default) ───
vi.mock('@/lib/redis', () => ({
  default: {
    status: 'ready',
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    multi: vi.fn().mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      ttl: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 1], [null, 60]]),
    }),
    expire: vi.fn(),
  },
  ensureRedisConnection: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock: withSecurity pass-through ───
vi.mock('@/lib/api-handler', () => ({
  withSecurity: (handler: any) => handler,
}));

// ─── Mock: next/headers cookies ───
vi.mock('next/headers', () => {
  const store = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return {
    cookies: vi.fn().mockResolvedValue(store),
    headers: vi.fn().mockResolvedValue(new Headers()),
  };
});

// ─── Import API Handlers ───
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as getMe } from '@/app/api/auth/me/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

describe('Auth API Endpoints', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-mock fetch for Turnstile
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    }) as any;
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'bad@user.com',
          password: '123456',
          turnstileToken: 'valid-token',
        }),
      });

      const res = await (loginHandler as any)(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should successfully log in a valid user and return cookie', async () => {
      // bcrypt hash for 'correct_password'
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('correct_password', 10);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@user.com',
        role: 'DONOR',
        password: hashedPassword,
        isLicenseSuspended: false,
        suspensionExpiresAt: null,
      });

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@user.com',
          password: 'correct_password',
          turnstileToken: 'valid-token',
        }),
      });

      const res = await (loginHandler as any)(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.user.id).toBe('user-1');
    });

    it('should return 403 if user is permanently suspended', async () => {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-1',
        name: 'Suspended User',
        email: 'banned@user.com',
        role: 'DONOR',
        password: hashedPassword,
        isLicenseSuspended: true,
        suspensionExpiresAt: null,
      });

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'banned@user.com',
          password: 'password123',
          turnstileToken: 'valid-token',
        }),
      });

      const res = await (loginHandler as any)(req);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile from session', async () => {
      (getSession as any).mockResolvedValue({ userId: 'user-1', role: 'DONOR' });
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1', name: 'Test', role: 'DONOR' });

      const req = new Request('http://localhost:3000/api/auth/me');
      const response = await (getMe as any)(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('user-1');
    });

    it('should return 401 if no session exists', async () => {
      (getSession as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/auth/me');
      const response = await (getMe as any)(req);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookies and successful logout', async () => {
      (getSession as any).mockResolvedValue({ userId: 'user-1', role: 'DONOR', email: 'test@user.com' });

      const req = new Request('http://localhost:3000/api/auth/logout', { method: 'POST' });
      const response = await (logoutHandler as any)(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('Logged out successfully');
    });
  });
});
