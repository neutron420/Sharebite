import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    donorReport: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    }
  },
}));

describe('Donor Reports API', () => {

  describe('POST /api/donor-reports', () => {
    it('should allow an NGO to file a report against a Donor', async () => {
      // Test case: Valid report payload (reason, details, donorId)
      // Expected: 201 Created a new DonorReport object
    });

    it('should prevent self-reporting', async () => {
      // Test case: donorId equals reporterId
      // Expected: 400 Bad Request
    });
  });

  describe('GET /api/donor-reports', () => {
    it('should allow an NGO to see reports they have filed', async () => {
      // Test case: NGO fetches their submitted reports
      // Expected: Array of DonorReports
    });
  });

  describe('PUT /api/donor-reports/:id/status', () => {
    it('should restrict report resolution solely to ADMIN role', async () => {
      // Test case: DONOR or NGO trying to resolve a report
      // Expected: 403 Forbidden
    });

    it('should allow Admin to set report status to RESOLVED', async () => {
      // Test case: Admin sends { status: "RESOLVED" }
      // Expected: 200 OK and status updated in DB
    });
  });
});
