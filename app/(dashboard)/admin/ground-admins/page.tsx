"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  Clock,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  User,
  UserCheck,
  UserX,
  X,
  XCircle,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Activity,
  Filter,
  Eye,
} from "lucide-react";

interface GroundAdminItem {
  id: string;
  name: string;
  email: string;
  city: string | null;
  address: string | null;
  phoneNumber: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  imageUrl: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  totalCities: number;
}

interface ApiResponse {
  items: GroundAdminItem[];
  cities: string[];
  stats: Stats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function GroundAdminManagementPage() {
  const [items, setItems] = useState<GroundAdminItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, totalCities: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<GroundAdminItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "24");
      if (search.trim()) params.set("search", search.trim());
      if (cityFilter) params.set("city", cityFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/ground-admins?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        throw new Error(errorPayload?.error || `Failed to load ground admins (${res.status})`);
      }

      const data = (await res.json()) as ApiResponse;
      setItems(data.items || []);
      setCities(data.cities || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0, totalCities: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search, cityFilter, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const runAction = async (groundAdminId: string, action: string) => {
    try {
      setActionLoading(groundAdminId);
      const res = await fetch("/api/admin/ground-admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ groundAdminId, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Action failed");
      }

      const result = await res.json();
      if (result.warning) {
        alert(`⚠️ ${result.warning}`);
      }

      await fetchItems();
      setConfirmAction(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Loading Ground Admin officers...</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ground Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage field officers, view assignments, and control access for on-ground NGO verification.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 shrink-0"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Officers</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-xl font-bold text-emerald-700">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="text-xl font-bold text-red-700">{stats.inactive}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Cities Covered</p>
            <p className="text-xl font-bold text-violet-700">{stats.totalCities}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
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
              placeholder="Search by name, email, city, or phone"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[160px]"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((ga) => (
          <div
            key={ga.id}
            className={`bg-white border rounded-2xl p-5 space-y-4 transition-all duration-200 hover:shadow-md ${
              ga.isAvailable
                ? "border-gray-200"
                : "border-red-200 bg-red-50/30"
            }`}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    ga.isAvailable
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {ga.imageUrl ? (
                    <img
                      src={ga.imageUrl}
                      alt={ga.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(ga.name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ga.name}</p>
                  <p className="text-xs text-gray-500 truncate">{ga.email}</p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                  ga.isAvailable
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {ga.isAvailable ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{ga.city || "No city set"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{ga.phoneNumber || "No phone"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{ga.district || ga.state || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">Joined {formatDate(ga.createdAt)}</span>
              </div>
            </div>

            {/* Assignment Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-gray-900">{ga.totalAssignments}</p>
                <p className="text-[10px] text-gray-500 font-medium">Total</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-orange-700">{ga.activeAssignments}</p>
                <p className="text-[10px] text-orange-600 font-medium">Active</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-700">{ga.completedAssignments}</p>
                <p className="text-[10px] text-emerald-600 font-medium">Done</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedAdmin(ga)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
              >
                <Eye className="h-3.5 w-3.5" /> View Details
              </button>
              {ga.isAvailable ? (
                <button
                  disabled={actionLoading === ga.id}
                  onClick={() => setConfirmAction({ id: ga.id, action: "DEACTIVATE", name: ga.name })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  Deactivate
                </button>
              ) : (
                <button
                  disabled={actionLoading === ga.id}
                  onClick={() => setConfirmAction({ id: ga.id, action: "ACTIVATE", name: ga.name })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No Ground Admin officers found.</p>
            <p className="text-gray-400 text-xs mt-1">
              {search || cityFilter || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Ground Admins can register from the dedicated Ground Admin portal."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>{total} total officers</p>
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

      {/* Detail Modal */}
      {selectedAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAdmin(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Officer Profile</h2>
                <p className="text-xs text-gray-500">{selectedAdmin.email}</p>
              </div>
              <button
                onClick={() => setSelectedAdmin(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${
                    selectedAdmin.isAvailable
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {selectedAdmin.imageUrl ? (
                    <img
                      src={selectedAdmin.imageUrl}
                      alt={selectedAdmin.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(selectedAdmin.name)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedAdmin.name}</h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      selectedAdmin.isAvailable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedAdmin.isAvailable ? "Active Officer" : "Inactive / Deactivated"}
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedAdmin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{selectedAdmin.phoneNumber || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-gray-500">City</p>
                    <p className="font-medium text-gray-900">{selectedAdmin.city || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">District</p>
                    <p className="font-medium text-gray-900">{selectedAdmin.district || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">State</p>
                    <p className="font-medium text-gray-900">{selectedAdmin.state || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Pincode</p>
                    <p className="font-medium text-gray-900">{selectedAdmin.pincode || "Not set"}</p>
                  </div>
                </div>
                {selectedAdmin.address && (
                  <div>
                    <p className="text-[11px] text-gray-500">Full Address</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedAdmin.address}</p>
                  </div>
                )}
              </div>

              {/* Assignment Stats */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Field Assignments</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{selectedAdmin.totalAssignments}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Total</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
                    <p className="text-2xl font-bold text-orange-700">{selectedAdmin.activeAssignments}</p>
                    <p className="text-[10px] text-orange-600 font-medium mt-0.5">Pending</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-700">{selectedAdmin.completedAssignments}</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Completed</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</h4>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span>Registered: {formatDateTime(selectedAdmin.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Last updated: {formatDateTime(selectedAdmin.updatedAt)}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-3 pt-2">
                {selectedAdmin.isAvailable ? (
                  <button
                    disabled={actionLoading === selectedAdmin.id}
                    onClick={() => {
                      setConfirmAction({ id: selectedAdmin.id, action: "DEACTIVATE", name: selectedAdmin.name });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border-2 border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    <ShieldOff className="h-4 w-4" />
                    Deactivate Officer
                  </button>
                ) : (
                  <button
                    disabled={actionLoading === selectedAdmin.id}
                    onClick={() => {
                      setConfirmAction({ id: selectedAdmin.id, action: "ACTIVATE", name: selectedAdmin.name });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Activate Officer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`h-14 w-14 rounded-full mx-auto flex items-center justify-center ${
                confirmAction.action === "DEACTIVATE"
                  ? "bg-red-100"
                  : "bg-emerald-100"
              }`}
            >
              {confirmAction.action === "DEACTIVATE" ? (
                <ShieldOff className="h-7 w-7 text-red-600" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {confirmAction.action === "DEACTIVATE" ? "Deactivate" : "Activate"} Officer?
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {confirmAction.action === "DEACTIVATE"
                  ? `This will prevent ${confirmAction.name} from receiving new field assignments and accessing the Ground Admin dashboard.`
                  : `This will re-enable ${confirmAction.name}'s access to the Ground Admin dashboard and allow them to receive field assignments.`}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === confirmAction.id}
                onClick={() => runAction(confirmAction.id, confirmAction.action)}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50 transition-colors ${
                  confirmAction.action === "DEACTIVATE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading === confirmAction.id ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Yes, ${confirmAction.action === "DEACTIVATE" ? "Deactivate" : "Activate"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
