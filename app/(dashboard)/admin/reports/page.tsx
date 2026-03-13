"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
  ClipboardList,
  ShieldAlert,
  X,
  Mail,
  Phone,
  MessageSquare
} from "lucide-react";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: {
    name: string;
    email: string;
  };
  ngo: {
    id: string;
    name: string;
    email: string;
  };
}

interface StrikeModalData {
  reportId: string;
  ngoId: string;
  ngoName: string;
  reason: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Modal State
  const [strikeModal, setStrikeModal] = useState<StrikeModalData | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?status=${statusFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      setReports(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleIssueStrike = async () => {
    if (!strikeModal?.ngoId) {
      alert("Error: NGO ID is missing. Please refresh the page.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/ngos/${strikeModal.ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "STRIKE", 
          reason: strikeModal.reason,
          level: selectedLevel,
          reportId: strikeModal.reportId
        }),
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to issue strike");

      setStrikeModal(null);
      setSelectedLevel(1);
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = reports.filter((r) => {
    const query = search.toLowerCase();
    return (
      r.ngo.name.toLowerCase().includes(query) ||
      r.reporter.name.toLowerCase().includes(query) ||
      r.reason.toLowerCase().includes(query) ||
      (r.details && r.details.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "PENDING").length,
    resolved: reports.filter(r => r.status === "RESOLVED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donor Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">Reports submitted by donors regarding NGO misconduct</p>
        </div>
        <button onClick={fetchReports} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending Reports</p>
            </div>
          </div>
        </div>
         <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              <p className="text-sm text-gray-500">Total in Current View</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
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
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">NGO</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Reporter</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {report.ngo.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{report.ngo.name}</p>
                          <p className="text-[10px] text-gray-400">{report.ngo.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <a href={`tel:${report.ngo.email}`} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Call NGO">
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        <a href={`mailto:${report.ngo.email}`} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-orange-600" title="Email NGO">
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.reporter.name}</p>
                          <p className="text-[10px] text-gray-400">{report.reporter.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                         <a href={`mailto:${report.reporter.email}`} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-orange-600" title="Email Donor">
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-bold text-orange-700">{report.reason}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{report.details || "No details"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${
                      report.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {report.status}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      {formatDate(report.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setStrikeModal({
                           reportId: report.id,
                           ngoId: report.ngo.id,
                           ngoName: report.ngo.name,
                           reason: report.reason
                         })}
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm transition-all active:scale-95"
                       >
                         <ShieldAlert className="h-3 w-3" /> Take Action
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No complaints found matching current filters.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

      {/* Premium Custom Modal for Strike Action */}
      {strikeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setStrikeModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col scale-in-center">
            <div className="bg-red-50 px-8 py-6 flex items-center justify-between border-b border-red-100">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-100 rounded-xl">
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                 </div>
                 <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Issue Disciplinary Action</h2>
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider">System Enforcement</p>
                 </div>
               </div>
               <button onClick={() => setStrikeModal(null)} className="p-2 rounded-xl hover:bg-red-100 text-gray-500 transition-colors">
                  <X className="h-5 w-5" />
               </button>
            </div>

            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Target NGO</p>
                     <p className="text-md font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" /> {strikeModal.ngoName}
                     </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Violation Reason</p>
                     <p className="text-sm text-gray-700 italic">"{strikeModal.reason}"</p>
                  </div>
               </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 px-1">SELECT PENALTY LEVEL</p>
                  <div className="grid grid-cols-1 gap-2">
                     <button 
                        onClick={() => setSelectedLevel(1)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedLevel === 1 ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-blue-100 bg-blue-50/30'
                        }`}
                     >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          selectedLevel === 1 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                        }`}>1</div>
                        <div>
                           <p className="text-xs font-bold text-blue-900">Level 1: System Warning</p>
                           <p className="text-[10px] text-blue-600">Minor violation. NGO will be notified and cautioned.</p>
                        </div>
                     </button>
                     <button 
                        onClick={() => setSelectedLevel(2)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedLevel === 2 ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-orange-100 bg-orange-50/30'
                        }`}
                     >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          selectedLevel === 2 ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                        }`}>2</div>
                        <div>
                           <p className="text-xs font-bold text-orange-900">Level 2: 1-Month Suspension</p>
                           <p className="text-[10px] text-orange-600">Repeated violation. NGO is blocked from all pickups for 30 days.</p>
                        </div>
                     </button>
                     <button 
                        onClick={() => setSelectedLevel(3)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedLevel === 3 ? 'border-red-500 bg-red-50 shadow-sm' : 'border-red-100 bg-red-50/30'
                        }`}
                     >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          selectedLevel === 3 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                        }`}>3</div>
                        <div>
                           <p className="text-xs font-bold text-red-900">Level 3: Permanent License Revocation</p>
                           <p className="text-[10px] text-red-600">Critical violation. Account is banned and deactivated permanently.</p>
                        </div>
                     </button>
                  </div>
                </div>

               <div className="pt-4 flex flex-col gap-3">
                  <p className="text-[11px] text-gray-400 text-center italic">
                    Note: The system will automatically calculate the strike level based on history.
                  </p>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleIssueStrike}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-extrabold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4" /> CONFIRM & ISSUE PENALTY
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setStrikeModal(null)}
                    className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-colors"
                  >
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
