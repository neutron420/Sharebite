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
      const res = await fetch(`/api/requests/${id}/detail`);
      if (!res.ok) throw new Error("Mission data unavailable.");
      const data = await res.json();
      setRequest(data);
    } catch (error) {
      toast.error("Failed to load mission data.");
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
      if (!res.ok) throw new Error("Failed to claim mission.");
      toast.success("Mission Claimed! GPS synchronized.");
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
      toast.error(error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeliver = async () => {
    if (!proofImage) {
      toast.error("Visual proof required for completion.");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/requests/${id}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryProofUrl: proofImage })
      });
      if (!res.ok) throw new Error("Mission completion failed.");
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
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-gray-500 text-sm">Loading mission data...</span>
    </div>
  );

  if (!request) return (
    <div className="text-center p-20">
       <h2 className="text-2xl font-bold text-gray-900">Mission Not Found</h2>
       <p className="text-gray-500 mt-2">The requested mission might have been reassigned or completed.</p>
       <button onClick={() => router.push('/rider')} className="mt-8 px-6 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-semibold text-sm hover:bg-gray-200 text-gray-900 transition-all">Return to Dashboard</button>
    </div>
  );

  const isBounty = request.status === "APPROVED" && !request.riderId;
  const isAssigned = request.status === "ASSIGNED";
  const isOnWay = request.status === "ON_THE_WAY";

  return (
    <div className="space-y-10 text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => router.push('/rider')} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100 font-bold px-2 py-0 text-[10px] uppercase">{request.status}</Badge>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">#{request.id.split('-')[0]}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{request.donation.title}</h1>
          </div>
        </div>

        {isBounty && (
          <button 
            onClick={handleClaim}
            disabled={updating}
            className="px-10 py-5 bg-orange-600 text-white font-bold rounded-2xl text-lg shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-3"
          >
            {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            Claim Mission
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Mission Detail */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Map Area */}
          <div className="h-[400px] md:h-[500px] w-full rounded-[2.5rem] bg-gray-50 border border-gray-200 overflow-hidden relative group shadow-sm">
             <LiveRiderMap 
                riderId={request.riderId}
                riderName="YOU"
                donorCoords={[request.donation.donor.longitude, request.donation.donor.latitude]}
                ngoCoords={[request.ngo.longitude, request.ngo.latitude]}
                status={request.status}
             />
             <div className="absolute top-6 left-6 p-4 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl flex items-center gap-3 shadow-lg">
                <Navigation className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-gray-600">Tactical Map Active</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-8 rounded-[2rem] bg-white border border-gray-100 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                      <MapPin className="w-5 h-5 text-orange-500" />
                   </div>
                   <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Pickup Location</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <p className="text-xl font-bold text-gray-900">{request.donation.donor.name}</p>
                      <p className="text-sm font-medium text-gray-500 mt-1">{request.donation.donor.address}, {request.donation.donor.city}</p>
                   </div>
                   <button className="flex items-center gap-2 text-xs font-bold text-gray-900 hover:text-orange-600 transition-colors">
                      <Phone className="w-4 h-4" /> Call Donor
                   </button>
                </div>
             </div>

             <div className="p-8 rounded-[2rem] bg-white border border-gray-100 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                      <Truck className="w-5 h-5 text-emerald-600" />
                   </div>
                   <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Delivery Location</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <p className="text-xl font-bold text-gray-900">{request.ngo.name}</p>
                      <p className="text-sm font-medium text-gray-500 mt-1">{request.ngo.address}, {request.ngo.city}</p>
                   </div>
                   <button className="flex items-center gap-2 text-xs font-bold text-gray-900 hover:text-orange-600 transition-colors">
                      <Phone className="w-4 h-4" /> Call NGO
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Tactical Actions */}
        <div className="space-y-6">
           <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-gray-100 space-y-8 relative overflow-hidden group shadow-sm">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-600/5 blur-[100px]" />
              
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold text-gray-900">Mission Flow</h2>
                 <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Protocol Progress</p>
              </div>

              <div className="space-y-4 relative z-10">
                 <StepItem label="Pickup" description="Collect food & verify PIN" active={isAssigned} complete={isOnWay || request.status === 'COMPLETED'} />
                 <StepItem label="Transit" description="Navigate to drop-off" active={isOnWay} complete={request.status === 'COMPLETED'} />
                 <StepItem label="Completion" description="Upload delivery proof" active={isOnWay} complete={request.status === 'COMPLETED'} />
              </div>

              {isAssigned && (
                 <motion.button 
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setVerifying(true)}
                   className="w-full py-5 bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/10 hover:bg-orange-700 transition-all text-sm flex items-center justify-center gap-3"
                 >
                   <ShieldCheck className="w-5 h-5" /> Verify Collection
                 </motion.button>
              )}

              {isOnWay && (
                 <div className="space-y-6">
                    <div className="relative h-44 w-full rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group/upload transition-colors hover:border-orange-200 hover:bg-orange-50/10">
                       {proofImage ? (
                          <img src={proofImage} className="w-full h-full object-cover" alt="Proof" />
                       ) : (
                          <>
                             <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover/upload:text-orange-500 transition-colors" />
                             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center px-4">Upload Delivery Proof</p>
                             <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleImageUpload}
                                accept="image/*"
                             />
                          </>
                       )}
                       {uploading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                             <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                          </div>
                       )}
                    </div>
                    <button 
                      onClick={handleDeliver}
                      disabled={updating || !proofImage}
                      className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Complete Mission
                    </button>
                 </div>
              )}
           </div>

           <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle className="w-4 h-4 text-orange-500" />
                 <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Mission Notes</h4>
              </div>
              <ul className="space-y-3 text-xs font-medium text-gray-500">
                 <li className="flex gap-2"><span>•</span> Visual proof is required for completion.</li>
                 <li className="flex gap-2"><span>•</span> Contact donor if pickup is delayed.</li>
                 <li className="flex gap-2"><span>•</span> Verify contents match the description.</li>
              </ul>
           </div>
        </div>
      </div>

      {/* Handover Modal */}
      <AnimatePresence>
         {verifying && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl space-y-6 text-center">
                  <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                     <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-2xl font-bold text-gray-900">Verify Collection</h2>
                     <p className="text-gray-500 text-xs px-4">Enter the 4-digit code provided by the donor to verify pickup.</p>
                  </div>

                  <div className="space-y-8">
                     <input 
                        type="text" 
                        maxLength={4}
                        placeholder="----"
                        autoFocus
                        className="w-full text-center text-5xl font-bold tracking-[0.5em] py-8 rounded-2xl bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white focus:outline-none transition-all placeholder:text-gray-200"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                     />
                     
                     <div className="flex gap-3">
                        <button onClick={() => setVerifying(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">Cancel</button>
                        <button 
                           onClick={handleHandover}
                           disabled={updating || pin.length < 4}
                           className="flex-[2] py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/10 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
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
      <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${complete ? 'bg-emerald-50 border-emerald-100' : active ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${complete ? 'bg-emerald-500 text-white' : active ? 'bg-orange-600 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
            {complete ? <CheckCircle2 className="w-5 h-5" /> : active ? <Clock className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
         </div>
         <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider ${complete ? 'text-emerald-600' : active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
            <p className={`text-[10px] font-medium truncate ${active ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>
         </div>
      </div>
   );
}
