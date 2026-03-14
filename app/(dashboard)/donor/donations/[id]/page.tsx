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

            {/* Hero Detail Header */}
            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/50 blur-3xl opacity-50" />
               <div className="w-full md:w-64 h-64 shrink-0 rounded-[2rem] bg-slate-100 border-2 border-slate-50 relative overflow-hidden group">
                  {donation.imageUrl ? (
                     <img src={donation.imageUrl} alt={donation.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-300">
                        <Package className="w-16 h-16" />
                        <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                     </div>
                  )}
               </div>

               <div className="flex-grow space-y-6 relative z-10 w-full mt-2">
                  <div className="flex justify-between items-start w-full">
                     <div className="space-y-2">
                        <Badge className={`${getStatusColor(donation.status)} border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 shadow-sm`}>
                           {donation.status}
                        </Badge>
                        <h1 className="text-4xl font-black tracking-tight leading-none italic">{donation.title}</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{donation.category} • {donation.quantity} Servings • {donation.weight} kg</p>
                     </div>
                  </div>

                  <p className="text-slate-500 font-bold leading-relaxed">{donation.description || "No description provided."}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Clock className="w-5 h-5" /></div>
                        <div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Expires At</p>
                           <p className="text-sm font-bold text-slate-700">{format(new Date(donation.expiryTime), "PPp")}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Calendar className="w-5 h-5" /></div>
                        <div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pickup Window</p>
                           <p className="text-sm font-bold text-slate-700">{format(new Date(donation.pickupStartTime), "HH:mm")} - {format(new Date(donation.pickupEndTime), "HH:mm")}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 md:col-span-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><MapPin className="w-5 h-5" /></div>
                        <div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pickup Location</p>
                           <p className="text-sm font-bold text-slate-700">{donation.pickupLocation}, {donation.city} {donation.pincode}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Step Tracker — Shows when there is an approved/active request */}
            {approvedRequest && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                  <h2 className="text-xl font-black italic tracking-tight mb-8">Logistics Tracker</h2>
                  <div className="flex items-start justify-between relative">
                     {/* Progress Bar Background */}
                     <div className="absolute top-6 left-0 right-0 h-1 bg-slate-100 rounded-full mx-12" />
                     <div 
                        className="absolute top-6 left-0 h-1 bg-orange-500 rounded-full mx-12 transition-all duration-700" 
                        style={{ width: `${Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100)}%` }}
                     />

                     {STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isActive = i + 1 <= currentStep;
                        const isCurrent = i + 1 === currentStep;
                        return (
                           <div key={i} className="flex flex-col items-center relative z-10 flex-1">
                              <motion.div 
                                 initial={false}
                                 animate={{ scale: isCurrent ? 1.2 : 1 }}
                                 className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                                    isActive 
                                       ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200' 
                                       : 'bg-white border-slate-200 text-slate-300'
                                 }`}
                              >
                                 <StepIcon className="w-5 h-5" />
                              </motion.div>
                              <span className={`text-[10px] font-black uppercase tracking-widest mt-3 text-center ${isActive ? 'text-orange-600' : 'text-slate-300'}`}>
                                 {step.label}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 mt-1 text-center max-w-[100px] hidden md:block">
                                 {step.description}
                              </span>
                           </div>
                        );
                     })}
                  </div>
               </motion.div>
            )}

            {/* Approved NGO / Handover PIN Section */}
            {approvedRequest && approvedRequest.status !== "COMPLETED" && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-orange-600 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-orange-100 border-4 border-orange-500">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 blur-[50px] scale-150" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                     
                     <div className="flex flex-col flex-grow items-center md:items-start text-center md:text-left space-y-4">
                        <h2 className="text-3xl font-black italic">Logistics Confirmed!</h2>
                        <p className="text-orange-100 font-bold max-w-lg">
                           You&apos;ve approved <span className="text-white">&quot;{approvedRequest.ngo?.name}&quot;</span> to collect this donation. 
                           When they (or their rider) arrive, verify their identity with the secret Handover PIN below before giving them the food.
                        </p>
                     </div>

                     <div className="w-full md:w-auto shrink-0 bg-white/10 border border-white/20 p-8 rounded-3xl flex flex-col items-center justify-center backdrop-blur-md">
                        <span className="text-[10px] uppercase font-black tracking-widest text-orange-200 mb-2">Secret Handover PIN</span>
                        <div className="text-6xl font-black tracking-[0.2em]">{approvedRequest.handoverPin || "----"}</div>
                        <span className="text-xs font-bold text-orange-200 mt-4 px-4 py-2 bg-black/20 rounded-full">Share ONLY in person</span>
                     </div>

                  </div>
               </motion.div>
            )}

            {/* Real-time Tracking Map */}
            {approvedRequest && approvedRequest.riderId && (approvedRequest.status === "ASSIGNED" || approvedRequest.status === "ON_THE_WAY") && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                        <Navigation className="w-8 h-8 text-orange-600" /> Live Pursuit Grid
                     </h2>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Satellite Link Active</span>
                     </div>
                  </div>
                  
                  <div className="h-[400px] w-full rounded-[3rem] overflow-hidden border-2 border-slate-100 shadow-2xl">
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

            {/* Completed — Success + Review */}
            {completedRequest && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-green-100 border-4 border-green-500">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 blur-[50px] scale-150" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                     <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shrink-0">
                        <PartyPopper className="w-10 h-10 text-white" />
                     </div>
                     <div className="flex-grow text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-black italic">Mission Accomplished!</h2>
                        <p className="text-green-100 font-bold max-w-lg">
                           Your donation &quot;{donation.title}&quot; has been successfully delivered to {completedRequest.ngo?.name}. 
                           You&apos;ve made a real difference today! 🎉
                        </p>
                        {completedRequest.completedAt && (
                           <p className="text-[10px] uppercase font-black tracking-widest text-green-200">
                              Completed on {format(new Date(completedRequest.completedAt), "PPp")}
                           </p>
                        )}
                     </div>
                     <button 
                        onClick={() => setShowReview(!showReview)}
                        className="shrink-0 px-6 py-4 bg-white text-green-700 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2"
                     >
                        <Star className="w-4 h-4" /> Rate NGO
                     </button>
                  </div>

                  {/* Review Form */}
                  <AnimatePresence>
                     {showReview && (
                        <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           className="relative z-10 mt-8 bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-md"
                        >
                           <h3 className="font-black text-lg mb-4">Rate {completedRequest.ngo?.name}</h3>
                           
                           {/* Star Rating */}
                           <div className="flex gap-2 mb-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    className="transition-all hover:scale-125 active:scale-95"
                                 >
                                    <Star 
                                       className={`w-10 h-10 ${star <= reviewRating ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`} 
                                    />
                                 </button>
                              ))}
                           </div>

                           {/* Comment Box */}
                           <textarea
                              placeholder="Share your experience... (optional)"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/40 font-bold text-sm resize-none h-24 focus:outline-none focus:border-white/40"
                           />

                           <div className="flex gap-3 mt-4">
                              <button
                                 onClick={() => setShowReview(false)}
                                 className="px-6 py-3 bg-white/10 border border-white/20 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
                              >
                                 Cancel
                              </button>
                              <button
                                 onClick={() => handleReviewSubmit(completedRequest.ngoId)}
                                 disabled={reviewLoading || reviewRating === 0}
                                 className="flex-1 px-6 py-3 bg-white text-green-700 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                 {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                 Submit Review
                              </button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
            )}

            {/* Pending Requests */}
            {donation.status === "AVAILABLE" && pendingRequests && pendingRequests.length > 0 && (
               <div className="space-y-6 pt-6">
                  <div className="flex items-end justify-between px-2">
                     <div>
                        <h2 className="text-2xl font-black italic">Pending Requests</h2>
                        <p className="text-slate-500 font-bold text-sm">NGOs requesting this donation.</p>
                     </div>
                     <Badge className="bg-blue-50 text-blue-600 border-none font-black">{pendingRequests.length} Received</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {pendingRequests.map((req: any) => (
                        <div key={req.id} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col hover:border-blue-200 transition-colors">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                 {req.ngo?.imageUrl ? (
                                    <img src={req.ngo.imageUrl} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-lg">
                                       {req.ngo?.name?.charAt(0) || "N"}
                                    </div>
                                 )}
                              </div>
                              <div>
                                 <h4 className="font-black text-lg tracking-tight leading-none">{req.ngo?.name}</h4>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{req.ngo?.city} based</span>
                              </div>
                           </div>

                           <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                              <p className="text-sm font-bold text-slate-600 italic">&quot;{req.message || "No message provided."}&quot;</p>
                           </div>

                           <div className="mt-auto grid grid-cols-2 gap-3">
                              <button 
                                 className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                                 onClick={() => handleRequestAction(req.id, "REJECTED")}
                                 disabled={actionLoading !== null}
                              >
                                 <XCircle className="w-4 h-4" /> Decline
                              </button>
                              <button 
                                 className="flex items-center justify-center gap-2 py-3 bg-slate-950 text-white hover:bg-orange-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
                                 onClick={() => handleRequestAction(req.id, "APPROVED")}
                                 disabled={actionLoading !== null}
                              >
                                 {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                 Approve
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {donation.status === "AVAILABLE" && pendingRequests?.length === 0 && (
               <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 mb-6 border border-slate-100">
                     <Users className="w-8 h-8 text-slate-300" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tight mb-2 text-slate-900">Waiting for NGOs...</h3>
                  <p className="text-slate-400 font-bold">Your donation is live! We&apos;ll notify you as soon as an NGO sends a pickup request.</p>
               </div>
            )}

         </div>
      </main>
    </div>
  );
}
