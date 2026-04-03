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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DonorReport {
 id: string;
 reason: string;
 details: string | null;
 status: string;
 donor: { id: string; name: string; email: string; imageUrl?: string };
 createdAt: string;
 updatedAt: string;
}

interface Donor {
 id: string;
 name: string;
 email: string;
}

export default function NgoComplaintsPage() {
 const [reports, setReports] = useState<DonorReport[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [submitLoading, setSubmitLoading] = useState(false);
 const [filter, setFilter] = useState("ALL");

 // Form state
 const [donorSearch, setDonorSearch] = useState("");
 const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
 const [donorResults, setDonorResults] = useState<Donor[]>([]);
 const [searchLoading, setSearchLoading] = useState(false);
 const [reason, setReason] = useState("");
 const [details, setDetails] = useState("");

 const fetchReports = async () => {
 try {
 setLoading(true);
 const res = await fetch(`/api/donor-reports?status=${filter}`);
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

 // Search for Donors to file complaint against
 useEffect(() => {
 if (donorSearch.length < 2) {
 setDonorResults([]);
 return;
 }

 const timeout = setTimeout(async () => {
 setSearchLoading(true);
 try {
 const res = await fetch(`/api/donor/search?q=${encodeURIComponent(donorSearch)}`);
 if (res.ok) {
 const data = await res.json();
 setDonorResults(data);
 }
 } catch {
 // Silently fail on search
 } finally {
 setSearchLoading(false);
 }
 }, 400);

 return () => clearTimeout(timeout);
 }, [donorSearch]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedDonor) {
 toast.error("Please select a donor to file a complaint against.");
 return;
 }
 if (!reason) {
 toast.error("Please provide a reason for the complaint.");
 return;
 }

 setSubmitLoading(true);
 try {
 const res = await fetch("/api/donor-reports", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ donorId: selectedDonor.id, reason, details }),
 });

 if (res.ok) {
 toast.success("Complaint submitted! Admin will review it shortly.");
 setShowForm(false);
 setSelectedDonor(null);
 setReason("");
 setDetails("");
 setDonorSearch("");
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
 PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Review" },
 RESOLVED: { color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Resolved" },
 DISMISSED: { color: "bg-slate-50 text-slate-500 border-slate-200", icon: <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Dismissed" },
 };

 const reasons = [
 "Donated expired or spoiled food",
 "Misleading food description",
 "Quantity significantly less than stated",
 "Rude or unprofessional behavior",
 "Not available at pickup time",
 "Unhygienic packaging",
 "Suspicious or unsafe food items",
 "Other",
 ];

 return (
 <div className="w-full py-6 sm:py-10 space-y-8 ">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
 <div>
 <Link href="/ngo" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-600 transition-colors mb-3">
 <ArrowLeft className="w-3.5 h-3.5" /> Back to Ops Hub
 </Link>
 <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
 <ShieldAlert className="w-8 h-8 inline-block text-orange-600 mr-2 -mt-1" />
 Donor Alerts
 </h1>
 <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest leading-relaxed">Report donors for food quality issues or misconduct. Field Admin will review manifests.</p>
 </div>

 <button
 onClick={() => setShowForm(true)}
 className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-950 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95"
 >
 <MessageSquarePlus className="w-4 h-4" /> File Alert
 </button>
 </div>

 {/* Filter Tabs */}
 <div className="flex bg-slate-50 p-1 rounded-xl sm:rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
 {["ALL", "PENDING", "RESOLVED", "DISMISSED"].map((s) => (
 <button
 key={s}
 onClick={() => setFilter(s)}
 className={cn("flex-1 sm:flex-initial py-2.5 px-4 sm:px-6 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", filter === s ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
 >
 {s === "ALL" ? "All" : s === "PENDING" ? "Review" : s === "RESOLVED" ? "Resolved" : "Dismissed"}
 </button>
 ))}
 </div>

 {/* Complaint List */}
 {loading ? (
 <div className="flex flex-col items-center justify-center py-20">
 <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-3" />
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning Archives...</p>
 </div>
 ) : reports.length === 0 ? (
 <div className="p-12 sm:p-20 rounded-3xl sm:rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
 <AlertTriangle className="w-8 h-8" />
 </div>
 <h4 className="font-black text-xl text-slate-950 uppercase tracking-tighter">No alerts found</h4>
 <p className="text-slate-400 text-[10px] font-bold mt-2 max-w-[280px] uppercase tracking-widest leading-relaxed">
 {filter === "ALL"
 ? "All clear. If a donor has acted wrongly, file a report for investigation."
 : `No alerts with status "${filter.toLowerCase()}" detected.`}
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {reports.map((report, i) => {
 const cfg = statusConfig[report.status] || statusConfig.PENDING;
 return (
 <motion.div
 key={report.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.05 }}
 className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 transition-all shadow-sm group"
 >
 <div className="flex flex-col md:flex-row items-start justify-between gap-5 sm:gap-6">
 <div className="flex items-start gap-4 flex-1 min-w-0">
 <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100">
 <AlertTriangle className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h4 className="font-black text-lg sm:text-xl tracking-tighter uppercase group-hover:text-orange-600 transition-colors truncate">Against: {report.donor.name}</h4>
 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 truncate">
 {report.donor.email}
 </p>
 <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
 <div>
 <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Reason</p>
 <p className="text-sm font-bold text-slate-950 ">{report.reason}</p>
 </div>
 {report.details && (
 <div className="pt-2 border-t border-slate-200/50">
 <p className="text-xs text-slate-500 font-bold leading-relaxed">{report.details}</p>
 </div>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center md:flex-col md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-50">
 <Badge className={cn(cfg.color, "border-none font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5")}>
 {cfg.icon} {cfg.label}
 </Badge>
 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
 <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(report.createdAt))} ago
 </span>
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}

 {/* File Complaint Modal */}
 <AnimatePresence>
 {showForm && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4"
 onClick={() => setShowForm(false)}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-lg p-6 sm:p-10 relative overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl" />
 <button
 onClick={() => setShowForm(false)}
 className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
 >
 <X className="w-5 h-5" />
 </button>

 <div className="mb-6 sm:mb-8 pr-12">
 <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase underline decoration-orange-600/20 underline-offset-8">Mission Report</h2>
 <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-relaxed">
 Identify and flag donor misconduct for field investigation.
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
 {/* Donor Search */}
 <div className="space-y-2.5">
 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
 Identify Participant <span className="text-orange-500">*</span>
 </label>
 {selectedDonor ? (
 <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl sm:rounded-2xl">
 <div>
 <p className="font-black text-sm text-slate-950 uppercase tracking-tight">{selectedDonor.name}</p>
 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{selectedDonor.email}</p>
 </div>
 <button type="button" onClick={() => { setSelectedDonor(null); setDonorSearch(""); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
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
 value={donorSearch}
 onChange={(e) => setDonorSearch(e.target.value)}
 placeholder="Search system registry..."
 className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-all placeholder: placeholder:font-bold placeholder:text-slate-200"
 />
 {searchLoading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />}
 {donorResults.length > 0 && (
 <div className="absolute z-10 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
 {donorResults.map((donor) => (
 <button
 key={donor.id}
 type="button"
 onClick={() => { setSelectedDonor(donor); setDonorResults([]); setDonorSearch(donor.name); }}
 className="w-full text-left px-5 py-4 hover:bg-orange-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b last:border-0 border-slate-50"
 >
 <p className="font-black text-xs uppercase ">{donor.name}</p>
 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{donor.email}</p>
 </button>
 ))}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Reason Dropdown */}
 <div className="space-y-2.5">
 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
 Primary Grievance <span className="text-orange-500">*</span>
 </label>
 <div className="relative">
 <select
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 required
 className="w-full py-4 px-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer "
 >
 <option value="">Select mission failure reason...</option>
 {reasons.map((r) => (
 <option key={r} value={r}>{r}</option>
 ))}
 </select>
 <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
 <AlertTriangle className="w-4 h-4" />
 </div>
 </div>
 </div>

 {/* Details */}
 <div className="space-y-2.5">
 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
 Additional Manifest Data
 </label>
 <textarea
 value={details}
 onChange={(e) => setDetails(e.target.value)}
 rows={3}
 placeholder="Log specific anomalies detected..."
 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[11px] font-black tracking-wider focus:outline-none focus:border-orange-500 transition-all resize-none placeholder: placeholder:font-bold placeholder:text-slate-200"
 />
 </div>

 <div className="flex gap-4 pt-2">
 <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4.5 bg-slate-50 text-slate-400 font-black rounded-xl sm:rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Abort</button>
 <button
 type="submit"
 disabled={submitLoading}
 className="flex-[2] py-4.5 bg-red-600 text-white font-black rounded-xl sm:rounded-2xl hover:bg-slate-950 transition-all shadow-xl shadow-red-100 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
 >
 {submitLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <AlertTriangle className="w-4 h-4 text-white" />}
 File Incident
 </button>
 </div>
 </form>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
