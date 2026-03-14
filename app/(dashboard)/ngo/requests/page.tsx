"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  History,
  LayoutDashboard,
  LogOut,
  Bell,
  Search,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import LiveRiderMap from "@/components/ui/live-rider-map";
import { Navigation } from "lucide-react";

export default function NgoRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  
  // Review state
  const [showReview, setShowReview] = useState<string | null>(null); // request ID
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Could not load requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyHandover = async () => {
    if (!verifyingId || pin.length < 4) {
      toast.error("Please enter the 4-digit PIN");
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch(`/api/requests/${verifyingId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      toast.success("Handover verified! Food collected.");
      setVerifyingId(null);
      setPin("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleReviewSubmit = async (requestId: string, donorId: string, donationId: string) => {
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
          donationId: donationId,
          revieweeId: donorId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }

      toast.success("Feedback submitted! Thank you.");
      setShowReview(null);
      setReviewRating(0);
      setReviewComment("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      router.push("/login");
    }
  };

  const activeRequests = requests.filter(r => r.status === "APPROVED" || r.status === "ON_THE_WAY");
  const pendingRequests = requests.filter(r => r.status === "PENDING");
  const completedRequests = requests.filter(r => r.status === "COMPLETED");

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-12 px-6 md:px-12">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic underline decoration-orange-600/10 underline-offset-8">
             Pickup Operations
          </h1>
          <p className="text-slate-400 font-bold">Manage your active, pending, and completed food collections.</p>
        </motion.div>
      </header>

      {/* Active Pickups - Priority */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-orange-600">
            <ShieldCheck className="w-8 h-8" /> Active Pickups
          </h2>
          <Badge className="bg-orange-50 text-orange-600 border-none font-black">{activeRequests.length} Ops</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6">
           {activeRequests.length > 0 ? (
             activeRequests.map((req, i) => (
               <motion.div 
                 key={req.id} 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 transition={{ delay: i * 0.1 }}
                 className="bg-white p-8 rounded-[3rem] border-2 border-orange-100 shadow-xl shadow-orange-50/50 flex flex-col md:flex-row items-center gap-8 group hover:border-orange-200 transition-all"
               >
                 <div className="w-full md:w-32 h-32 rounded-[2rem] bg-slate-100 overflow-hidden shrink-0 border border-slate-50 relative group">
                    {req.donation.imageUrl ? (
                       <img src={req.donation.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-4xl grayscale group-hover:grayscale-0 transition-all">🥪</div>
                    )}
                 </div>

                 <div className="flex-grow space-y-2 text-center md:text-left">
                    <Badge className={`${req.status === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'} border-none font-black text-[10px] uppercase tracking-widest`}>
                       {req.status}
                    </Badge>
                    <h3 className="text-2xl font-black tracking-tight leading-none italic">{req.donation.title}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <MapPin className="w-3.5 h-3.5" /> {req.donation.pickupLocation}, {req.donation.city}
                       </div>
                       {req.handoverPin && (
                           <div className="flex items-center gap-2 px-3 py-1 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 animate-pulse">
                              <ShieldCheck className="w-3 h-3" /> PIN: {req.handoverPin}
                           </div>
                        )}
                       <div className="flex items-center gap-2 text-xs font-black text-orange-600">
                          <Phone className="w-3.5 h-3.5" /> Call Donor
                       </div>
                    </div>
                 </div>

                 <div className="shrink-0 flex flex-col items-center gap-3">
                    <button 
                       onClick={() => setVerifyingId(req.id)}
                       className="px-10 py-5 bg-orange-600 text-white font-black rounded-2xl flex items-center gap-3 group-hover:bg-slate-950 transition-all shadow-xl shadow-orange-100 italic text-xs uppercase tracking-widest active:scale-95"
                    >
                        Verify Handover <ShieldCheck className="w-5 h-5" />
                     </button>
                     {req.riderId && (req.status === 'ASSIGNED' || req.status === 'ON_THE_WAY') && (
                        <button 
                           onClick={() => setTrackingId(req.id === trackingId ? null : req.id)}
                           className={`px-10 py-5 ${req.id === trackingId ? 'bg-slate-950' : 'bg-white border-2 border-orange-600 text-orange-600'} font-black rounded-2xl flex items-center gap-3 transition-all italic text-xs uppercase tracking-widest active:scale-95`}
                        >
                           {req.id === trackingId ? 'Tracking Active' : 'Live Track'} <Navigation className="w-5 h-5" />
                        </button>
                     )}
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Auth Required</span>
                  </div>
               </motion.div>
             ))
           ) : (
             <div className="p-16 rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center opacity-50">
                <CheckCircle2 className="w-12 h-12 text-slate-200 mb-4" />
                <h3 className="text-lg font-black italic">No active pickups</h3>
                <p className="text-slate-400 font-bold text-sm">Requested items will appear here once approved by donors.</p>
              </div>
           )}
        </div>

        {/* Tracking Map Section (Shown when an ID is selected) */}
        <AnimatePresence>
           {trackingId && (
              <motion.section 
                 initial={{ opacity: 0, height: 0 }} 
                 animate={{ opacity: 1, height: "auto" }} 
                 exit={{ opacity: 0, height: 0 }}
                 className="space-y-6 overflow-hidden pt-6"
              >
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                       <Navigation className="w-8 h-8 text-orange-600" /> Active Pursuit
                    </h2>
                    <button 
                       onClick={() => setTrackingId(null)}
                       className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-colors"
                    >
                       Close Tracking
                    </button>
                 </div>
                 
                 <div className="h-[450px] w-full rounded-[3.5rem] overflow-hidden border-2 border-slate-100 shadow-2xl relative">
                    {(() => {
                       const req = requests.find(r => r.id === trackingId);
                       if (!req) return null;
                       return (
                          <LiveRiderMap 
                             riderId={req.riderId}
                             riderName={req.rider?.name || "Rider"}
                             donorCoords={[req.donation.donor.longitude, req.donation.donor.latitude]}
                             ngoCoords={[req.ngo.longitude, req.ngo.latitude]}
                             status={req.status}
                          />
                       );
                    })()}
                 </div>
              </motion.section>
           )}
        </AnimatePresence>
      </section>

      {/* Pending and Completed Tabs - Simplified */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Pending Requests */}
         <div className="space-y-6">
            <h3 className="text-xl font-black italic flex items-center gap-2 px-2">
               <Clock className="w-5 h-5 text-slate-400" /> Awaiting Approval
            </h3>
            <div className="space-y-3">
               {pendingRequests.map(req => (
                  <div key={req.id} className="p-6 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-slate-200 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg">🍞</div>
                        <div>
                           <h4 className="font-black text-sm tracking-tight">{req.donation.title}</h4>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{req.donation.category}</p>
                        </div>
                     </div>
                     <Badge className="bg-white text-slate-400 border-none font-black text-[9px] uppercase">Pending</Badge>
                  </div>
               ))}
               {pendingRequests.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold italic tracking-wider">No pending requests</p>}
            </div>
         </div>

         {/* Completed History */}
         <div className="space-y-6">
            <h3 className="text-xl font-black italic flex items-center gap-2 px-2">
               <History className="w-5 h-5 text-orange-600" /> Operations History
            </h3>
            <div className="space-y-3">
               {completedRequests.map(req => (
                  <div key={req.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-between group hover:border-orange-200 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🎖️</div>
                         <div>
                            <h4 className="font-black text-sm tracking-tight group-hover:text-orange-600 transition-colors uppercase italic">{req.donation.title}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Donated by {req.donation.donor?.name || 'Hub'}</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => setShowReview(req.id)}
                         className="p-3 bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                      >
                         <Star className="w-4 h-4" />
                      </button>
                   </div>
                ))}
               {completedRequests.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold italic tracking-wider">No completed cycles</p>}
            </div>
         </div>
      </div>

      {/* Modals Container */}
      <AnimatePresence mode="wait">
         {/* Verify PIN Modal */}
         {verifyingId && (
            <motion.div 
               key="verify-modal"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }} 
                  animate={{ scale: 1, y: 0 }} 
                  className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl" />
                  <div className="text-center space-y-4">
                     <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-200 animate-pulse">
                        <ShieldCheck className="w-10 h-10 text-white" />
                     </div>
                     <h2 className="text-3xl font-black italic tracking-tight underline italic decoration-orange-600/20">Security Handover</h2>
                     <p className="text-slate-500 font-bold text-sm">Ask the donor for the secret 4-digit PIN to verify this collection.</p>
                  </div>

                  <div className="space-y-6">
                     <div className="flex justify-center gap-4">
                        <input 
                           type="text" 
                           maxLength={4}
                           placeholder="----"
                           autoFocus
                           className="w-full text-center text-5xl font-black tracking-[0.5em] py-8 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-orange-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-200 uppercase"
                           value={pin}
                           onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        />
                     </div>
                     
                     <div className="flex gap-4">
                        <button 
                           onClick={() => setVerifyingId(null)}
                           className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                        >
                           Cancel
                        </button>
                        <button 
                           onClick={handleVerifyHandover}
                           disabled={verifyLoading || pin.length < 4}
                           className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-slate-950 transition-all shadow-xl shadow-orange-200 disabled:opacity-50 uppercase text-xs tracking-widest flex items-center justify-center gap-3"
                        >
                           {verifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                           Verify PIN
                        </button>
                     </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-2xl flex items-center gap-3 text-orange-700">
                     <AlertCircle className="w-5 h-5 shrink-0" />
                     <p className="text-[10px] font-black uppercase tracking-wider leading-relaxed">Ensure all food items match the quality standards before verification.</p>
                  </div>
               </motion.div>
            </motion.div>
         )}

         {/* Review Donor Modal */}
         {showReview && (
            <motion.div 
               key="review-modal"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }} 
                  animate={{ scale: 1, y: 0 }} 
                  className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 relative overflow-hidden text-center italic"
               >
                  <div className="space-y-4">
                     <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-200 ring-8 ring-orange-50">
                        <Star className="w-10 h-10 text-white fill-white" />
                     </div>
                     <h2 className="text-3xl font-black tracking-tight uppercase">Rate Donor</h2>
                     <p className="text-slate-500 font-bold text-sm">How was your experience with this donor? Your feedback helps us build a better community.</p>
                  </div>

                  <div className="space-y-6">
                     <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                           <button key={star} onClick={() => setReviewRating(star)} className="transition-transform active:scale-90 hover:scale-110">
                              <Star className={`w-10 h-10 ${star <= reviewRating ? 'text-orange-500 fill-orange-500' : 'text-slate-200'}`} />
                           </button>
                        ))}
                     </div>

                     <textarea 
                        placeholder="Write a quick note... (optional)"
                        className="w-full h-32 p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-orange-600 focus:outline-none transition-all font-bold text-xs italic"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                     />
                     
                     <div className="flex gap-4">
                        <button onClick={() => setShowReview(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Later</button>
                        <button 
                           onClick={() => {
                              const req = requests.find(r => r.id === showReview);
                              if (req) handleReviewSubmit(req.id, req.donation.donorId, req.donationId);
                           }}
                           disabled={reviewLoading || reviewRating === 0}
                           className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-slate-950 transition-all shadow-xl shadow-orange-200 disabled:opacity-50 uppercase text-xs tracking-widest flex items-center justify-center gap-3"
                        >
                           {reviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-4 h-4" />}
                           Submit Feed
                        </button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
