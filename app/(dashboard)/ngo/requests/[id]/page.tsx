"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Navigation,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";
import RazorpayPayment from "@/components/payments/razorpay-payout";
import { useSocket } from "@/components/providers/socket-provider";
import { RIDER_PAYOUT_AMOUNT_INR } from "@/lib/payout";


export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [pin, setPin] = useState("");
  const { addListener } = useSocket();


  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error("Mission not found");
      const data = await res.json();
      setRequest(data);
    } catch (error) {
      toast.error("Could not load mission details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchRequest();

    const removeListener = addListener("mission_update", (data) => {
       if (data.requestId === id) fetchRequest();
    });

    return () => removeListener();
  }, [id, fetchRequest, addListener]);


  const handleVerifyHandover = async () => {
    if (pin.length < 4) {
      toast.error("Enter the 4-digit donor pickup PIN");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`/api/requests/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        toast.success("Handover Verified!");
        fetchRequest();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Locking onto coordinates...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white text-center italic">
        <AlertCircle className="w-16 h-16 text-slate-100 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2 italic">Mission Scrubbed</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">The manifest does not exist or has been archived.</p>
        <button onClick={() => router.back()} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">
          Return to Base
        </button>
      </div>
    );
  }

  const isLive = request.status === "ASSIGNED" || request.status === "ON_THE_WAY";
  const isPayoutStage = request.status === "COMPLETED" && (request.step || 0) >= 3.4 && (request.step || 0) < 4;
  const isReadyToReleasePayout = (request.step || 0) >= 3.5 && (request.step || 0) < 4;

  return (
    <div className="w-full space-y-8 sm:space-y-12 pb-20 italic">
      <header className="flex items-center gap-4 sm:gap-6">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight italic uppercase text-slate-950 truncate">Mission Manifest</h1>
          <p className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest truncate">Tracking ID: {id}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
        {/* Manifest Details */}
        <div className="lg:col-span-2 space-y-8 sm:space-y-10">
          <section className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-orange-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
             
             <div className="flex flex-col md:flex-row gap-6 sm:gap-10 relative z-10">
                <div className="w-full md:w-48 xl:w-56 h-48 sm:h-56 rounded-2xl sm:rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden shadow-inner shrink-0">
                   {request.donation.imageUrl ? (
                      <img src={request.donation.imageUrl} className="w-full h-full object-cover" alt="" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl grayscale opacity-40 italic">🥪</div>
                   )}
                </div>

                <div className="flex-grow space-y-5 sm:space-y-6">
                   <div className="space-y-2">
                      <Badge className="bg-orange-50 text-orange-600 border-none font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-3 sm:px-4 py-1.5 shadow-sm scale-95 origin-left">
                         {request.status}
                      </Badge>
                      <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-slate-950 uppercase leading-none">{request.donation.title}</h2>
                   </div>

                   <div className="grid grid-cols-2 gap-4 sm:gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">Donor Point</p>
                        <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 uppercase truncate">
                           <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" /> {request.donation.donor.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">Latest Update</p>
                        <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 uppercase truncate">
                           <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" /> {request.donation.expiryTime ? new Date(request.donation.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                      </div>
                   </div>

                   <button className="w-full sm:w-fit flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-slate-50 hover:bg-orange-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-600 transition-all border border-slate-100 hover:border-orange-200">
                      <Phone className="w-4 h-4" /> Secure Channel To Donor
                   </button>
                </div>
             </div>
          </section>

          {/* Pursuit Grid / Map */}
          {isLive && (
             <section className="space-y-4 sm:space-y-6">
                <h3 className="text-[10px] sm:text-sm font-black italic flex items-center gap-3 text-slate-950 uppercase tracking-widest underline decoration-orange-600/10 underline-offset-4 px-2">
                   <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" /> Live Pursuit Grid
                </h3>
                <div className="h-[350px] sm:h-[500px] w-full rounded-2xl sm:rounded-[3rem] xl:rounded-[4rem] overflow-hidden border border-slate-100 shadow-2xl relative shadow-orange-100/20 bg-slate-50 sm:scale-100 origin-center">
                   <LiveRiderMap 
                      riderId={request.riderId}
                      riderName={request.rider?.name || "Rider"}
                      donorCoords={[request.donation.donor.longitude, request.donation.donor.latitude]}
                      ngoCoords={[request.ngo.longitude, request.ngo.latitude]}
                      status={request.status}
                   />
                </div>
             </section>
          )}

          {isPayoutStage && (
             <section className="p-8 sm:p-16 rounded-3xl sm:rounded-[4rem] bg-slate-950 text-white flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-xl shadow-orange-600/20">
                   <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight">Payout Control Center</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                   {isReadyToReleasePayout
                      ? "Donation is completed and NGO PIN verification is done. Release rider payout to fully close this mission."
                      : "Donation is completed. Share the NGO PIN with the rider first. Once verified, payout release will unlock."}
                </p>
                {isReadyToReleasePayout ? (
                  <div className="pt-2 w-full max-w-xs">
                     <RazorpayPayment 
                        requestId={id} 
                        amount={RIDER_PAYOUT_AMOUNT_INR}
                        onSuccess={fetchRequest}
                        className="w-full"
                        label="Release Rider Payout"
                     />
                  </div>
                ) : null}
             </section>
          )}

          {request.status === 'COMPLETED' && (request.step || 0) >= 4 && (
             <section className="p-8 sm:p-16 rounded-3xl sm:rounded-[4rem] bg-orange-600 text-white flex flex-col items-center justify-center text-center space-y-6 shadow-2xl shadow-orange-100">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center border border-white/30">
                   <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tight">Mission Accomplished</h3>
                <p className="text-orange-50/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                   The logistics grid log is finalized. extracted and delivered. All rewards have been credited to relevant hubs.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                   <button onClick={() => router.push('/ngo/history')} className="w-full sm:w-auto px-10 py-5 bg-slate-950 text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Archived Logs</button>
                   <button onClick={() => router.push('/ngo/requests')} className="w-full sm:w-auto px-10 py-5 bg-white text-orange-600 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-700/20">Back to Hub</button>
                </div>
             </section>
          )}
        </div>

        {/* Action Panel */}
        <div className="space-y-6 sm:space-y-10">
           <section className="bg-slate-50 p-6 sm:p-8 rounded-3xl sm:rounded-[3rem] border border-slate-100 space-y-6 sm:space-y-8 shadow-sm">
              <div className="space-y-1">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Comms</h3>
                 <p className="text-base sm:text-lg font-black text-slate-950 leading-tight uppercase italic">Direct channel access</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                 <button className="flex items-center justify-between p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 group hover:border-orange-200 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-black text-sm uppercase italic">D</div>
                       <div className="text-left">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Protocol</p>
                          <p className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Contact Donor</p>
                       </div>
                    </div>
                    <MessageSquare className="w-5 h-5 text-slate-200 group-hover:text-orange-600 transition-colors" />
                 </button>

                 {request.riderId && (
                   <button className="flex items-center justify-between p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 group hover:border-orange-200 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase italic">R</div>
                        <div className="text-left">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Protocol</p>
                           <p className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Contact Rider</p>
                        </div>
                      </div>
                      <MessageSquare className="w-5 h-5 text-slate-200 group-hover:text-orange-600 transition-colors" />
                   </button>
                 )}
              </div>
           </section>

           {request.status === 'APPROVED' && !request.riderId && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[3rem] border border-slate-950/10 space-y-6 sm:space-y-8 shadow-xl shadow-slate-200/50">
                 <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 underline underline-offset-4 decoration-orange-600/20">Direct Handover Gate</h3>
                    <p className="text-base sm:text-lg font-black text-slate-950 leading-tight uppercase italic">Awaiting Donor PIN Auth</p>
                 </div>

                 <div className="space-y-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                       Input the 4-digit PIN shared by donor for direct NGO extraction.
                    </p>
                    <input 
                       type="text" 
                       maxLength={4} 
                       placeholder="----"
                       className="w-full text-center py-5 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-orange-500 focus:bg-white text-3xl font-black tracking-[0.4em] transition-all outline-none italic"
                       value={pin}
                       onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    />
                    <button 
                       onClick={handleVerifyHandover}
                       disabled={verifying || pin.length < 4}
                       className="w-full py-5 bg-orange-600 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                       {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                       Verify & Close Extraction
                    </button>
                 </div>
              </section>
           )}
        </div>
      </div>
    </div>
  );
}
