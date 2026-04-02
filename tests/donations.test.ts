import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'test_secret_key_123';

// ─── Mock: Prisma ───
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    foodDonation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((cb: any) => {
      if (typeof cb === 'function') return cb({});
      return Promise.resolve([]);
    }),
  },
}));

// ─── Mock: Auth ───
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  signToken: vi.fn(),
  getCookieName: vi.fn(),
  SESSION_COOKIE_NAMES: ['session'],
}));

// ─── Mock: Redis (named export + default) ───
vi.mock('@/lib/redis', () => ({
  default: {
    status: 'ready',
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    geoadd: vi.fn(),
    geosearch: vi.fn(),
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

// ─── Mock: Achievements ───
vi.mock('@/lib/achievements', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
  awardDonationKarma: vi.fn().mockResolvedValue({}),
}));

// ─── Mock: Zod validation (pass-through) ───
vi.mock('@/lib/validations/donation', () => ({
  donationSchema: {
    parse: (data: any) => data,
  },
}));

// ─── Import API Handlers ───
import { GET as getDonations, POST as createDonation } from '@/app/api/donations/route';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Donations API Endpoints', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/donations', () => {
    it('should fetch all available donations successfully', async () => {
      (getSession as any).mockResolvedValue({ userId: 'user1', role: 'DONOR' });
      (prisma.foodDonation.findMany as any).mockResolvedValue([
        { id: '1', title: 'Food', expiryTime: new Date(Date.now() + 86400000).toISOString() },
      ]);

      const req = new Request('http://localhost:3000/api/donations?status=AVAILABLE');
      const res = await (getDonations as any)(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
    });
  });

  describe('POST /api/donations', () => {
    it('should create a new food donation successfully when authenticated as a DONOR', async () => {
      (getSession as any).mockResolvedValue({ userId: 'user1', role: 'DONOR' });
      (prisma.foodDonation.create as any).mockResolvedValue({ id: 'new-1', title: 'New Food' });
      (prisma.user.findMany as any).mockResolvedValue([]); // No admins/NGOs for notifications

      const req = new Request('http://localhost:3000/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Food',
          quantity: 5,
          category: 'VEG',
          city: 'Mumbai',
          pickupLocation: 'Test Location',
          expiryTime: new Date(Date.now() + 86400000).toISOString(),
          pickupStartTime: new Date().toISOString(),
          pickupEndTime: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      const res = await (createDonation as any)(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.title).toBe('New Food');
    });

    it('should return 401 if not authenticated', async () => {
      (getSession as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });

      const res = await (createDonation as any)(req);
      expect(res.status).toBe(401);
    });
  });
});
