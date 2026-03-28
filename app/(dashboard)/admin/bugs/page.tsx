"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Bug, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  User, 
  MoreHorizontal,
  ChevronRight,
  Loader2,
  X,
  Send,
  RefreshCw,
  ShieldAlert,
  Terminal,
  MousePointer2,
  Zap,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";
import { 
  BsCpu, 
  BsPalette, 
  BsLightningCharge, 
  BsShieldLock, 
  BsQuestionCircle 
} from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BugReport = {
  id: string;
  type: "TECHNICAL" | "UI_UX" | "PERFORMANCE" | "SECURITY" | "OTHER";
  description: string;
  location: string | null;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  reporter: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  responses: any[];
  createdAt: string;
};

// ── Helpers ────────────────────────────────────────────
const getTypeIcon = (type: string) => {
  switch (type) {
    case "TECHNICAL": return <BsCpu className="h-5 w-5" />;
    case "UI_UX": return <BsPalette className="h-5 w-5" />;
    case "PERFORMANCE": return <BsLightningCharge className="h-5 w-5" />;
    case "SECURITY": return <BsShieldLock className="h-5 w-5" />;
    default: return <BsQuestionCircle className="h-5 w-5" />;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REVIEWING": return "bg-blue-50 text-blue-700 border-blue-200";
    case "DISMISSED": return "bg-slate-50 text-slate-500 border-slate-200";
    default: return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' });
};

// ── Animated Counter (Simplified) ──────────────────
function StatCard({ value, label, icon: Icon, color }: { 
  value: number; 
  label: string; 
  icon: any; 
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150`} style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between relative z-10">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminBugsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const { addListener } = useSocket();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bugs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
        if (data.error) toast.error(`${data.error}: ${data.details || 'Check logs'}`);
      }
    } catch (error) {
      toast.error("Failed to fetch reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    const unsubscribe = addListener("NEW_BUG_REPORT", (newReport: BugReport) => {
      setReports((prev) => [newReport, ...prev]);
      toast.info(`New ${newReport.type} Bug Reported`, {
        description: `By ${newReport.reporter.name} at ${newReport.location || "unknown location"}`,
        action: {
          label: "View",
          onClick: () => setSelectedReport(newReport),
        },
      });
    });

    return () => unsubscribe();
  }, [addListener, fetchReports]);

  const updateStatus = async (id: string, status: string, message: string) => {
    try {
      setIsResponding(true);
      const res = await fetch(`/api/bugs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, message }),
      });
      if (res.ok) {
        toast.success(`Bug marked as ${status}`);
        fetchReports();
        setSelectedReport(null);
        setResponseMsg("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update bug");
      }
    } catch (error) {
      toast.error("An error occurred during response.");
    } finally {
      setIsResponding(false);
    }
  };

  const filteredReports = reports.filter(r => filterType === "ALL" || r.type === filterType);

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "PENDING").length,
    resolved: reports.filter(r => r.status === "RESOLVED").length,
    security: reports.filter(r => r.type === "SECURITY").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Defect Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor, review, and resolve platform issues in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchReports} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={stats.total} label="Total Reports" icon={Bug} color="#6366f1" />
        <StatCard value={stats.pending} label="Pending Review" icon={Clock} color="#f59e0b" />
        <StatCard value={stats.resolved} label="Resolved Issues" icon={CheckCircle2} color="#10b981" />
        <StatCard value={stats.security} label="Security Risks" icon={AlertCircle} color="#ef4444" />
      </div>

      {/* Filters & Content */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 gap-1 overflow-x-auto no-scrollbar">
            {["ALL", "TECHNICAL", "UI_UX", "PERFORMANCE", "SECURITY", "OTHER"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap",
                  filterType === t 
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-gray-400 text-sm font-medium">Accessing registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-6 py-4">Defect Detail</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reported By</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                  const statusUtils = getStatusStyles(report.status);
                  return (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedReport(report)}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className={cn("p-2.5 rounded-xl border", statusUtils.split(" ")[0] === "bg-emerald-50" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : statusUtils)}>
                              {getTypeIcon(report.type)}
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900 leading-tight italic">"{report.description}"</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{report.type} ISSUE</span>
                                 <span className="text-gray-300">•</span>
                                 <span className="text-[10px] font-bold text-gray-400">ID: {report.id.slice(0, 8)}</span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border shadow-sm",
                          statusUtils
                        )}>
                           {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                              {report.reporter.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-gray-900 leading-none">{report.reporter.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">{report.reporter.role}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{report.location || "System Root"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">{formatDate(report.createdAt)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                       <Bug className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                       <p className="text-gray-400 font-medium">No bug reports match your filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Detail Modal (Styled like Dashboard Modals) */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isResponding && setSelectedReport(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-red-50 text-red-500 border border-red-100 shadow-sm">
                      {getTypeIcon(selectedReport.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedReport.type} REPORT</h2>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">ID: {selectedReport.id.slice(0, 8)} • {formatDate(selectedReport.createdAt)}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="h-10 w-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 italic text-gray-700 leading-relaxed text-sm">
                    "{selectedReport.description}"
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Reporter</p>
                        <p className="text-sm font-bold text-gray-900">{selectedReport.reporter.name}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                        <p className="text-sm font-bold text-gray-900">{selectedReport.location || "System Root"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Response Action */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="mb-4">
                       <label className="text-xs font-bold text-gray-500 block mb-2 uppercase tracking-wide">Status Update Note</label>
                       <textarea
                         value={responseMsg}
                         onChange={(e) => setResponseMsg(e.target.value)}
                         placeholder="Add an internal note or thank you message..."
                         className="w-full min-h-[100px] p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm"
                       />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        onClick={() => updateStatus(selectedReport.id, "RESOLVED", responseMsg)}
                        disabled={isResponding}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
                      >
                         Mark Resolved
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedReport.id, "REVIEWING", responseMsg)}
                        disabled={isResponding}
                        variant="outline"
                        className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold h-11"
                      >
                        In Review
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedReport.id, "DISMISSED", responseMsg)}
                        disabled={isResponding}
                        variant="ghost"
                        className="rounded-xl text-gray-400 hover:bg-gray-100 font-bold h-11"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
