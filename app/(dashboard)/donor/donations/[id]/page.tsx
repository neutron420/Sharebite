"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Users,
  Star,
  Truck,
  ShieldCheck,
  ShieldAlert,
  PartyPopper,
  Navigation
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";

// Step tracker data
const STEPS = [
  { label: "Requested", icon: Package, description: "NGO submitted pickup request" },
  { label: "Approved", icon: CheckCircle2, description: "You approved the request" },
  { label: "Out for Pickup", icon: Truck, description: "Rider/NGO is on the way" },
  { label: "Handover", icon: ShieldCheck, description: "PIN verified, food collected" },
  { label: "Delivered", icon: PartyPopper, description: "Food reached the NGO" },
];

export default function DonorDonationDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Review state
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      const res = await fetch(`/api/donations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch donation details.");
      const data = await res.json();
      setDonation(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      toast.success(`Request ${status.toLowerCase()} successfully!`);
      fetchDonation();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewSubmit = async (ngoId: string) => {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          donationId: id,
          revieweeId: ngoId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }

      toast.success("Review submitted! Thank you!");
      setShowReview(false);
      setReviewRating(0);
      setReviewComment("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Data...</p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
        <AlertTriangle className="w-16 h-16 text-slate-300" strokeWidth={1.5} />
        <h2 className="text-2xl font-black">Donation Not Found</h2>
        <button onClick={() => router.back()} className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest text-xs">Go Back</button>
      </div>
    );
  }

  const approvedRequest = donation.requests?.find((r: any) => 
    r.status === "APPROVED" || r.status === "ASSIGNED" || r.status === "ON_THE_WAY" || r.status === "COMPLETED"
  );
  const pendingRequests = donation.requests?.filter((r: any) => r.status === "PENDING");
  const completedRequest = donation.requests?.find((r: any) => r.status === "COMPLETED");
  const currentStep = approvedRequest?.step || 1;

  const getStatusColor = (status: string) => {
    switch(status) {
      case "AVAILABLE": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "COLLECTED": return "bg-purple-100 text-purple-700";
      case "EXPIRED": return "bg-red-100 text-red-700";
      default: return "bg-orange-100 text-orange-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex selection:bg-orange-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-slate-100 bg-white z-50 flex-col py-10 px-4 hidden md:flex">
         <div className="px-2 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 italic font-black text-white text-xl">S</div>
              <span className="text-xl font-black tracking-tighter">DONOR HUB</span>
            </div>
         </div>
      </aside>

      <main className="flex-grow pl-0 md:pl-64 pt-6 pb-24 px-6 md:px-12 bg-[#FCFCFD] relative">
         <div className="max-w-5xl mx-auto space-y-10">
            
            <button 
               onClick={() => router.push("/donor/donations")}
               className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-colors"
            >
               <ArrowLeft className="w-4 h-4" /> Back to Logs
            </button>

            {/* SECTION 1: Mission Profile & Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               {/* Left: Image & Quick Stats */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
                     <div className="aspect-square rounded-[2rem] bg-slate-50 border border-slate-100 relative overflow-hidden">
                        {donation.imageUrl ? (
                           <img src={donation.imageUrl} alt={donation.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                              <Package className="w-16 h-16 stroke-[1]" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Visual Data Missing</span>
                           </div>
                        )}
                        <div className="absolute top-4 left-4">
                           <Badge className={`${getStatusColor(donation.status)} border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-lg`}>
                              {donation.status}
                           </Badge>
                        </div>
                     </div>
                  </div>

                  {/* Mission Identity Card */}
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl" />
                     <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] uppercase tracking-widest">
                           <ShieldCheck className="w-3 h-3" /> Secure Mission ID
                        </div>
                        <p className="text-xl font-black tracking-tighter truncate opacity-90">#{donation.id.slice(-12).toUpperCase()}</p>
                        <div className="h-px bg-white/10 w-full" />
                        <div className="flex items-center justify-between text-[10px] font-bold text-white/50">
                           <span>ENCRYPTION</span>
                           <span>SHA-256 ACTIVE</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right: Detailed Report Content */}
               <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/50 blur-3xl opacity-50" />
                     
                     <div className="relative z-10 space-y-8">
                        <div>
                           <h1 className="text-5xl font-black tracking-tighter italic mb-4 text-slate-950">{donation.title}</h1>
                           <div className="flex flex-wrap gap-3">
                              <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">posted: {format(new Date(donation.createdAt), "MMM dd, yyyy")}</span>
                              <span className="px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-600">expires in {format(new Date(donation.expiryTime), "p")}</span>
                           </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Comprehensive Description
                           </h3>
                           <p className="text-slate-600 font-bold leading-relaxed italic text-lg">&quot;{donation.description || "The donor provided no further intel for this mission."}&quot;</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-orange-500 transition-colors">
                              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                 <Clock className="w-6 h-6" />
                              </div>
                              <div>
                                 <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Expiry Deadline</p>
                                 <p className="text-sm font-black text-slate-900">{format(new Date(donation.expiryTime), "PPp")}</p>
                              </div>
                           </div>
                           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-orange-500 transition-colors">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                 <Calendar className="w-6 h-6" />
                              </div>
                              <div>
                                 <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pickup Window</p>
                                 <p className="text-sm font-black text-slate-900">{format(new Date(donation.pickupStartTime), "p")} - {format(new Date(donation.pickupEndTime), "p")}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Logistics Hub Report */}
                  <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                         <div>
                            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">Logistics Intelligence</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Ground operations & location data</p>
                         </div>
                         <MapPin className="w-10 h-10 text-slate-100" />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                           <p className="text-[10px] uppercase font-black tracking-widest text-orange-600">Operational City</p>
                           <p className="text-xl font-black tracking-tighter">{donation.city || "Not Specified"}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] uppercase font-black tracking-widest text-orange-600">Pincode Sector</p>
                           <p className="text-xl font-black tracking-tighter">{donation.pincode || "--- ---"}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] uppercase font-black tracking-widest text-orange-600">Category Tag</p>
                           <p className="text-xl font-black tracking-tighter italic">{donation.category || "General Surplus"}</p>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Detailed Logistics Address</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{donation.pickupLocation}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* SECTION 2: Logistics Tracker — Full width Detailed report style */}
            {approvedRequest && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-12">
                     <div>
                        <h2 className="text-2xl font-black italic tracking-tighter">Mission Lifecycle Report</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Real-time status synchronization</p>
                     </div>
                     <Badge className="bg-slate-950 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl">Step {currentStep} of 5</Badge>
                  </div>

                  <div className="flex items-start justify-between relative px-4">
                     {/* Progress Bar Background */}
                     <div className="absolute top-6 left-0 right-0 h-2 bg-slate-50 rounded-full mx-16" />
                     <div 
                        className="absolute top-6 left-0 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-16 transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                        style={{ width: `${Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100)}%` }}
                     />

                     {STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isActive = i + 1 <= currentStep;
                        const isCurrent = i + 1 === currentStep;
                        return (
                           <div key={i} className="flex flex-col items-center relative z-10 flex-1 group">
                              <motion.div 
                                 initial={false}
                                 animate={{ scale: isCurrent ? 1.25 : 1, transition: { type: "spring", stiffness: 300, damping: 15 } }}
                                 className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${
                                    isActive 
                                       ? 'bg-orange-600 border-white text-white shadow-2xl shadow-orange-200' 
                                       : 'bg-white border-slate-50 text-slate-200'
                                 }`}
                              >
                                 <StepIcon className="w-6 h-6" />
                              </motion.div>
                              <span className={`text-[10px] font-black uppercase tracking-widest mt-4 text-center transition-colors duration-500 px-2 ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                                 {step.label}
                              </span>
                              <div className={`mt-2 h-1 w-4 rounded-full transition-all duration-500 ${isCurrent ? 'bg-orange-600 w-8' : 'bg-transparent'}`} />
                           </div>
                        );
                     })}
                  </div>
               </motion.div>
            )}

            {/* SECTION 3: Security & Access Analysis */}
            {approvedRequest && approvedRequest.status !== "COMPLETED" && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Security Clearance Header */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-orange-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-orange-100 border-4 border-orange-500 flex flex-col justify-center">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] scale-150 rotate-45" />
                     <div className="relative z-10 space-y-6">
                        <h2 className="text-4xl font-black italic tracking-tighter leading-none text-white underline decoration-white/20 underline-offset-8">Security Clearance</h2>
                        <p className="text-lg font-bold text-orange-50 max-w-sm leading-relaxed">
                           Manual verification required. Do not release cargo without PIN confirmation.
                        </p>
                        <div className="flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md">
                           <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest">High Integrity Handover</span>
                        </div>
                     </div>
                  </motion.div>

                  {/* PIN Display Report */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                     <p className="text-[10px] uppercase font-black tracking-[0.3em] text-orange-400 mb-6 relative">
                        <span className="absolute -left-6 top-1/2 w-4 h-px bg-orange-400/30" />
                        Authentication Token
                        <span className="absolute -right-6 top-1/2 w-4 h-px bg-orange-400/30" />
                     </p>
                     <div className="text-8xl font-black tracking-[0.25em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-6">
                        {approvedRequest.handoverPin || "----"}
                     </div>
                     <div className="flex items-center gap-2 px-6 py-2 bg-orange-600 rounded-full font-black text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <CheckCircle2 className="w-4 h-4" /> Share ONLY in Person
                     </div>
                  </motion.div>
               </div>
            )}

            {/* SECTION 4: Live Pursuit & Map Report */}
            {approvedRequest && approvedRequest.riderId && (approvedRequest.status === "ASSIGNED" || approvedRequest.status === "ON_THE_WAY") && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-white p-4 rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-8 py-4">
                     <div>
                        <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                           <Navigation className="w-8 h-8 text-orange-600" /> Satellite Intercept
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rider Telemetry Feed Active</p>
                     </div>
                     <div className="px-5 py-2.5 bg-green-50 rounded-2xl flex items-center gap-3 animate-pulse">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-green-700">Link Verified</span>
                     </div>
                  </div>
                  
                  <div className="h-[500px] w-full rounded-[3.5rem] overflow-hidden border-4 border-slate-50 relative">
                     <LiveRiderMap 
                        riderId={approvedRequest.riderId}
                        riderName={approvedRequest.rider?.name || "Rider"}
                        donorCoords={[donation.donor.longitude, donation.donor.latitude]}
                        ngoCoords={[approvedRequest.ngo.longitude, approvedRequest.ngo.latitude]}
                        status={approvedRequest.status}
                     />
                  </div>
               </motion.div>
            )}

            {/* SECTION 5: End-State Accomplishment Report */}
            {completedRequest && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 to-emerald-700/30 opacity-50" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/20 blur-[80px]" />
                  
                  <div className="relative z-10">
                     <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="w-28 h-28 bg-white/10 border border-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl shrink-0 shadow-2xl">
                           <PartyPopper className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex-grow text-center md:text-left space-y-4">
                           <div className="flex items-center justify-center md:justify-start gap-3">
                              <Badge className="bg-green-600 text-white border-none py-1 px-4 font-black">MISSION COMPLETE</Badge>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Verified On-Chain</span>
                           </div>
                           <h2 className="text-5xl font-black italic tracking-tighter leading-none">Victory Achieved!</h2>
                           <p className="text-xl font-bold text-green-50/80 max-w-2xl leading-relaxed">
                              Successfully delivered to <span className="text-white underline decoration-white/20 underline-offset-4 font-black">{completedRequest.ngo?.name}</span>. 
                              The logistics chain is now finalized and and fully reconciled.
                           </p>
                           {completedRequest.completedAt && (
                              <div className="flex items-center justify-center md:justify-start gap-4 text-white/50">
                                 <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{format(new Date(completedRequest.completedAt), "PPp")}</span>
                                 </div>
                              </div>
                           )}
                        </div>
                        <button 
                           onClick={() => setShowReview(!showReview)}
                           className="shrink-0 group relative"
                        >
                           <div className="absolute inset-0 bg-white blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                           <div className="relative px-10 py-5 bg-white text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-3">
                              <Star className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Rate Impact Partner
                           </div>
                        </button>
                     </div>

                     {/* Premium Review Report Form */}
                     <AnimatePresence>
                        {showReview && (
                           <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl"
                           >
                              <div className="max-w-xl mx-auto space-y-8">
                                 <div className="text-center">
                                    <h3 className="text-2xl font-black italic tracking-tight mb-2">Performance Audit</h3>
                                    <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em]">Evaluate {completedRequest.ngo?.name}</p>
                                 </div>
                                 
                                 <div className="flex justify-center gap-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                       <button
                                          key={star}
                                          onClick={() => setReviewRating(star)}
                                          className="transition-all transform hover:scale-125 active:scale-90"
                                       >
                                          <Star 
                                             className={`w-14 h-14 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-white/10'}`} 
                                          />
                                       </button>
                                    ))}
                                 </div>

                                 <textarea
                                    placeholder="Briefly summarize the NGO's performance or conduct..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-3xl p-6 text-white placeholder:text-white/20 font-black text-sm resize-none h-32 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                                 />

                                 <div className="flex gap-4">
                                    <button
                                       onClick={() => setShowReview(false)}
                                       className="flex-1 py-5 bg-transparent border-2 border-white/10 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                                    >
                                       Discard
                                    </button>
                                    <button
                                       onClick={() => handleReviewSubmit(completedRequest.ngoId)}
                                       disabled={reviewLoading || reviewRating === 0}
                                       className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                       {reviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                       Authenticate Review
                                    </button>
                                 </div>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </motion.div>
            )}

            {/* SECTION 6: Intelligence Gathering — Incoming Requests */}
            {donation.status === "AVAILABLE" && pendingRequests && pendingRequests.length > 0 && (
               <div className="space-y-8 pt-6">
                  <div className="flex items-center justify-between px-8 border-l-8 border-orange-600">
                     <div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-slate-950 uppercase">Signal Interceptions</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-600 mt-2">Incoming Extraction Requests Identified</p>
                     </div>
                     <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 flex items-center justify-center text-white shadow-2xl">
                        <Badge className="bg-transparent text-white border-none font-black text-xl">{pendingRequests.length}</Badge>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {pendingRequests.map((req: any) => (
                        <div key={req.id} className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col group hover:border-orange-200 transition-all hover:scale-[1.02] duration-500">
                           <div className="flex items-center gap-5 mb-8">
                              <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] overflow-hidden shrink-0 border-2 border-slate-50 shadow-inner">
                                 {req.ngo?.imageUrl ? (
                                    <img src={req.ngo.imageUrl} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-2xl bg-gradient-to-br from-slate-50 to-slate-100">
                                       {req.ngo?.name?.charAt(0) || "N"}
                                    </div>
                                 )}
                              </div>
                              <div>
                                 <h4 className="font-black text-2xl tracking-tighter leading-none italic">{req.ngo?.name}</h4>
                                 <div className="flex items-center gap-2 mt-1.5 font-black uppercase tracking-widest text-[10px] text-slate-400">
                                    <MapPin className="w-3 h-3" /> {req.ngo?.city} Hub
                                 </div>
                              </div>
                           </div>

                           <div className="bg-slate-50 p-6 rounded-[2rem] mb-10 border border-slate-100 italic font-bold text-slate-600 text-lg leading-relaxed shadow-inner">
                              &quot;{req.message || "No message provided."}&quot;
                           </div>

                           <div className="mt-auto flex gap-3">
                              <button 
                                 className="flex-1 py-5 bg-white border border-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                                 onClick={() => handleRequestAction(req.id, "REJECTED")}
                                 disabled={actionLoading !== null}
                              >
                                 Dismiss
                              </button>
                              <button 
                                 className="flex-[2] py-5 bg-slate-950 text-white hover:bg-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                                 onClick={() => handleRequestAction(req.id, "APPROVED")}
                                 disabled={actionLoading !== null}
                              >
                                 {actionLoading === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                 Authorize Extraction
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Empty Signal — Zero Requests */}
            {donation.status === "AVAILABLE" && pendingRequests?.length === 0 && (
               <div className="bg-white border border-slate-100 rounded-[4rem] p-24 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-200/20">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner mb-8 animate-pulse">
                     <Users className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter mb-3 text-slate-950">Quiet Sector...</h3>
                  <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">Signal scanning is active. Your donation is visible to all verified NGO hubs in your area. Stand by for contact.</p>
                  <div className="mt-10 flex gap-4">
                     <div className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
                     <div className="w-2 h-2 rounded-full bg-slate-200" />
                     <div className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
               </div>
            )}

         </div>
      </main>
    </div>
  );
}
