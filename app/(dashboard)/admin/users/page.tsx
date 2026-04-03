"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Building2,
  Heart,
  CheckCircle,
  XCircle,
  Mail,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "NGO" | "ADMIN" | "RIDER";
  isVerified: boolean;
  city: string | null;
  donorType: string | null;
  createdAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; icon: typeof Users }> = {
  DONOR: { bg: "bg-orange-50", text: "text-orange-600", icon: Heart },
  NGO: { bg: "bg-blue-50", text: "text-blue-600", icon: Building2 },
  ADMIN: { bg: "bg-purple-50", text: "text-purple-600", icon: Shield },
  RIDER: { bg: "bg-emerald-50", text: "text-emerald-600", icon: Users },
};
const DEFAULT_ROLE_STYLE = { bg: "bg-gray-100", text: "text-gray-600", icon: Users };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(roleParam || "all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      // API returns { users: [...], pagination: {...} }
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (roleParam) setRoleFilter(roleParam);
  }, [roleParam]);

  const handleVerify = async (user: User, isVerified: boolean) => {
    if (user.role === "RIDER") {
      alert("Use the Riders Verification page for final rider approvals.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified }),
      });
      if (!res.ok) throw new Error("Failed to update verification");
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isVerified } : u));
      setSelectedUser(null);
    } catch (err) {
      alert("Failed to update verification status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users
  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city && u.city.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesVerified = verifiedFilter === "all" || 
      (verifiedFilter === "verified" && u.isVerified) ||
      (verifiedFilter === "unverified" && !u.isVerified);
    return matchesSearch && matchesRole && matchesVerified;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const stats = {
    total: users.length,
    donors: users.filter((u) => u.role === "DONOR").length,
    ngos: users.filter((u) => u.role === "NGO").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading users...</p>
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
          <button onClick={fetchUsers} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
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
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all platform users</p>
        </div>
        <button onClick={fetchUsers} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Heart className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.donors}</p>
              <p className="text-sm text-gray-500">Donors</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.ngos}</p>
              <p className="text-sm text-gray-500">NGOs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="DONOR">Donors</option>
              <option value="NGO">NGOs</option>
              <option value="ADMIN">Admins</option>
              <option value="RIDER">Riders</option>
            </select>
            <select
              value={verifiedFilter}
              onChange={(e) => { setVerifiedFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((u) => {
                const roleStyle = ROLE_STYLES[u.role] ?? DEFAULT_ROLE_STYLE;
                const RoleIcon = roleStyle.icon;
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                        <RoleIcon className="h-3 w-3" />{u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.city ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />{u.city}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">
                          <CheckCircle className="h-3 w-3" />Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                          <XCircle className="h-3 w-3" />Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedUser(u)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900" title="View">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found</td>
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md animate-in fade-in zoom-in duration-300 shadow-none" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/20 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">Role</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedUser.role}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedUser.isVerified ? "Verified" : "Unverified"}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">City</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedUser.city || "Not set"}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">Joined</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedUser.createdAt)}</p>
                </div>
                {selectedUser.role === "DONOR" && (
                  <div className="bg-orange-50/50 backdrop-blur-md rounded-lg p-3 border border-orange-200/50 col-span-2">
                    <p className="text-xs text-orange-500 uppercase font-black tracking-widest">Donor Category</p>
                    <p className="text-sm font-black text-orange-700 mt-1 uppercase italic tracking-tighter">
                      {selectedUser.donorType?.replace(/_/g, " ") || "NORMAL VERSION"}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                {selectedUser.role !== "ADMIN" && (
                  <>
                    {selectedUser.role === "RIDER" ? (
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          router.push("/admin/riders-verification");
                        }}
                        className="flex-1 px-4 py-2 border border-orange-200 rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100"
                      >
                        Open Riders Verification
                      </button>
                    ) : selectedUser.isVerified ? (
                      <button onClick={() => handleVerify(selectedUser, false)} disabled={actionLoading} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                        Unverify
                      </button>
                    ) : (
                      <button onClick={() => handleVerify(selectedUser, true)} disabled={actionLoading} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                        <UserCheck className="h-4 w-4 inline mr-2" />Verify
                      </button>
                    )}
                    <button onClick={() => { setSelectedUser(null); setDeleteConfirm(selectedUser); }} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-300 shadow-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">Delete User?</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
