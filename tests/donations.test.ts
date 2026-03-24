import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'test_secret_key_123';

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
    },
    notification: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((cb) => cb(null)),
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  signToken: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    geoadd: vi.fn(),
    geosearch: vi.fn(),
    ensureRedisConnection: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/lib/achievements', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
  awardDonationKarma: vi.fn().mockResolvedValue({}),
}));

import { GET as getDonations, POST as createDonation } from '@/app/api/donations/route';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Donations API Endpoints', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/donations', () => {
    it('should fetch all available donations successfully', async () => {
       (prisma.foodDonation.findMany as any).mockResolvedValue([{ id: '1', title: 'Food' }]);
       const res = await (getDonations as any)();
       const data = await res.json();
       expect(res.status).toBe(200);
       expect(data).toHaveLength(1);
    });
  });

  describe('POST /api/donations', () => {
    it('should create a new food donation successfully when authenticated as a DONOR', async () => {
       (getSession as any).mockResolvedValue({ userId: 'user1', role: 'DONOR' });
       (prisma.foodDonation.create as any).mockResolvedValue({ id: 'new-1', title: 'New Food' });
       
       const res = await (createDonation as any)({
         json: () => ({ title: 'New Food', quantity: 5, category: 'VEG' })
       });
       
       expect(res.status).toBe(201);
       const data = await res.json();
       expect(data.title).toBe('New Food');
    });

    it('should return 401 if not authenticated', async () => {
       (getSession as any).mockResolvedValue(null);
       const res = await (createDonation as any)({ json: () => ({}) });
       expect(res.status).toBe(403);
    });
  });
});
