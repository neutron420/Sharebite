"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface RiderProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  pincode: string | null;
  verificationDoc: string | null;
  createdAt: string;
  isVerified: boolean;
}

interface RiderApplication {
  id: string;
  status:
    | "PENDING_NGO_REVIEW"
    | "NGO_APPROVED"
    | "NGO_REJECTED"
    | "ADMIN_APPROVED"
    | "ADMIN_REJECTED";
  ngoReviewedAt: string | null;
  ngoReviewNote: string | null;
  adminReviewedAt: string | null;
  adminReviewNote: string | null;
  createdAt: string;
  rider: RiderProfile;
}

interface Stats {
  total: number;
  pendingNgoReview: number;
  approvedByNgo: number;
  ngoRejected: number;
  finalApproved: number;
  finalRejected: number;
}

const STATUS_META: Record<RiderApplication["status"], { label: string; className: string }> = {
  PENDING_NGO_REVIEW: {
    label: "Pending NGO Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  NGO_APPROVED: {
    label: "Approved by NGO",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  NGO_REJECTED: {
    label: "Rejected by NGO",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  ADMIN_APPROVED: {
    label: "Admin Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ADMIN_REJECTED: {
    label: "Admin Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NgoRiderVerificationPage() {
  const [applications, setApplications] = useState<RiderApplication[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "final">("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selected, setSelected] = useState<RiderApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ngo/rider-verifications", { credentials: "include" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch rider applications");
      }

      setApplications(Array.isArray(data.applications) ? data.applications : []);
      setStats(data.stats || null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to load rider applications";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = useMemo(() => {
    if (filter === "all") return applications;
    if (filter === "pending") {
      return applications.filter((item) => item.status === "PENDING_NGO_REVIEW");
    }
    if (filter === "approved") {
      return applications.filter((item) => item.status === "NGO_APPROVED");
    }
    if (filter === "rejected") {
      return applications.filter((item) => item.status === "NGO_REJECTED");
    }
    return applications.filter(
      (item) => item.status === "ADMIN_APPROVED" || item.status === "ADMIN_REJECTED"
    );
  }, [applications, filter]);

  const handleReview = async (applicationId: string, action: "approve" | "reject") => {
    try {
      setActioningId(applicationId);

      let note: string | undefined;
      if (action === "reject") {
        const reason = window.prompt("Add a short rejection note (optional):", "");
        note = reason?.trim() || undefined;
      }

      const res = await fetch(`/api/ngo/rider-verifications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, note }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update rider verification");
      }

      toast.success(data.message || "Rider verification updated");
      await fetchApplications();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update rider verification";
      toast.error(message);
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading rider verification queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Rider Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review rider details, approve your NGO fleet, and forward approved riders for final admin verification.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending</p>
          <p className="text-2xl font-black text-amber-800 mt-1">{stats?.pendingNgoReview ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">NGO Approved</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{stats?.approvedByNgo ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Admin Approved</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{stats?.finalApproved ?? 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-700">Filter rider applications</p>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="pending">Pending NGO Review</option>
            <option value="all">All Applications</option>
            <option value="approved">NGO Approved</option>
            <option value="rejected">NGO Rejected</option>
            <option value="final">Admin Finalized</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredApplications.map((item) => {
          const statusMeta = STATUS_META[item.status];
          const isPending = item.status === "PENDING_NGO_REVIEW";
          return (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 truncate">{item.rider.name}</h2>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-slate-600">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{item.rider.email}</span>
                    </div>
                    {item.rider.phoneNumber && (
                      <div className="inline-flex items-center gap-2 min-w-0">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{item.rider.phoneNumber}</span>
                      </div>
                    )}
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {[item.rider.city, item.rider.state, item.rider.pincode].filter(Boolean).join(", ") || "Location not provided"}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <Clock3 className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">Applied on {formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto sm:min-w-[220px] space-y-2">
                  <button
                    onClick={() => setSelected(item)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Full Details
                  </button>

                  {isPending && (
                    <>
                      <button
                        onClick={() => handleReview(item.id, "approve")}
                        disabled={actioningId === item.id}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Rider
                      </button>
                      <button
                        onClick={() => handleReview(item.id, "reject")}
                        disabled={actioningId === item.id}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" /> Reject Rider
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No rider applications in this view</h3>
            <p className="text-sm text-slate-500 mt-1">New rider requests will appear here automatically.</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Rider Details</h3>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-xl font-black text-slate-900">{selected.rider.name}</h4>
                <p className="text-sm text-slate-600 mt-1">{selected.rider.email}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{selected.rider.phoneNumber || "Not provided"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Applied On</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(selected.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{selected.rider.address || "Not provided"}</p>
                </div>
              </div>

              {selected.rider.verificationDoc && (
                <a
                  href={selected.rider.verificationDoc}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <FileText className="h-4 w-4" />
                  View Uploaded Verification Document
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">NGO Decision Time</p>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(selected.ngoReviewedAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Admin Decision Time</p>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(selected.adminReviewedAt)}</p>
                </div>
              </div>

              {selected.ngoReviewNote && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">NGO Note</p>
                  <p className="text-sm text-slate-700 mt-1">{selected.ngoReviewNote}</p>
                </div>
              )}

              {selected.adminReviewNote && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Admin Note</p>
                  <p className="text-sm text-slate-700 mt-1">{selected.adminReviewNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
