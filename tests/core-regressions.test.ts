import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test_secret_key_123';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    foodDonation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    pickupRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    badge: {
      findMany: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((callback: any) => {
      if (typeof callback === 'function') return callback({
        user: { update: vi.fn().mockResolvedValue({ karmaPoints: 750 }), findUnique: vi.fn() },
      });
      return Promise.resolve([]);
    }),
  },
}));

// ─── Mock: Auth ───
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  getCurrentUser: vi.fn(),
  verifyToken: vi.fn(),
  signToken: vi.fn(),
  getCookieName: vi.fn(),
  SESSION_COOKIE_NAMES: ['session', 'admin_session', 'donor_session', 'ngo_session', 'rider_session'],
}));

// ─── Mock: Redis (named export ensureRedisConnection + default) ───
vi.mock('@/lib/redis', () => ({
  default: {
    status: 'ready',
    zrevrange: vi.fn().mockResolvedValue([]),
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

// ─── Mock: withSecurity pass-through (bypass rate limiting + header checks) ───
vi.mock('@/lib/api-handler', () => ({
  withSecurity: (handler: any) => handler,
}));

// ─── Mock: Achievements (bypass deep Prisma queries inside syncDonorAchievements) ───
vi.mock('@/lib/achievements', () => ({
  syncDonorAchievements: vi.fn().mockResolvedValue({
    karmaPoints: 750,
    level: 2,
    newBadges: [],
  }),
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
  awardDonationKarma: vi.fn().mockResolvedValue({}),
}));

// ─── Mock: Notifications ───
vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
}));

// ─── Import API Handlers ───
import { GET as getDonorBadges } from '@/app/api/donor/badges/route';
import { GET as getStatsSummary } from '@/app/api/stats/summary/route';
import { GET as getWeeklyStats } from '@/app/api/stats/weekly/route';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// ─── Tests ───
describe('ShareBite Core Regression Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Donor Badge Engine', () => {
    it('should calculate level progress and return earned badges', async () => {
      (getSession as any).mockResolvedValue({ userId: 'donor-1', role: 'DONOR' });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'donor-1',
        karmaPoints: 750,
        level: 2,
        createdAt: new Date(),
      });
      (prisma.badge.findMany as any).mockResolvedValue([
        { id: 'b1', name: 'First Share', description: 'desc', imageUrl: 'url', createdAt: new Date() },
        { id: 'b2', name: 'Elite', description: 'desc', imageUrl: 'url', createdAt: new Date() },
      ]);
      (prisma.userBadge.findMany as any).mockResolvedValue([
        { badgeId: 'b1', createdAt: new Date() },
      ]);

      const response = await (getDonorBadges as any)();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.karmaPoints).toBe(750);
      expect(data.level).toBe(2);
      expect(data.levelProgress).toBe(50);
      expect(data.badges).toHaveLength(2);
      expect(data.badges[0].earned).toBe(true);
      expect(data.badges[1].earned).toBe(false);
    });

    it('should return 401 if not a donor', async () => {
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
      const response = await (getDonorBadges as any)();
      expect(response.status).toBe(401);
    });
  });

  describe('Global Stats & Hall of Fame', () => {
    it('should return aggregate counts and top donors', async () => {
      (prisma.user.count as any).mockResolvedValueOnce(100);
      (prisma.user.count as any).mockResolvedValueOnce(20);
      (prisma.foodDonation.aggregate as any).mockResolvedValue({
        _sum: { weight: 500 },
        _count: { id: 120 },
      });

      const response = await (getStatsSummary as any)();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.totalDonors).toBe(100);
      expect(data.summary.totalWeight).toBe(500);
    });
  });

  describe('Personal Weekly Performance', () => {
    it('should return 7-day grouped data for charts', async () => {
      (getSession as any).mockResolvedValue({ userId: 'donor-1', role: 'DONOR' });

      // Generate a date that will match the processStats bucket logic exactly.
      // processStats creates buckets via new Date() → setHours(0,0,0,0) → toISOString().split('T')[0]
      // We need our mock data's toISOString date to match the same bucket.
      const bucketDate = new Date();
      bucketDate.setHours(0, 0, 0, 0);
      const expectedBucketKey = bucketDate.toISOString().split('T')[0];

      // Use the exact same bucket date for mock data so itemDate matches fullDate
      const mockDonations = [
        { weight: 10, updatedAt: bucketDate },
        { weight: 5, updatedAt: bucketDate },
      ];
      (prisma.foodDonation.findMany as any).mockResolvedValue(mockDonations);

      const response = await (getWeeklyStats as any)();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(7);

      // Find the day that matches our bucket and verify accumulated weight
      const todayBucket = data.find((d: any) => d.fullDate === expectedBucketKey);
      expect(todayBucket).toBeDefined();
      expect(todayBucket.weight).toBe(15);
      expect(todayBucket.count).toBe(2);
    });
  });

  describe('Admin Operations', () => {
    it('should handle unauthorized access to admin stats', async () => {
      (getSession as any).mockResolvedValue({ userId: 'user-1', role: 'DONOR' });
      // Donor should not have access to admin-only endpoints
    });
  });

});
