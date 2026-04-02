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
  MoreHorizontal,
  Trash2,
  Ban
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  strikeCount: number;
}

interface HiveViolation {
  id: string;
  type: string;
  content: string;
  reason: string;
  createdAt: string;
  user: UserInfo;
}

interface StrikeModalData {
  violationId: string;
  userId: string;
  userName: string;
  reason: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-IN", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function HiveSafetyAdminPage() {
  const [violations, setViolations] = useState<HiveViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detailViolation, setDetailViolation] = useState<HiveViolation | null>(null);
  const [strikeModal, setStrikeModal] = useState<StrikeModalData | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<any>(null);

  const fetchViolations = useCallback(async () => {
    try {
      setLoading(true);
      const url = typeFilter === "ALL" 
        ? "/api/admin/hive-violations" 
        : `/api/admin/hive-violations?type=${typeFilter}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch violations");
      setViolations(await res.json());
    } catch (err) {
      toast.error("Failed to load Hive Guard logs");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const handleDismiss = async (id: string) => {
    if (!confirm("Are you sure you want to dismiss this violation log?")) return;
    try {
      const res = await fetch(`/api/admin/hive-violations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Violation record dismissed");
        fetchViolations();
      }
    } catch {
      toast.error("Dismissal failed");
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
          reason: `Hive Guard Violation: ${strikeModal.reason}`,
          level: selectedLevel,
        }),
        credentials: "include"
      });

      if (res.ok) {
        // Also delete the violation log upon strike
        await fetch(`/api/admin/hive-violations/${strikeModal.violationId}`, { method: "DELETE" });
        
        setSuccessModal({ userName: strikeModal.userName, level: selectedLevel });
        setStrikeModal(null);
        fetchViolations();
      }
    } catch {
      toast.error("Failed to apply action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = violations.filter(v => 
    v.user.name.toLowerCase().includes(search.toLowerCase()) || 
    v.user.email.toLowerCase().includes(search.toLowerCase()) ||
    v.reason.toLowerCase().includes(search.toLowerCase())
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
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ShieldAlert size={18} /></div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hive Guard Safety logs</h1>
          </div>
          <p className="text-slate-500 text-sm">Automated AI detection logs for inappropriate community content</p>
        </div>
        <button onClick={fetchViolations} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold text-sm transition-all shadow-sm">
          <RefreshCw size={16} /> Sync AI Logs
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search user, email or violation reason..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
         </div>
         <div className="flex gap-2">
            {["ALL", "IMAGE", "TEXT"].map(t => (
               <button
                 key={t}
                 onClick={() => setTypeFilter(t)}
                 className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${typeFilter === t ? 'bg-slate-950 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}
               >
                  {t}
               </button>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Offender</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">AI detection Reason</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {paginated.map((violation) => (
                    <tr key={violation.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center font-black text-slate-400 uppercase tracking-tighter">
                                {violation.user.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900">{violation.user.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{violation.user.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${violation.type === "IMAGE" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                             {violation.type === "IMAGE" ? <Camera size={12} /> : <AlertTriangle size={12} />} {violation.type}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="max-w-md">
                             <p className="text-xs font-bold text-red-600 leading-relaxed mb-0.5 line-clamp-1">{violation.reason}</p>
                             <p className="text-[10px] text-slate-400 line-clamp-1 italic">Logged: {formatDate(violation.createdAt)}</p>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => setDetailViolation(violation)}
                               className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all"
                               title="Details"
                             >
                                <Eye size={18} />
                             </button>
                             <button 
                               onClick={() => setStrikeModal({
                                 violationId: violation.id,
                                 userId: violation.user.id,
                                 userName: violation.user.name,
                                 reason: violation.reason,
                               })}
                               className="p-2.5 bg-red-50 text-red-400 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all"
                               title="Issue Penalty"
                             >
                                <ShieldAlert size={18} />
                             </button>
                             <button 
                               onClick={() => handleDismiss(violation.id)}
                               className="p-2.5 bg-slate-50 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                               title="Dismiss Log"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                       <td colSpan={4} className="py-24 text-center">
                          <ShieldCheck size={64} className="mx-auto text-emerald-100 mb-6" />
                          <p className="text-slate-400 text-lg font-black tracking-tight uppercase">Hive Guard Clear</p>
                          <p className="text-slate-300 text-xs mt-1">AI has not intercepted any inappropriate attempts recently.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Flag View Modal */}
      {detailViolation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDetailViolation(null)} />
           <div className="relative bg-white max-w-xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-100">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm"><ShieldAlert size={28} /></div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900">Security event Detail</h2>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ID: {detailViolation.id.substring(0,8)}... INCIDENT</p>
                    </div>
                 </div>
                 <button onClick={() => setDetailViolation(null)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-8">
                 <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Flag size={80} /></div>
                    <p className="text-[10px] font-black uppercase text-red-800 tracking-widest mb-4">Interception Breakdown</p>
                    <p className="text-2xl font-black text-red-950 leading-tight mb-2 tracking-tighter">{detailViolation.reason}</p>
                    <div className="bg-white/40 p-4 rounded-2xl border border-white/50 backdrop-blur-sm">
                       <p className="text-xs text-red-900 font-bold leading-relaxed italic">
                          "{detailViolation.type === "IMAGE" ? "Image URL intercepted" : detailViolation.content}"
                       </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-3xl">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Offender Account</span>
                       <p className="text-sm font-black text-slate-900 line-clamp-1">{detailViolation.user.name}</p>
                       <div className="flex items-center gap-1 mt-1 text-orange-600 ">
                          <ShieldAlert size={10} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Strikes: {detailViolation.user.strikeCount}</span>
                       </div>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-3xl">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Timestamp</span>
                       <p className="text-sm font-black text-slate-900">{formatDate(detailViolation.createdAt).split(",")[0]}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{formatDate(detailViolation.createdAt).split(",")[1]}</p>
                    </div>
                 </div>

                 {detailViolation.type === "IMAGE" && (
                    <div className="p-2 border border-slate-100 rounded-[2rem] bg-slate-50">
                       <div className="h-48 w-full relative rounded-[1.8rem] overflow-hidden shadow-inner border border-white">
                          <Image src={detailViolation.content} alt="Violation Image" fill className="object-cover contrast-125 grayscale-[0.5]" />
                          <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center">
                             <span className="bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Blocked Content</span>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button onClick={() => setDetailViolation(null)} className="flex-1 py-4 font-black text-xs uppercase bg-white border text-slate-500 rounded-2xl hover:bg-slate-100 transition-all tracking-widest">Close log</button>
                  <button 
                    onClick={() => {
                      setStrikeModal({
                        violationId: detailViolation.id,
                        userId: detailViolation.user.id,
                        userName: detailViolation.user.name,
                        reason: detailViolation.reason,
                      });
                      setDetailViolation(null);
                    }}
                    className="flex-1 py-4 font-black text-xs uppercase bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all tracking-widest active:scale-95"
                  >
                    Issue Penalty
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Action Choice Modal */}
      {strikeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setStrikeModal(null)} />
           <div className="relative bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-100">
              <div className="p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm"><Ban size={28} /></div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900">System Penalty</h2>
                       <p className="text-xs text-red-600 font-bold uppercase tracking-widest leading-none mt-1">Hive Guardian Enforcement Hub</p>
                    </div>
                 </div>
                 <button onClick={() => setStrikeModal(null)} className="p-2 hover:bg-red-100 rounded-xl text-slate-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6">
                 {[1, 2, 3].map((lv) => (
                    <button 
                      key={lv} 
                      onClick={() => setSelectedLevel(lv)}
                      className={`w-full text-left p-5 rounded-3xl border-2 transition-all flex gap-4 ${selectedLevel === lv ? 'border-red-500 bg-red-50 shadow-lg' : 'border-slate-50 bg-slate-50 opacity-60'}`}
                    >
                       <div className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center shrink-0 ${selectedLevel === lv ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{lv}</div>
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Level {lv}: {lv === 1 ? 'Official Warning' : lv === 2 ? '1-Month Blackout' : 'Full Suspension'}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold leading-tight line-clamp-2">{lv === 1 ? 'Account flagged with strike. notification sent.' : lv === 2 ? 'Immediate 30-day function lock across platform.' : 'Permanent platform exit. irreversible doc termination.'}</p>
                       </div>
                    </button>
                 ))}
                 
                 <div className="pt-4">
                    <button 
                      onClick={handleIssueStrike}
                      disabled={isSubmitting}
                      className="w-full py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                       {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={18} />} 
                       {isSubmitting ? "Deploying Hive Guard..." : "Execute Security Penalty"}
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
           <div className="relative bg-white max-w-sm w-full rounded-[3rem] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-100">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-xl shadow-red-100 animate-pulse">
                 <ShieldCheck size={40} className="text-red-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tighter">Violation<br/>Enforced.</h2>
              <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none">Security Target</p>
                 <p className="text-lg font-black text-slate-900 tracking-tight">{successModal.userName}</p>
              </div>
              <button onClick={() => setSuccessModal(null)} className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-slate-200">Acknowledge Enforcement</button>
           </div>
        </div>
      )}
    </div>
  );
}
