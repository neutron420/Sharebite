"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquarePlus,
  ShieldAlert,
  X,
  XCircle,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  ngo: { id: string; name: string; email: string; imageUrl?: string };
  createdAt: string;
  updatedAt: string;
}

interface Ngo {
  id: string;
  name: string;
  email: string;
}

export default function DonorComplaintsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form state
  const [ngoSearch, setNgoSearch] = useState("");
  const [selectedNgo, setSelectedNgo] = useState<Ngo | null>(null);
  const [ngoResults, setNgoResults] = useState<Ngo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        toast.error("Failed to fetch complaints.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  // Search for NGOs to file complaint against
  useEffect(() => {
    if (ngoSearch.length < 2) {
      setNgoResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/ngo/search?q=${encodeURIComponent(ngoSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setNgoResults(data);
        }
      } catch {
        // Silently fail on search
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [ngoSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNgo) {
      toast.error("Please select an NGO to file a complaint against.");
      return;
    }
    if (!reason) {
      toast.error("Please provide a reason for the complaint.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId: selectedNgo.id, reason, details }),
      });

      if (res.ok) {
        toast.success("Complaint submitted! Admin will review it shortly.");
        setShowForm(false);
        setSelectedNgo(null);
        setReason("");
        setDetails("");
        setNgoSearch("");
        fetchReports();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit complaint.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" />, label: "Under Review" },
    RESOLVED: { color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Resolved" },
    DISMISSED: { color: "bg-slate-50 text-slate-500 border-slate-200", icon: <XCircle className="w-3.5 h-3.5" />, label: "Dismissed" },
  };

  const reasons = [
    "Food not picked up on time",
    "Rude or unprofessional behavior",
    "NGO misrepresented quantity needed",
    "No communication after request",
    "Food wasted after pickup",
    "Suspicious activity",
    "Other",
  ];

  return (
    <div className="w-full py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic text-slate-900 leading-none">
            <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 inline-block text-orange-600 mr-2 -mt-2" />
            My Complaints
          </h1>
          <p className="text-sm text-slate-400 font-bold max-w-sm leading-tight">Report NGOs for misconduct. Admin will review and take action.</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-3 px-8 py-5 bg-orange-600 text-white font-black rounded-[1.5rem] text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-[0_20px_40px_-10px_rgba(249,115,22,0.3)] active:scale-95 group border-b-4 border-orange-700 w-full sm:w-auto"
        >
          <MessageSquarePlus className="w-5 h-5 group-hover:rotate-12 transition-transform" strokeWidth={3} /> 
          Rapid File Complaint
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 sm:mx-0 sm:px-0 sm:py-0 sm:relative">
        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-3xl w-full sm:w-fit overflow-x-auto scrollbar-hide border border-slate-200/60 shadow-sm snap-x">
          {["ALL", "PENDING", "RESOLVED", "DISMISSED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-1 min-w-[110px] py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all snap-start ${
                filter === s ? "bg-orange-600 text-white shadow-xl shadow-orange-100" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s === "ALL" ? "All" : s === "PENDING" ? "Under Review" : s === "RESOLVED" ? "Resolved" : "Dismissed"}
            </button>
          ))}
        </div>
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading complaints...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h4 className="font-black text-lg text-slate-900">No complaints filed</h4>
          <p className="text-slate-400 text-sm font-bold mt-1 max-w-[280px]">
            {filter === "ALL"
              ? "You haven't filed any complaints yet. If an NGO has acted wrongly, use the button above to report them."
              : `No complaints with status "${filter.toLowerCase()}" found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((report, i) => {
            const cfg = statusConfig[report.status] || statusConfig.PENDING;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 sm:p-7 rounded-[2.5rem] bg-white border border-slate-100 transition-all shadow-sm hover:shadow-xl hover:shadow-orange-100/20 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100">
                        <AlertTriangle className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xl tracking-tight text-slate-900 truncate">Target: {report.ngo.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{report.ngo.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                       <Badge className={cn(cfg.color, "border-2 font-black text-[9px] px-3 py-1.5 rounded-full uppercase")}>
                         {cfg.label}
                       </Badge>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                         {formatDistanceToNow(new Date(report.createdAt))} ago
                       </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 transition-all group-hover:bg-white group-hover:shadow-inner group-hover:border-orange-100">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                         <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Incident Root Cause</p>
                      </div>
                      <p className="text-base font-black text-slate-800 leading-tight mb-3">{report.reason}</p>
                      {report.details && (
                        <div className="mt-4 pt-4 border-t border-slate-200/60">
                           <p className="text-sm font-bold text-slate-500 leading-relaxed opacity-80">{report.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {reports.length > itemsPerPage && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.ceil(reports.length / itemsPerPage) }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(reports.length / itemsPerPage)) setCurrentPage(currentPage + 1); }}
                    className={currentPage === Math.ceil(reports.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* File Complaint Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black tracking-tight">File a Complaint</h2>
                <p className="text-sm text-slate-400 font-bold mt-1">
                  Report an NGO for misconduct. Admin will review your report.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NGO Search */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Search NGO <span className="text-orange-500">*</span>
                  </label>
                  {selectedNgo ? (
                    <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-2xl">
                      <div>
                        <p className="font-black text-sm text-slate-900">{selectedNgo.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{selectedNgo.email}</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedNgo(null); setNgoSearch(""); }} className="text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={ngoSearch}
                        onChange={(e) => setNgoSearch(e.target.value)}
                        placeholder="Type NGO name to search..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 transition-all"
                      />
                      {searchLoading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />}
                      {ngoResults.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                          {ngoResults.map((ngo) => (
                            <button
                              key={ngo.id}
                              type="button"
                              onClick={() => { setSelectedNgo(ngo); setNgoResults([]); setNgoSearch(ngo.name); }}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                            >
                              <p className="font-black text-sm">{ngo.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{ngo.email}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Reason <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a reason...</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Additional Details
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    placeholder="Describe the issue in detail (optional)..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-100 uppercase text-xs tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {submitLoading ? "Submitting..." : "Submit Complaint"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
