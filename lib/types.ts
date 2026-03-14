import { User, FoodDonation, PickupRequest, Violation, Report, AuditLog } from "@/app/generated/prisma";

export type SafeUser = Omit<User, "password">;

export interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    totalDonations: number;
    totalRequests: number;
    totalWeightSaved: number;
    pendingReports: number;
    pendingVerifications: number;
  };
  userRoles: {
    donors: number;
    ngos: number;
    admins: number;
  };
  donationStatuses: {
    available: number;
    requested: number;
    approved: number;
    collected: number;
    expired: number;
  };
  monthlyDonations: { month: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  recentDonations: (FoodDonation & { donor: { name: string } })[];
  recentLogs: (AuditLog & { admin?: { name: string } })[]; 
}

export interface NGOWithMetrics extends SafeUser {
  _count: {
    requests: number;
    violations: number;
  };
  violations?: Pick<Violation, "reason" | "createdAt">[];
}
