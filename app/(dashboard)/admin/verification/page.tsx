"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

type VerificationStatus =
  | "PENDING"
  | "ONLINE_VERIFIED"
  | "FIELD_VISIT_SCHEDULED"
  | "FIELD_VERIFIED"
  | "FULLY_VERIFIED"
  | "REJECTED";

interface VerificationItem {
  ngoId: string;
  name: string;
  email: string;
  city: string | null;
  address: string | null;
  phoneNumber: string | null;
  createdAt: string;
  isVerified: boolean;
  status: VerificationStatus;
  onlineVerified: boolean;
  groundVerified: boolean;
  lastVerifiedAt: string | null;
  nextReverificationAt: string | null;
  registrationCertUrl: string | null;
  panTanUrl: string | null;
  bankProofUrl: string | null;
  addressProofUrl: string | null;
  contactPersonIdUrl: string | null;
  onlineReviewNote: string | null;
  fieldVisitCity: string | null;
  fieldOfficerId: string | null;
  fieldOfficerName: string | null;
  fieldVisitScheduledAt: string | null;
  rejectionReason: string | null;
}

interface FieldOfficer {
  id: string;
  name: string;
  email: string;
  city: string | null;
}

interface ApiResponse {
  items: VerificationItem[];
  fieldOfficers: FieldOfficer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Pending",
  ONLINE_VERIFIED: "Online Verified",
  FIELD_VISIT_SCHEDULED: "Field Visit Scheduled",
  FIELD_VERIFIED: "Field Verified",
  FULLY_VERIFIED: "Fully Verified",
  REJECTED: "Rejected",
};

const STATUS_STYLES: Record<VerificationStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ONLINE_VERIFIED: "bg-blue-50 text-blue-700",
  FIELD_VISIT_SCHEDULED: "bg-orange-50 text-orange-700",
  FIELD_VERIFIED: "bg-emerald-50 text-emerald-700",
  FULLY_VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VerificationPage() {
  const { addListener, isConnected } = useSocket();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("scope", "admin");
      params.set("page", String(page));
      params.set("limit", "24");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/ngo-verifications?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        const message =
          errorPayload?.error ||
          errorPayload?.message ||
          `Failed to load NGO verification queue (${res.status})`;
        throw new Error(message);
      }

      const data = (await res.json()) as ApiResponse;
      setItems(data.items || []);
      setFieldOfficers(data.fieldOfficers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const unsubscribe = addListener("NGO_VERIFICATION_UPDATED", () => {
      void fetchItems();
    });

    return () => unsubscribe();
  }, [addListener, fetchItems]);

  const statusStats = useMemo(() => {
    return {
      pending: items.filter((item) => item.status === "PENDING").length,
      online: items.filter((item) => item.status === "ONLINE_VERIFIED").length,
      fieldScheduled: items.filter((item) => item.status === "FIELD_VISIT_SCHEDULED").length,
      fieldVerified: items.filter((item) => item.status === "FIELD_VERIFIED").length,
      fully: items.filter((item) => item.status === "FULLY_VERIFIED").length,
      rejected: items.filter((item) => item.status === "REJECTED").length,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Loading verification queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center space-y-4">
          <XCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-gray-700 font-semibold">{error}</p>
          <button
            onClick={fetchItems}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NGO 2-Layer Verification</h1>
          <p className="text-sm text-gray-500 mt-1">
            Online verification, field verification, and final approval with city-wise officer scheduling.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Ground Admins available: <span className="font-semibold text-gray-800">{fieldOfficers.length}</span>
            {fieldOfficers.length === 0 ? " (No Ground Admin logged in yet)" : ""}
          </p>
          <p className={`text-xs mt-2 inline-flex items-center gap-2 ${isConnected ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-300"}`} />
            {isConnected ? "Live sync enabled" : "Live sync reconnecting"}
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-gray-900">{statusStats.pending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Online</p>
          <p className="text-xl font-bold text-blue-700">{statusStats.online}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Field Scheduled</p>
          <p className="text-xl font-bold text-orange-700">{statusStats.fieldScheduled}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Field Verified</p>
          <p className="text-xl font-bold text-emerald-700">{statusStats.fieldVerified}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Fully Verified</p>
          <p className="text-xl font-bold text-green-700">{statusStats.fully}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Rejected</p>
          <p className="text-xl font-bold text-red-700">{statusStats.rejected}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search NGO by name, email, or city"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="all">Active Pipeline</option>
            <option value="PENDING">Pending</option>
            <option value="ONLINE_VERIFIED">Online Verified</option>
            <option value="FIELD_VISIT_SCHEDULED">Field Visit Scheduled</option>
            <option value="FIELD_VERIFIED">Field Verified</option>
            <option value="FULLY_VERIFIED">Completed (Fully Verified)</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.ngoId} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.email}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_STYLES[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {item.city || "No city"}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(item.createdAt)}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Last verified: {formatDate(item.lastVerifiedAt)}
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link
                href={`/admin/verification/${item.ngoId}`}
                className="flex-1 px-3 py-2 text-center text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-black"
              >
                Open Full Workflow Page
              </Link>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No NGOs found for this filter.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>{total} total NGOs</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
