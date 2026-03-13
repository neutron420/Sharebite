"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Mail,
  MapPin,
  Calendar,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Star,
  Package,
  ShieldAlert,
} from "lucide-react";

interface NGO {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  address: string | null;
  isVerified: boolean;
  imageUrl: string | null;
  createdAt: string;
  strikeCount: number;
  suspensionExpiresAt: string | null;
  isLicenseSuspended: boolean;
  _count: {
    requests: number;
    violations: number;
  };
  reports?: {
    id: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
    reporter: { name: string; email: string };
  }[];
  violations?: {
    id: string;
    level: number;
    reason: string;
    createdAt: string;
  }[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function NGOPartnersPage() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [showBlocklist, setShowBlocklist] = useState(false);
  const [strikeModal, setStrikeModal] = useState<{ ngoId: string, ngoName: string, reason: string, reportId?: string } | null>(null);
  const [restoreModal, setRestoreModal] = useState<{ id: string, name: string } | null>(null);
  const [restoreReason, setRestoreReason] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = 12;

  const fetchNGOs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ngos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch NGOs");
      setNgos(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNGODetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ngos/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch NGO details");
      const data = await res.json();
      setSelectedNGO(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueStrike = async (id: string, reason: string, level?: number, reportId?: string) => {
    try {
      const res = await fetch(`/api/admin/ngos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "STRIKE", reason, level, reportId }),
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to issue strike");
      
      await fetchNGOs(); // Wait for fetch
      if (selectedNGO && selectedNGO.id === id) {
        await fetchNGODetail(id);
      }
    } catch (err) {
      console.error("Error issuing strike:", err);
    }
  };

  const handleUnblock = async () => {
    if (!restoreModal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/ngos/${restoreModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNBLOCK", reason: restoreReason || "Admin manual restoration" }),
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to unblock NGO");
      
      setRestoreModal(null);
      setRestoreReason("");
      await fetchNGOs();
      if (selectedNGO && selectedNGO.id === restoreModal.id) {
        await fetchNGODetail(restoreModal.id);
      }
    } catch (err) {
      console.error("Error unblocking NGO:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => { fetchNGOs(); }, [fetchNGOs]);

  // Filter NGOs
  const filtered = ngos.filter((n) => {
    // Basic search filtering
    const matchesSearch = 
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.email.toLowerCase().includes(search.toLowerCase()) ||
      (n.city && n.city.toLowerCase().includes(search.toLowerCase()));
    
    // Toggle between blocklist and active list
    const isRestricted = n.isLicenseSuspended || n.strikeCount > 0 || (n.suspensionExpiresAt && new Date(n.suspensionExpiresAt) > new Date());
    
    if (showBlocklist) {
      return matchesSearch && isRestricted;
    }

    // Normal filter for active/verified/unverified
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "verified" && n.isVerified) ||
      (statusFilter === "unverified" && !n.isVerified);
    
    return matchesSearch && matchesStatus && !isRestricted;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats calculation
  const stats = {
    total: ngos.length,
    verified: ngos.filter((n) => n.isVerified).length,
    unverified: ngos.filter((n) => !n.isVerified).length,
    suspended: ngos.filter((n) => n.isLicenseSuspended || n.strikeCount > 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading NGO partners...</p>
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
          <button onClick={fetchNGOs} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
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
          <h1 className="text-2xl font-bold text-gray-900">{showBlocklist ? "Restricted NGOs" : "NGO Partners"}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {showBlocklist ? "View and manage suspended or blocked organizations" : "All registered NGOs on the platform"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setShowBlocklist(!showBlocklist); setCurrentPage(1); }} 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
              showBlocklist 
                ? "bg-gray-900 text-white hover:bg-black" 
                : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
            }`}
          >
            {showBlocklist ? <Building2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {showBlocklist ? "View Active Partners" : "View Blocklist"}
          </button>
          <button onClick={fetchNGOs} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Premium Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total NGOs", value: stats.total, icon: Building2, color: "blue" },
          { label: "Verified", value: stats.verified, icon: CheckCircle, color: "green" },
          { label: "Unverified", value: stats.unverified, icon: XCircle, color: "yellow" },
          { label: "Suspended", value: stats.suspended || 0, icon: ShieldAlert, color: "red" }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 leading-none">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-gray-100 animate-pulse rounded" />
                  ) : stat.value}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* NGO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((ngo, idx) => (
          <div 
            key={ngo.id} 
            className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
          >
            {/* Status Glow Background */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-colors ${
              ngo.strikeCount > 0 ? 'bg-red-500' : 'bg-blue-500'
            }`} />

            <div className="flex items-start justify-between mb-5 relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {ngo.imageUrl ? (
                    <img src={ngo.imageUrl} alt={ngo.name} className="h-14 w-14 rounded-2xl object-cover ring-4 ring-gray-50" />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                      {ngo.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {ngo.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white shadow-sm">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{ngo.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {ngo.email}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {ngo.isLicenseSuspended ? (
                  <span className="px-2 py-1 rounded-lg bg-red-50 text-[10px] font-black uppercase text-red-600 border border-red-100">
                    Suspended
                  </span>
                ) : ngo.strikeCount > 0 ? (
                  <span className="px-2 py-1 rounded-lg bg-red-50 text-[10px] font-black uppercase text-red-600 border border-red-100 flex items-center gap-1">
                    <Star className="h-2 w-2 fill-current" /> {ngo.strikeCount} Strikes
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-[10px] font-black uppercase text-blue-600 border border-blue-100">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            {/* Show blocking reason if in blocklist */}
            {showBlocklist && (
              <div className="mb-4 bg-red-50/50 rounded-2xl p-4 border border-red-100/50 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-1 opacity-20">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                 </div>
                 <p className="text-[10px] text-red-600 font-black uppercase mb-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Restriction Reason
                 </p>
                 <p className="text-xs font-semibold text-gray-800 italic line-clamp-2">
                   {ngo.violations?.[0]?.reason || "Multiple policy violations or manual admin block."}
                 </p>
                 <p className="text-[9px] text-gray-400 mt-2">
                   Actioned on {ngo.violations?.[0] ? formatDate(ngo.violations[0].createdAt) : formatDate(ngo.createdAt)}
                 </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6 relative">
              <div className="p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Location</p>
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ngo.city || "Unknown"}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Impact</p>
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Package className="h-3 w-3" /> {ngo._count.requests} Pickups
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-dashed border-gray-100 relative">
               <div className="flex flex-col">
                  <p className="text-[9px] text-gray-400 uppercase font-black">Member Since</p>
                  <p className="text-[11px] font-bold text-gray-600">{formatDate(ngo.createdAt)}</p>
               </div>
              <div className="flex gap-2">
                {((ngo.strikeCount ?? 0) > 0 || ngo.isLicenseSuspended || (ngo.suspensionExpiresAt && new Date(ngo.suspensionExpiresAt) > new Date())) && (
                  <button
                    onClick={() => setRestoreModal({ id: ngo.id, name: ngo.name })}
                    className="px-4 py-2 text-xs font-black bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-all active:scale-95 shadow-sm"
                  >
                    Restore
                  </button>
                )}
                <button
                  onClick={() => fetchNGODetail(ngo.id)}
                  className="px-4 py-2 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  View Detail
                </button>
              </div>
            </div>
          </div>
        ))}
        {paginated.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            {showBlocklist ? (
              <>
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-900 font-bold">Blocklist is Clean!</p>
                <p className="text-gray-500 text-sm mt-1">No NGOs are currently restricted on the platform.</p>
              </>
            ) : (
              <>
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No NGO partners found</p>
              </>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedNGO(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">NGO Details</h2>
              <button onClick={() => setSelectedNGO(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Profile Section */}
              <div className="flex items-center gap-4">
                {selectedNGO.imageUrl ? (
                  <img src={selectedNGO.imageUrl} alt={selectedNGO.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedNGO.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900">{selectedNGO.name}</p>
                  <p className="text-sm text-gray-500">{selectedNGO.email}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedNGO.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                        <CheckCircle className="h-3 w-3" />Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Unverified
                      </span>
                    )}
                    {selectedNGO.isLicenseSuspended && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reports Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                   <Star className="h-4 w-4 text-red-500" /> Recent Complaints ({selectedNGO.reports?.length || 0})
                </h3>
                {selectedNGO.reports && selectedNGO.reports.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNGO.reports.map((report) => (
                      <div key={report.id} className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-orange-800">{report.reason}</p>
                          <span className="text-[10px] text-gray-400">{formatDate(report.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 italic">"{report.details || 'No details provided'}"</p>
                        <p className="text-[10px] text-gray-400 mt-1">— Reported by {report.reporter.name}</p>
                         <button 
                           onClick={() => {
                             setStrikeModal({
                               ngoId: selectedNGO.id,
                               ngoName: selectedNGO.name,
                               reason: report.reason,
                               reportId: report.id
                             });
                             setSelectedLevel(1);
                           }}
                           className="mt-2 text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                         >
                           <ShieldAlert className="h-2 w-2" /> Issue Strike for this
                         </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-2">No complaints filed against this NGO.</p>
                )}
              </div>

              {/* Violation History */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Violation Logs</h3>
                {selectedNGO.violations && selectedNGO.violations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNGO.violations.map((v) => (
                      <div key={v.id} className="bg-gray-50 p-2 rounded-lg text-xs">
                        <div className="flex justify-between">
                          <span className="font-bold text-red-600">Level {v.level} Strike</span>
                          <span className="text-gray-400">{formatDate(v.createdAt)}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{v.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-2">No past violations.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedNGO.phoneNumber || "Not provided"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">City</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedNGO.city || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Strike Confirmation Modal */}
      {strikeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setStrikeModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 flex flex-col scale-in-center">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
               <ShieldAlert className="h-5 w-5 text-red-600" />
               <h2 className="text-lg font-bold text-gray-900">Confirm Strike</h2>
            </div>
            <div className="p-6 space-y-4 text-center">
               <p className="text-sm text-gray-600">
                 Are you sure you want to issue a strike to <span className="font-bold text-gray-900">{strikeModal.ngoName}</span>?
               </p>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Reason</p>
                  <p className="text-xs text-gray-700 italic">"{strikeModal.reason}"</p>
               </div>
               
               <div className="space-y-2 text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase px-1">Select Level</p>
                  <div className="grid grid-cols-1 gap-2">
                     {[1, 2, 3].map((lvl) => (
                       <button
                         key={lvl}
                         onClick={() => setSelectedLevel(lvl)}
                         className={`p-3 rounded-xl border text-left transition-all ${
                           selectedLevel === lvl 
                             ? (lvl === 1 ? 'border-blue-500 bg-blue-50' : lvl === 2 ? 'border-orange-500 bg-orange-50' : 'border-red-500 bg-red-50')
                             : 'border-gray-100 bg-gray-50/50'
                         }`}
                       >
                         <p className="text-xs font-bold">Level {lvl}: {lvl === 1 ? 'Warning' : lvl === 2 ? '1-Month Block' : 'Permanent Ban'}</p>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="flex flex-col gap-2 pt-2">
                  <button 
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      await handleIssueStrike(strikeModal.ngoId, strikeModal.reason, selectedLevel, strikeModal.reportId);
                      setIsSubmitting(false);
                      setStrikeModal(null);
                    }}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 shadow-lg shadow-red-200"
                  >
                    {isSubmitting ? "Processing..." : "CONFIRM STRIKE"}
                  </button>
                  <button onClick={() => setStrikeModal(null)} className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-[10px] hover:bg-gray-200">
                    CANCEL
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Restore Access Modal */}
      {restoreModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setRestoreModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 flex flex-col scale-in-center">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center gap-3">
               <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
               </div>
               <h2 className="text-lg font-bold text-gray-900">Restore Access</h2>
            </div>
            <div className="p-6 space-y-4">
               <p className="text-sm text-gray-600 text-center">
                 Lift all penalties and restore full access for <span className="font-bold text-gray-900">{restoreModal.name}</span>?
               </p>
               
               <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase px-1">Reason for Restoration</p>
                  <textarea
                    value={restoreReason}
                    onChange={(e) => setRestoreReason(e.target.value)}
                    placeholder="e.g. Penalty expired, proof provided, etc."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px] resize-none"
                  />
               </div>

               <div className="flex flex-col gap-2 pt-2">
                  <button 
                    disabled={isSubmitting}
                    onClick={handleUnblock}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? "Restoring..." : "CONFIRM RESTORATION"}
                  </button>
                  <button onClick={() => setRestoreModal(null)} className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-[10px] hover:bg-gray-200">
                    GO BACK
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
