"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Calendar,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface Donation {
  id: string;
  title: string;
  description: string;
  quantity: number;
  weight: number | null;
  category: string;
  status: string;
  city: string;
  pickupLocation: string;
  expiryTime: string;
  imageUrl: string | null;
  createdAt: string;
  donor: { name: string; email: string };
  requests: { status: string; ngo: { name: string } }[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof Package }> = {
  AVAILABLE: { bg: "bg-blue-50", text: "text-blue-600", icon: Package },
  REQUESTED: { bg: "bg-yellow-50", text: "text-yellow-600", icon: Clock },
  APPROVED: { bg: "bg-purple-50", text: "text-purple-600", icon: CheckCircle2 },
  COLLECTED: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle2 },
  EXPIRED: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
};

const CATEGORIES = [
  "VEG", "NON_VEG", "DAIRY", "BAKERY", "FRUITS_AND_VEGGIES",
  "COOKED_FOOD", "STAPLES", "PACKAGED_FOOD", "OTHERS"
];

const STATUSES = ["AVAILABLE", "REQUESTED", "APPROVED", "COLLECTED", "EXPIRED"];

function formatCategory(c: string) {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const itemsPerPage = 10;

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/donations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch donations");
      setDonations(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  // Filter donations
  const filtered = donations.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.donor.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || d.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const stats = {
    total: donations.length,
    available: donations.filter((d) => d.status === "AVAILABLE").length,
    collected: donations.filter((d) => d.status === "COLLECTED").length,
    expired: donations.filter((d) => d.status === "EXPIRED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading donations...</p>
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
          <button onClick={fetchDonations} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
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
          <h1 className="text-2xl font-bold text-gray-900">Donations Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor all food donations</p>
        </div>
        <button onClick={fetchDonations} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Donations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.collected}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, donor, or city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Donation</th>
                <th className="px-6 py-4">Donor</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((d) => {
                const statusStyle = STATUS_COLORS[d.status] || STATUS_COLORS.AVAILABLE;
                const StatusIcon = statusStyle.icon;
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {d.imageUrl ? (
                          <img src={d.imageUrl} alt={d.title} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                            <Package className="h-5 w-5 text-orange-500" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{d.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{d.donor.name}</p>
                      <p className="text-xs text-gray-500">{d.donor.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {formatCategory(d.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {d.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="h-3 w-3" />{d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(d.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedDonation(d)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">No donations found</td>
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
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 px-3">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDonation(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Donation Details</h2>
              <button onClick={() => setSelectedDonation(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedDonation.imageUrl && (
                <img src={selectedDonation.imageUrl} alt={selectedDonation.title} className="w-full h-48 object-cover rounded-xl" />
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedDonation.title}</h3>
                <p className="text-gray-600 mt-2">{selectedDonation.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Donor</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedDonation.donor.name}</p>
                  <p className="text-xs text-gray-500">{selectedDonation.donor.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Category</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatCategory(selectedDonation.category)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Quantity</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedDonation.quantity} servings</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Weight</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedDonation.weight || 0} kg</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Pickup Location</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedDonation.pickupLocation}, {selectedDonation.city}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Expiry</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedDonation.expiryTime)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${STATUS_COLORS[selectedDonation.status]?.bg} ${STATUS_COLORS[selectedDonation.status]?.text}`}>
                    {selectedDonation.status}
                  </span>
                </div>
              </div>
              {selectedDonation.requests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Pickup Requests ({selectedDonation.requests.length})</p>
                  <div className="space-y-2">
                    {selectedDonation.requests.map((r, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{r.ngo.name}</p>
                        <span className="text-xs font-medium text-gray-500">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
