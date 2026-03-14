"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Package, 
  MapPin, 
  Navigation,
  CheckCircle2, 
  Loader2,
  TrendingUp,
  LayoutDashboard,
  LogOut,
  Bell,
  Truck,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  Phone
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  status: string;
  riderId?: string;
  donationId: string;
  ngoId: string;
  donation: {
    id: string;
    title: string;
    donor: {
      address: string;
      city: string;
    };
  };
  ngo: {
    address: string;
    city: string;
  };
}

export default function RiderDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/requests");
      if (res.status === 403) {
         const errData = await res.json();
         throw new Error(errData.error || "Access Denied. Riders only.");
      }
      if (!res.ok) throw new Error("Ops grid offline.");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Could not load mission grid.");
    } finally {
      setLoading(false);
    }
  };

  const handleHandover = async () => {
    if (!verifyingId || pin.length < 4) {
      toast.error("Enter the 4-digit Handover PIN");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requests/${verifyingId}/handover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handover failed.");

      toast.success("Handover Success! Move to NGO location.");
      setVerifyingId(null);
      setPin("");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };



  const activeMission = tasks.find(t => t.riderId && (t.status === "ASSIGNED" || t.status === "ON_THE_WAY"));
  const availableBounties = tasks.filter(t => !t.riderId && t.status === "APPROVED");

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Zap className="w-12 h-12 text-orange-500 animate-pulse" />
      <span className="font-black text-[10px] uppercase tracking-[0.5em] text-orange-500 animate-pulse">Scanning Sector...</span>
    </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/80">System Online / Location Active</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 uppercase text-black">
                 Mission Update
              </h1>
              <p className="text-gray-600 font-bold italic">Secure logistics & humanitarian response protocol.</p>
            </motion.div>
          </header>

          {/* Active Primary Mission */}
          <section className="space-y-6">
             <h2 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500/50 flex items-center gap-3">
                <Truck className="w-4 h-4" /> Primary Mission
             </h2>

             {activeMission ? (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white border border-gray-200 rounded-[3rem] p-10 relative overflow-hidden group shadow-xl"
               >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px]" />
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <Badge className="bg-orange-600 text-white border-none font-black text-[10px] px-3 py-1">
                             {activeMission.status}
                          </Badge>
                          <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-none truncate text-black">{activeMission.donation.title}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 italic">
                             Status: {activeMission.status === 'ASSIGNED' ? 'Proceed to pickup' : 'Proceed to delivery'}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <MissionWayPoint 
                             label="Pickup Site" 
                             value={activeMission.donation.donor.address + ", " + activeMission.donation.donor.city} 
                             active={activeMission.status === 'ASSIGNED'} 
                          />
                          <MissionWayPoint 
                             label="Delivery Drop" 
                             value={activeMission.ngo.address + ", " + activeMission.ngo.city} 
                             active={activeMission.status === 'ON_THE_WAY'} 
                          />
                       </div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                       {activeMission.status === 'ASSIGNED' ? (
                          <button 
                             onClick={() => setVerifyingId(activeMission.id)}
                             className="w-full py-8 bg-orange-600 text-white font-black rounded-3xl text-xl shadow-2xl shadow-orange-950/50 hover:bg-orange-500 transition-all active:scale-95 uppercase tracking-tighter"
                          >
                             Verify Handover PIN
                          </button>
                       ) : (
                          <button 
                             onClick={() => router.push(`/rider/mission/${activeMission.id}`)}
                             className="w-full py-8 bg-black border border-white/10 text-white font-black rounded-3xl text-xl hover:bg-white hover:text-black transition-all active:scale-95 uppercase tracking-tighter flex items-center justify-center gap-4"
                          >
                             Mission Brief <Navigation className="w-6 h-6" />
                          </button>
                       )}
                       
                       <div className="flex gap-4 w-full">
                          <button className="flex-1 py-4 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-gray-200 transition-all text-black">
                             <Phone className="w-4 h-4" /> Contact NGO
                          </button>
                          <button className="flex-1 py-4 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-gray-200 transition-all text-black">
                             <Phone className="w-4 h-4" /> Contact Donor
                          </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="p-20 rounded-[3.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
                  <Zap className="w-12 h-12 mb-4 text-gray-400" />
                  <h3 className="text-xl font-black uppercase tracking-widest text-black">No Active Mission</h3>
                  <p className="text-xs font-bold mt-2 text-gray-600">Check available bounties in your sector.</p>
               </div>
             )}
          </section>

          {/* Available Bounties */}
          <section className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                   <Zap className="w-4 h-4 text-orange-500" /> Regional Bounties
                </h2>
                <Badge className="bg-gray-100 text-gray-400 border-none font-black text-[9px] uppercase tracking-widest">{availableBounties.length} Available</Badge>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableBounties.map((bounty, i) => (
                  <motion.div 
                    key={bounty.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:border-orange-500/50 transition-all cursor-pointer group shadow-sm"
                    onClick={() => router.push(`/rider/mission/${bounty.id}`)}
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-colors border border-gray-100">
                           <Package className="w-6 h-6 text-gray-400 group-hover:text-white" />
                        </div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full italic">Priority</span>
                     </div>
                     <h4 className="text-xl font-black mb-1 truncate text-black">{bounty.donation.title}</h4>
                     <p className="text-xs font-bold text-gray-500 italic mb-6 truncate">{bounty.donation.donor.address}</p>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-green-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-black/60">+50 Karma</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                     </div>
                  </motion.div>
                ))}
             </div>
          </section>

      </div>

      {/* Handover PIN Modal */}
      <AnimatePresence>
         {verifyingId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-white/10 rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 text-center italic">
                  <div className="w-24 h-24 bg-orange-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-950 animate-pulse">
                     <ShieldCheck className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black tracking-tight uppercase text-white">Enter Handover PIN</h2>
                     <p className="text-white/40 font-bold text-sm">Retrieve the 4-digit code from the donor to verify supply collection.</p>
                  </div>

                  <div className="space-y-10">
                     <input 
                        type="text" 
                        maxLength={4}
                        placeholder="----"
                        autoFocus
                        className="w-full text-center text-6xl font-black tracking-[0.5em] py-10 rounded-[2.5rem] bg-black border-2 border-white/5 focus:border-orange-600 focus:outline-none transition-all placeholder:text-zinc-800 uppercase shadow-inner text-white"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                     />
                     
                     <div className="flex gap-4">
                        <button onClick={() => setVerifyingId(null)} className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-2xl hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button 
                           onClick={handleHandover}
                           disabled={actionLoading || pin.length < 4}
                           className="flex-2 py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-500 transition-all shadow-xl shadow-orange-900 disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
                        >
                           {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                           Verify PIN
                        </button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </>
  );
}



function MissionWayPoint({ label, value, active = false }: { label: string, value: string, active?: boolean }) {
   return (
      <div className={`p-6 rounded-3xl border transition-all ${active ? 'bg-orange-600/5 border-orange-600/30' : 'bg-gray-50 border-gray-100'}`}>
         <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-gray-300'}`} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
         </div>
         <p className="text-sm font-bold text-black truncate">{value}</p>
      </div>
   );
}
