"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Flag,
  Send,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  ShieldCheck,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface UserInfo {
  imageUrl: any;
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PostInfo {
  id: string;
  caption: string;
  imageUrl: string;
  author: UserInfo;
}

interface CommunityReport {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: UserInfo;
  post: PostInfo;
}

interface StrikeModalData {
  reportId: string;
  userId: string;
  userName: string;
  reason: string;
  reportType: "COMMUNITY_REPORT";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { 
    month: "short", 
    day: "numeric", 
    year: "numeric"
  });
}

export default function CommunityReportsAdminPage() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detailReport, setDetailReport] = useState<CommunityReport | null>(null);
  const [strikeModal, setStrikeModal] = useState<StrikeModalData | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<any>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/community-reports?status=${statusFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      setReports(await res.json());
    } catch (err) {
      toast.error("Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/community-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success(`Entry marked as ${newStatus.toLowerCase()}`);
        fetchReports();
      }
    } catch {
      toast.error("Process failed");
    }
  };

  const handleIssueStrike = async () => {
    if (!strikeModal) return;
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

      if (res.ok) {
        setSuccessModal({ userName: strikeModal.userName, level: selectedLevel });
        setStrikeModal(null);
        fetchReports();
      }
    } catch {
      toast.error("Failed to apply action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = reports.filter(r => 
    r.post.author.name.toLowerCase().includes(search.toLowerCase()) || 
    r.reporter.name.toLowerCase().includes(search.toLowerCase()) ||
    r.reason.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
       <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Community Moderation</h1>
          <p className="text-slate-500 text-sm">Review content flags from ShareBite Hive feed</p>
        </div>
        <button onClick={fetchReports} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold text-sm">
          <RefreshCw size={16} /> Sync Queue
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Flag size={20} /></div>
              <div>
                 <p className="text-2xl font-black text-slate-900">{reports.length}</p>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{statusFilter} Flags</p>
              </div>
           </div>
        </div>
        {/* Placeholder for more stats */}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by author, reporter or reason..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
         </div>
         <select 
           value={statusFilter}
           onChange={(e) => setStatusFilter(e.target.value)}
           className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
         >
            <option value="PENDING">Pending Flags</option>
            <option value="RESOLVED">Resolved Content</option>
            <option value="DISMISSED">Expired Flags</option>
         </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Content Author</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {paginated.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 border relative overflow-hidden shrink-0">
                                {report.post.author.imageUrl ? (
                                   <Image src={report.post.author.imageUrl} alt={report.post.author.name} fill className="object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 uppercase">{report.post.author.name.charAt(0)}</div>
                                )}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900">{report.post.author.name}</p>
                                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tight">{report.post.author.role}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div>
                             <p className="text-xs font-bold text-slate-700">{report.reporter.name}</p>
                             <p className="text-[10px] text-slate-400">{report.reporter.email}</p>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                             <span className="text-xs font-black text-slate-900">{report.reason}</span>
                             <span className="text-[10px] text-slate-400 line-clamp-1 italic">{report.details || "No metadata provided"}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={() => setDetailReport(report)}
                               className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all"
                               title="Details"
                             >
                                <Eye size={18} />
                             </button>
                             {report.status === "PENDING" && (
                               <>
                                 <button 
                                   onClick={() => setStrikeModal({
                                     reportId: report.id,
                                     userId: report.post.author.id,
                                     userName: report.post.author.name,
                                     reason: report.reason,
                                     reportType: "COMMUNITY_REPORT"
                                   })}
                                   className="p-2.5 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all"
                                   title="Issue Penalty"
                                 >
                                    <ShieldAlert size={18} />
                                 </button>
                                 <button 
                                   onClick={() => handleUpdateStatus(report.id, "DISMISSED")}
                                   className="p-2.5 bg-slate-50 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                   title="Dismiss Flag"
                                 >
                                    <XCircle size={18} />
                                 </button>
                               </>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                       <td colSpan={4} className="py-20 text-center">
                          <ClipboardList size={40} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold">Inbox zero! No active flags found.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
           <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 bg-white border rounded-lg disabled:opacity-50"><ChevronLeft size={20} /></button>
           <span className="text-sm font-black text-slate-900">{currentPage} / {totalPages}</span>
           <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 bg-white border rounded-lg disabled:opacity-50"><ChevronRight size={20} /></button>
        </div>
      )}

      {/* Flag View Modal */}
      {detailReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDetailReport(null)} />
           <div className="relative bg-white max-w-2xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Flag size={24} /></div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900">Incident Details</h2>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID: {detailReport.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setDetailReport(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={24} /></button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Reported Moment</p>
                    <div className="flex gap-4">
                       <div className="w-32 aspect-square relative rounded-2xl overflow-hidden border-4 border-white shadow-xl rotate-2 shrink-0">
                          <Image src={detailReport.post.imageUrl} alt="Violation" fill className="object-cover" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900 leading-relaxed italic">"{detailReport.post.caption}"</p>
                          <div className="mt-4 flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden relative">
                                {detailReport.post.author.imageUrl && <Image src={detailReport.post.author.imageUrl} fill alt="A" className="object-cover" />}
                             </div>
                             <span className="text-[10px] font-black uppercase text-slate-400">By {detailReport.post.author.name}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-3xl">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Reporter</span>
                       <p className="text-sm font-black text-slate-900">{detailReport.reporter.name}</p>
                       <p className="text-[10px] text-slate-400 underline">{detailReport.reporter.email}</p>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-3xl">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Timestamp</span>
                       <p className="text-sm font-black text-slate-900">{formatDate(detailReport.createdAt)}</p>
                       <p className="text-[10px] text-slate-400">Auto-logged incident</p>
                    </div>
                 </div>

                 <div className="p-6 bg-red-50/50 border border-red-100 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldAlert size={14} className="text-red-500" />
                       <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Reason for Flag</span>
                    </div>
                    <p className="text-lg font-black text-red-900 leading-tight mb-3">{detailReport.reason}</p>
                    <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
                       <p className="text-xs text-slate-600 leading-relaxed italic">{detailReport.details || "No supplemental details provided."}</p>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button onClick={() => setDetailReport(null)} className="flex-1 py-4 font-black text-sm uppercase bg-white border text-slate-500 rounded-2xl hover:bg-slate-100 transition-all">Close</button>
                  {detailReport.status === "PENDING" && (
                    <button 
                      onClick={() => {
                        setStrikeModal({
                          reportId: detailReport.id,
                          userId: detailReport.post.author.id,
                          userName: detailReport.post.author.name,
                          reason: detailReport.reason,
                          reportType: "COMMUNITY_REPORT"
                        });
                        setDetailReport(null);
                      }}
                      className="flex-1 py-4 font-black text-sm uppercase bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95"
                    >
                      Issue Penalty
                    </button>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* Action Choice Modal (Cloned from Admin Reports) */}
      {strikeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setStrikeModal(null)} />
           <div className="relative bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><ShieldAlert size={28} /></div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900">System Penalty</h2>
                       <p className="text-xs text-red-600 font-bold uppercase tracking-widest">Target Account: @{strikeModal.userName}</p>
                    </div>
                 </div>
                 <button onClick={() => setStrikeModal(null)} className="p-2 hover:bg-red-100 rounded-xl text-slate-400"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6">
                 {[1, 2, 3].map((lv) => (
                    <button 
                      key={lv} 
                      onClick={() => setSelectedLevel(lv)}
                      className={`w-full text-left p-5 rounded-3xl border-2 transition-all flex gap-4 ${selectedLevel === lv ? 'border-orange-500 bg-orange-50 shadow-lg' : 'border-slate-50 bg-slate-50 opacity-60'}`}
                    >
                       <div className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center shrink-0 ${selectedLevel === lv ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{lv}</div>
                       <div>
                          <p className="text-sm font-black text-slate-900 uppercase">Level {lv}: {lv === 1 ? 'Warning' : lv === 2 ? '1-Month Lock' : 'Full Revocation'}</p>
                          <p className="text-xs text-slate-400 mt-1">{lv === 1 ? 'Official warning notification sent to user.' : lv === 2 ? 'Temporary 30-day block on all app features.' : 'Permanent account suspension and doc invalidation.'}</p>
                       </div>
                    </button>
                 ))}
                 
                 <div className="pt-4 flex flex-col gap-3">
                    <button 
                      onClick={handleIssueStrike}
                      disabled={isSubmitting}
                      className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black uppercase text-sm tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                       {isSubmitting ? "Syncing..." : "Confirm Deployment"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setSuccessModal(null)} />
           <div className="relative bg-white max-w-sm w-full rounded-[3rem] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-xl">
                 <ShieldCheck size={40} className="text-orange-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tighter">Penalty <br/>Deployed.</h2>
              <div className="bg-slate-50 p-4 rounded-2xl mb-8">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Target Account</p>
                 <p className="text-lg font-black text-slate-900">{successModal.userName}</p>
              </div>
              <button onClick={() => setSuccessModal(null)} className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-orange-600 transition-all">Acknowledge</button>
           </div>
        </div>
      )}
    </div>
  );
}
