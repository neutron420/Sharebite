"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
} from "lucide-react";

interface PickupRequest {
  id: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  createdAt: string;
  ngo: { id: string; name: string; email: string; city: string | null };
  donation: {
    id: string;
    title: string;
    quantity: number;
    category: string;
    status: string;
    city: string;
    donor: { name: string; email: string };
  };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-600", icon: Clock },
  APPROVED: { bg: "bg-blue-50", text: "text-blue-600", icon: CheckCircle },
  REJECTED: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
  COMPLETED: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle },
};

function formatCategory(c: string) {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const itemsPerPage = 10;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/requests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch requests");
      setRequests(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Filter requests
  const filtered = requests.filter((r) => {
    const matchesSearch = 
      r.donation.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ngo.name.toLowerCase().includes(search.toLowerCase()) ||
      r.donation.donor.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4 border border-gray-200">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="text-gray-500">{error}</p>
          <button onClick={fetchRequests} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor all pickup requests across the platform</p>
        </div>
        <button onClick={fetchRequests} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by donation, NGO, or donor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Donation</th>
                <th className="px-6 py-4">NGO</th>
                <th className="px-6 py-4">Donor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((r) => {
                const statusStyle = STATUS_STYLES[r.status];
                const StatusIcon = statusStyle.icon;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                          <Package className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{r.donation.title}</p>
                          <p className="text-xs text-gray-500">{formatCategory(r.donation.category)} • {r.donation.quantity} qty</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-900">{r.ngo.name}</p>
                          <p className="text-xs text-gray-500">{r.ngo.city || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-orange-500" />
                        <p className="text-sm text-gray-900">{r.donation.donor.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="h-3 w-3" />{r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedRequest(r)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900">
                        <ClipboardList className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 px-3">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-lg animate-in fade-in zoom-in duration-300 shadow-none" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-orange-600 uppercase font-medium">Donation</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedRequest.donation.title}</p>
                <p className="text-sm text-gray-600">{formatCategory(selectedRequest.donation.category)} • {selectedRequest.donation.quantity} servings</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">NGO</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRequest.ngo.name}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.ngo.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Donor</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRequest.donation.donor.name}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.donation.donor.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${STATUS_STYLES[selectedRequest.status].bg} ${STATUS_STYLES[selectedRequest.status].text}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Requested On</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {selectedRequest.message && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-600 uppercase font-medium">Message from NGO</p>
                  </div>
                  <p className="text-sm text-gray-700">{selectedRequest.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
