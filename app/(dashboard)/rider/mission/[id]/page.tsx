"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Navigation,
  Upload,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";

export default function MissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pin, setPin] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}/detail`); // We'll need this helper or use standard GET
      if (!res.ok) throw new Error("Mission data unavailable.");
      const data = await res.json();
      setRequest(data);
    } catch (error) {
      toast.error("Sector scan failed.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleClaim = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/requests/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error("Failed to claim bounty.");
      toast.success("Bounty Claimed! GPS Synchronized.");
      fetchRequest();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleHandover = async () => {
    if (pin.length < 4) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/requests/${id}/handover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handover rejected.");
      
      toast.success("Supply Verified! Proceed to NGO Drop-off.");
      setVerifying(false);
      setPin("");
      fetchRequest();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await fetch("/api/upload/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const { presignedUrl, publicUrl, error: apiError } = await res.json();
      if (!res.ok) throw new Error(apiError || "Failed to initialize upload");

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");

      setProofImage(publicUrl);
      toast.success("Delivery proof captured.");
    } catch (error: any) {
      toast.error(error.message || "Comm link failure during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeliver = async () => {
    if (!proofImage) {
      toast.error("Visual proof required for protocol completion.");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/requests/${id}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryProofUrl: proofImage })
      });
      if (!res.ok) throw new Error("Mission completion rejected.");
      toast.success("Mission Accomplished! Sector Secured.");
      router.push("/rider");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  // Sync location every 30 seconds
  useEffect(() => {
    if (!request || request.status === "COMPLETED") return;

    const updateLocation = async (pos: GeolocationPosition) => {
      try {
        await fetch("/api/rider/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
        });
      } catch (e) {
        // Silent fail for background pings
      }
    };

    const watchId = navigator.geolocation.watchPosition(updateLocation, (err) => console.error(err), {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [request]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Zap className="w-12 h-12 text-orange-500 animate-pulse" />
      <span className="font-black text-[10px] uppercase tracking-[0.5em] text-orange-500 animate-pulse">Scanning Grid...</span>
    </div>
  );

  if (!request) return (
    <div className="text-center p-20 italic">
       <h2 className="text-2xl font-black uppercase">Mission Classified</h2>
       <p className="text-white/40 mt-2 font-bold">You do not have clearance for this sector.</p>
       <button onClick={() => router.push('/rider')} className="mt-8 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl uppercase font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">Return to Ops</button>
    </div>
  );

  const isBounty = request.status === "APPROVED" && !request.riderId;
  const isAssigned = request.status === "ASSIGNED";
  const isOnWay = request.status === "ON_THE_WAY";

  return (
    <div className="space-y-10 italic">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/rider')} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Badge className={`bg-orange-500/10 text-orange-500 border-none font-black text-[9px] uppercase tracking-widest`}>{request.status}</Badge>
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{request.id.split('-')[0]}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">{request.donation.title}</h1>
          </div>
        </div>

        {isBounty && (
          <button 
            onClick={handleClaim}
            disabled={updating}
            className="px-10 py-6 bg-orange-600 text-white font-black rounded-3xl text-lg shadow-2xl shadow-orange-950 hover:bg-orange-500 transition-all active:scale-95 uppercase tracking-tighter flex items-center gap-4"
          >
            {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            Claim Bounty
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Mission Detail */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Map Area */}
          <div className="h-[400px] md:h-[500px] w-full rounded-[3.5rem] bg-zinc-900 border border-white/5 overflow-hidden relative group">
             <LiveRiderMap 
                riderId={request.riderId}
                riderName="YOU"
                donorCoords={[request.donation.donor.longitude, request.donation.donor.latitude]}
                ngoCoords={[request.ngo.longitude, request.ngo.latitude]}
                status={request.status}
             />
             <div className="absolute top-6 left-6 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                <Navigation className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Tactical HUD Active</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Extraction Point</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <p className="text-xl font-black">{request.donation.donor.name}</p>
                      <p className="text-xs font-bold text-white/30 mt-1">{request.donation.donor.address}, {request.donation.donor.city}</p>
                   </div>
                   <button className="flex items-center gap-2 text-xs font-black text-white hover:text-orange-500 transition-colors">
                      <Phone className="w-4 h-4" /> Secure Comms
                   </button>
                </div>
             </div>

             <div className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-600" />
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Drop-Off Sector</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <p className="text-xl font-black">{request.ngo.name}</p>
                      <p className="text-xs font-bold text-white/30 mt-1">{request.ngo.address}, {request.ngo.city}</p>
                   </div>
                   <button className="flex items-center gap-2 text-xs font-black text-white hover:text-orange-500 transition-colors">
                      <Phone className="w-4 h-4" /> Secure Comms
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Tactical Actions */}
        <div className="space-y-8">
           <div className="p-8 md:p-10 rounded-[3rem] bg-orange-600/5 border border-orange-500/20 space-y-8 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-600/10 blur-[100px] group-hover:bg-orange-600/20 transition-all duration-1000" />
              
              <div className="space-y-2">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Mission Steps</h2>
                 <p className="text-[10px] font-bold text-orange-500/60 uppercase tracking-widest">Protocol Execution</p>
              </div>

              <div className="space-y-4 relative z-10">
                 <StepItem label="Extraction" description="Collect food & verify PIN" active={isAssigned} complete={isOnWay || request.status === 'COMPLETED'} />
                 <StepItem label="Transit" description="Navigate to drop-off" active={isOnWay} complete={request.status === 'COMPLETED'} />
                 <StepItem label="Final Handover" description="Verify delivery with proof" active={isOnWay} complete={request.status === 'COMPLETED'} />
              </div>

              {isAssigned && (
                 <motion.button 
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setVerifying(true)}
                   className="w-full py-6 bg-orange-600 text-white font-black rounded-3xl shadow-xl shadow-orange-950 hover:bg-orange-500 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-3"
                 >
                   <ShieldCheck className="w-5 h-5" /> Verify Extraction
                 </motion.button>
              )}

              {isOnWay && (
                 <div className="space-y-6">
                    <div className="relative h-40 w-full rounded-3xl bg-black/40 border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden group/upload">
                       {proofImage ? (
                          <img src={proofImage} className="w-full h-full object-cover" alt="Proof" />
                       ) : (
                          <>
                             <Upload className="w-8 h-8 text-white/20 mb-2 group-hover/upload:text-orange-500 transition-colors" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Upload Proof of Delivery</p>
                             <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleImageUpload}
                                accept="image/*"
                             />
                          </>
                       )}
                       {uploading && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                             <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                          </div>
                       )}
                    </div>
                    <button 
                      onClick={handleDeliver}
                      disabled={updating || !proofImage}
                      className="w-full py-6 bg-green-600 text-white font-black rounded-3xl shadow-xl shadow-green-950 hover:bg-green-500 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Finalize Mission
                    </button>
                 </div>
              )}
           </div>

           <div className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle className="w-5 h-5 text-orange-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Field Rules</h4>
              </div>
              <ul className="space-y-3 text-[10px] font-bold text-white/60">
                 <li className="flex gap-2"><span>1.</span> Visual proof is mandatory for karma points.</li>
                 <li className="flex gap-2"><span>2.</span> Keep your secure comms active during pursuit.</li>
                 <li className="flex gap-2"><span>3.</span> Any deviation from extraction route must be logged.</li>
              </ul>
           </div>
        </div>
      </div>

      {/* Handover Modal */}
      <AnimatePresence>
         {verifying && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-white/10 rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 text-center italic">
                  <div className="w-24 h-24 bg-orange-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-950">
                     <ShieldCheck className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black tracking-tight uppercase">Enter Extraction PIN</h2>
                     <p className="text-white/40 font-bold text-sm">Retrieve the 4-digit code from the donor to verify supply collection.</p>
                  </div>

                  <div className="space-y-10">
                     <input 
                        type="text" 
                        maxLength={4}
                        placeholder="----"
                        autoFocus
                        className="w-full text-center text-6xl font-black tracking-[0.5em] py-10 rounded-[2.5rem] bg-black border-2 border-white/5 focus:border-orange-600 focus:outline-none transition-all placeholder:text-zinc-800 uppercase shadow-inner"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                     />
                     
                     <div className="flex gap-4">
                        <button onClick={() => setVerifying(false)} className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-2xl hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button 
                           onClick={handleHandover}
                           disabled={updating || pin.length < 4}
                           className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-500 transition-all shadow-xl shadow-orange-900 disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
                        >
                           {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                           Verify PIN
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

function StepItem({ label, description, active = false, complete = false }: { label: string, description: string, active?: boolean, complete?: boolean }) {
   return (
      <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${complete ? 'bg-green-500/5 border-green-500/20' : active ? 'bg-orange-500/5 border-orange-600/40 shadow-lg shadow-orange-950/20' : 'bg-white/5 border-white/5 opacity-30'}`}>
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${complete ? 'bg-green-600/20 text-green-500' : active ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/20'}`}>
            {complete ? <CheckCircle2 className="w-5 h-5" /> : active ? <Clock className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
         </div>
         <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-widest ${complete ? 'text-green-500' : active ? 'text-white' : 'text-white/20'}`}>{label}</p>
            <p className="text-[9px] font-bold text-white/40 truncate">{description}</p>
         </div>
      </div>
   );
}
