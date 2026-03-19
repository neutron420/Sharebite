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
  ClipboardList,
  ShieldAlert,
  X,
  Mail,
  Phone,
  Eye,
  Info,
  ShieldCheck,
  Hammer,
  Gavel,
  CheckCircle2,
  Users
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  donorType?: string;
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: UserInfo;
  ngo?: UserInfo; // For complaints against NGOs
  donor?: UserInfo; // For complaints against Donors
}

interface StrikeModalData {
  reportId: string;
  userId: string;
  userName: string;
  reason: string;
  reportType: "NGO_REPORT" | "DONOR_REPORT";
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
  const [reportType, setReportType] = useState<"NGO_REPORT" | "DONOR_REPORT">("NGO_REPORT");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Modal State
  const [strikeModal, setStrikeModal] = useState<StrikeModalData | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [successModal, setSuccessModal] = useState<{ userName: string, level: number } | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const apiPath = reportType === "NGO_REPORT" ? "/api/reports" : "/api/donor-reports";
      const res = await fetch(`${apiPath}?status=${statusFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      setReports(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reportType]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleIssueStrike = async () => {
    if (!strikeModal?.userId) {
      alert("Error: User ID is missing. Please refresh the page.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${strikeModal.userId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "STRIKE", 
          reason: strikeModal.reason,
          level: selectedLevel,
          reportId: strikeModal.reportId,
          reportType: strikeModal.reportType
        }),
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to issue strike");

      const userName = strikeModal.userName;
      const level = selectedLevel;

      setStrikeModal(null);
      setSelectedLevel(1);
      fetchReports();
      
      // Trigger Success Popup
      setSuccessModal({ userName, level });
    } catch (err) {
      console.error(err);
      alert("Failed to issue strike. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: "RESOLVED" | "DISMISSED") => {
    setActionLoading(reportId);
    try {
      const apiPath = reportType === "NGO_REPORT" ? "/api/reports" : "/api/donor-reports";
      const res = await fetch(`${apiPath}/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to update report status.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = reports.filter((r) => {
    const query = search.toLowerCase();
    const targetUser = reportType === "NGO_REPORT" ? r.ngo : r.donor;
    return (
      targetUser?.name.toLowerCase().includes(query) ||
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
    dismissed: reports.filter(r => r.status === "DISMISSED").length,
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
          <h1 className="text-2xl font-bold text-gray-900">System Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and resolve reports filed by the community</p>
        </div>
        <button onClick={fetchReports} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Report Type Toggle Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => { setReportType("NGO_REPORT"); setCurrentPage(1); }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            reportType === "NGO_REPORT" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Building2 className="w-4 h-4" /> NGO Misconduct
        </button>
        <button
          onClick={() => { setReportType("DONOR_REPORT"); setCurrentPage(1); }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            reportType === "DONOR_REPORT" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Users className="w-4 h-4" /> Donor Misconduct
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.dismissed}</p>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Dismissed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Total</p>
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
              placeholder={`Search ${reportType === "NGO_REPORT" ? "NGO" : "donor"} reports...`}
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
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-1/4">
                  Reported {reportType === "NGO_REPORT" ? "NGO" : "Donor"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Reporter</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-1/4">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((report) => {
                const targetUser = reportType === "NGO_REPORT" ? report.ngo : report.donor;
                if (!targetUser) return null;

                return (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            reportType === "NGO_REPORT" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                          }`}>
                            {targetUser.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{targetUser.name}</p>
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] text-gray-400">{targetUser.email}</p>
                              {reportType === "DONOR_REPORT" && targetUser.donorType && (
                                <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded uppercase font-bold tracking-tighter">
                                  {targetUser.donorType.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <a href={`mailto:${targetUser.email}`} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-orange-600">
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
                            <p className="font-medium text-gray-900">{report.reporter.name}</p>
                            <p className="text-[10px] text-gray-400">{report.reporter.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-bold text-orange-700">{report.reason}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{report.details || "No details"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 
                        report.status === 'RESOLVED' ? 'bg-green-50 text-green-600' : 
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {report.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-nowrap">
                        <button
                          onClick={() => setDetailReport(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </button>

                        {report.status === "PENDING" && (
                          <>
                            <button 
                              onClick={() => setStrikeModal({
                                reportId: report.id,
                                userId: targetUser.id,
                                userName: targetUser.name,
                                reason: report.reason,
                                reportType: reportType
                              })}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" /> Action
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(report.id, "DISMISSED")}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
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
          <span className="text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* --- Detail Modal --- */}
      {detailReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => setDetailReport(null)} />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 max-w-2xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 shadow-none">
            <div className="bg-blue-50/50 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Complaint Details</h2>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Report ID: {detailReport.id}</p>
                </div>
              </div>
              <button onClick={() => setDetailReport(null)} className="p-2 rounded-xl hover:bg-blue-100 text-gray-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Row 1: Who and When */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Submitted By</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {detailReport.reporter.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{detailReport.reporter.name}</p>
                      <p className="text-xs text-gray-500 underline">{detailReport.reporter.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Report Date</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatDate(detailReport.createdAt)}</p>
                      <p className="text-xs text-gray-500">Auto-recorded timestamp</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Target User */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Reported {reportType === "NGO_REPORT" ? "NGO" : "Donor"}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      reportType === "NGO_REPORT" ? "bg-blue-600" : "bg-purple-600"
                    }`}>
                      {(reportType === "NGO_REPORT" ? detailReport.ngo : detailReport.donor)?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900 leading-tight">{(reportType === "NGO_REPORT" ? detailReport.ngo : detailReport.donor)?.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-medium">{(reportType === "NGO_REPORT" ? detailReport.ngo : detailReport.donor)?.email}</p>
                        {reportType === "DONOR_REPORT" && detailReport.donor?.donorType && (
                          <span className="text-[9px] bg-orange-600 text-white px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest">
                            {detailReport.donor.donorType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`mailto:${(reportType === "NGO_REPORT" ? detailReport.ngo : detailReport.donor)?.email}`} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-orange-600 shadow-sm transition-all hover:scale-105">
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Row 3: Violation & Details */}
              <div className="space-y-4">
                <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Reason for Complaint</p>
                  </div>
                  <p className="text-xl font-bold text-orange-900 leading-snug">{detailReport.reason}</p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-inner">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-1">Detailed Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {detailReport.details || "The reporter did not provide any additional details for this complaint."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setDetailReport(null)}
                className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Close View
              </button>
              {detailReport.status === "PENDING" && (
                <button 
                  onClick={() => {
                    const targetUser = reportType === "NGO_REPORT" ? detailReport.ngo : detailReport.donor;
                    if (targetUser) {
                      setStrikeModal({
                        reportId: detailReport.id,
                        userId: targetUser.id,
                        userName: targetUser.name,
                        reason: detailReport.reason,
                        reportType: reportType
                      });
                      setDetailReport(null);
                    }
                  }}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4" /> Issue Action
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Strike Modal --- */}
      {strikeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => setStrikeModal(null)} />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 max-w-lg w-full overflow-hidden flex flex-col overflow-y-auto max-h-[90vh] shadow-none">
            <div className="bg-red-50/50 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-white/20">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-100 rounded-xl">
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                 </div>
                 <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Issue Penalty Action</h2>
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
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Target Account</p>
                     <p className="text-md font-bold text-gray-900 flex items-center gap-2">
                        {strikeModal.reportType === "NGO_REPORT" ? <Building2 className="h-4 w-4 text-blue-500" /> : <User className="h-4 w-4 text-purple-500" />} {strikeModal.userName}
                     </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Violation Reason</p>
                     <p className="text-sm text-gray-700 italic">"{strikeModal.reason}"</p>
                  </div>
               </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 px-1 uppercase tracking-widest">Select Penalty Level</p>
                  <div className="grid grid-cols-1 gap-2">
                     {[1, 2, 3].map((lvl) => (
                       <button 
                          key={lvl}
                          onClick={() => setSelectedLevel(lvl)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                            selectedLevel === lvl ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-100 bg-white'
                          }`}
                       >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            selectedLevel === lvl ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>{lvl}</div>
                          <div>
                             <p className="text-sm font-bold text-gray-900">
                               Level {lvl}: {lvl === 1 ? 'Warning' : lvl === 2 ? '1-Month Suspension' : 'Permanent Revocation'}
                             </p>
                             <p className="text-[10px] text-gray-500">
                               {lvl === 1 ? 'Non-destructive warning. User is notified and cautioned.' : 
                                lvl === 2 ? 'Temporary block. Account is disabled for 30 days.' : 
                                'Maximum penalty. Account access is permanently revoked.'}
                             </p>
                          </div>
                       </button>
                     ))}
                  </div>
                </div>

               <div className="pt-4 flex flex-col gap-3">
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
                    CANCEL ACTION
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Action Success Modal --- */}
      {successModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => setSuccessModal(null)} />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white/20 max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 shadow-none">
            <div className={`h-32 flex items-center justify-center relative ${
              successModal.level === 1 ? 'bg-blue-600' : successModal.level === 2 ? 'bg-orange-600' : 'bg-red-600'
            }`}>
              <div className="relative bg-white/20 backdrop-blur-xl p-5 rounded-full ring-8 ring-white/10">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>

            <div className="p-10 text-center space-y-6">
              <h3 className="text-2xl font-black text-gray-900 leading-tight">Action Enforced</h3>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-sm text-gray-500">Action applied to account:</p>
                <p className="text-lg font-black text-gray-900 uppercase">{successModal.userName}</p>
              </div>
              <button 
                onClick={() => setSuccessModal(null)}
                className="w-full py-4 bg-slate-900 rounded-2xl font-black text-sm text-white hover:bg-orange-600 transition-all shadow-xl"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
