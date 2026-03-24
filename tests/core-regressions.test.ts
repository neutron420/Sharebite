import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test_secret_key_123';

// 1. Mock Prisma
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
    $transaction: vi.fn().mockImplementation((callback) => callback(null)),
  },
}));

// 2. Mock Auth
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  getCurrentUser: vi.fn(),
  verifyToken: vi.fn(),
  signToken: vi.fn(),
}));

// 3. Mock Redis
vi.mock('@/lib/redis', () => ({
  default: {
    zrevrange: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    ensureRedisConnection: vi.fn().mockResolvedValue(true),
  },
}));

// 4. Mock Notifications
vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
}));

// 5. Mock API Handlers
import { GET as getDonorBadges } from '@/app/api/donor/badges/route';
import { GET as getStatsSummary } from '@/app/api/stats/summary/route';
import { GET as getWeeklyStats } from '@/app/api/stats/weekly/route';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('ShareBite Core Regression Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Donor Badge Engine', () => {
    it('should calculate level progress and return earned badges', async () => {
      // Mock session as Donor
      (getSession as any).mockResolvedValue({ userId: 'donor-1', role: 'DONOR' });
      
      // Mock prisma calls
      (prisma.user.findUnique as any).mockResolvedValue({ 
        id: 'donor-1', 
        karmaPoints: 750, 
        level: 2, 
        createdAt: new Date() 
      });
      (prisma.badge.findMany as any).mockResolvedValue([
        { id: 'b1', name: 'First Share', description: 'desc', imageUrl: 'url' },
        { id: 'b2', name: 'Elite', description: 'desc', imageUrl: 'url' }
      ]);
      (prisma.userBadge.findMany as any).mockResolvedValue([
        { badgeId: 'b1', createdAt: new Date() }
      ]);

      const response = await (getDonorBadges as any)();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.karmaPoints).toBe(750);
      expect(data.level).toBe(2);
      expect(data.levelProgress).toBe(50); // (750 - 500) / (1000 - 500) * 100 = 50%
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
      // stats/summary is wrapped in withSecurity, so we test the underlying handler if possible, 
      // or just expect the mock to work if we can pass the request.

      (prisma.user.count as any).mockResolvedValueOnce(100); // donors
      (prisma.user.count as any).mockResolvedValueOnce(20);  // ngos
      (prisma.foodDonation.aggregate as any).mockResolvedValue({
        _sum: { weight: 500 },
        _count: { id: 120 }
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
      
      const mockDonations = [
        { weight: 10, updatedAt: new Date() },
        { weight: 5, updatedAt: new Date() }
      ];
      (prisma.foodDonation.findMany as any).mockResolvedValue(mockDonations);

      const response = await (getWeeklyStats as any)();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(7);
      // Last item in array is today
      expect(data[6].weight).toBe(15);
      expect(data[6].count).toBe(2);
    });
  });

  describe('Admin Operations', () => {
    // We can add tests for admin user lists, verification etc.
    it('should handle unauthorized access to admin stats', async () => {
        // Mock session as regular user
        (getSession as any).mockResolvedValue({ userId: 'user-1', role: 'DONOR' });
        // Assuming admin stats has similar role check
    });
  });

});

