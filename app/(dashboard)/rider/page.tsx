"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Navigation,
  CheckCircle2, 
  Loader2,
  TrendingUp,
  Truck,
  Zap,
  Clock,
  ChevronRight,
  Phone,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  status: string;
  riderId?: string;
  donationId: string;
  ngoId: string;
  donation: {
    id: string;
    title: string;
    donorId: string;
    donor: {
      name: string;
      address: string;
      city: string;
    };
  };
  ngo: {
    id: string;
    name: string;
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
      toast.error(error.message || "Could not load missions.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (donationId: string, participantId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, participantId }),
      });
      
      if (res.ok) {
        const conversation = await res.json();
        router.push(`/rider/messages?id=${conversation.id}`);
      } else {
        const error = await res.json();
        toast.error("Failed to start chat", { description: error.message || "Unknown error" });
      }
    } catch (err) {
      toast.error("Something went wrong joining the chat.");
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
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-gray-500 text-sm">Loading missions...</span>
    </div>
  );

  return (
    <div className="w-full space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-[10px] tracking-widest uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             System Online
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight italic uppercase">
             Mission Hub
          </h1>
          <p className="text-[10px] sm:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Manage deployments & source new bounties.</p>
        </motion.div>
      </header>

      {/* Active Mission */}
      <section className="space-y-4">
         <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Truck className="w-4 h-4" /> Active Mission
         </h2>

         {activeMission ? (
           <motion.div 
             initial={{ opacity: 0, y: 10 }} 
             animate={{ opacity: 1, y: 0 }}
             className="bg-white border border-gray-200 rounded-[2rem] sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
           >
             <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-orange-500/5 blur-3xl" />
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-center relative z-10">
                <div className="space-y-4 sm:space-y-6">
                   <div className="space-y-2">
                      <Badge className="bg-orange-500 text-white border-none py-1">
                         {activeMission.status}
                      </Badge>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{activeMission.donation.title}</h3>
                      <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                         {activeMission.status === 'ASSIGNED' ? 'Objective: Pickup Food' : 'Objective: Deliver to NGO'}
                      </div>
                   </div>

                   <div className="space-y-3">
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

                <div className="flex flex-col items-center gap-4">
                   <button 
                      onClick={() => {
                         if (activeMission.status === 'ASSIGNED') {
                            setVerifyingId(activeMission.id);
                         } else {
                            router.push(`/rider/mission/${activeMission.id}`);
                         }
                      }}
                      className="w-full py-6 bg-orange-600 text-white font-bold rounded-2xl text-lg hover:bg-orange-700 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
                   >
                      {activeMission.status === 'ASSIGNED' ? 'Verify Handover' : 'Briefing Details'} <Navigation className="w-5 h-5" />
                   </button>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                         onClick={() => handleStartChat(activeMission.donationId, activeMission.ngoId)}
                         className="flex-1 py-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm"
                      >
                         <MessageSquare className="w-4 h-4" /> Message NGO
                      </button>
                      <button 
                         onClick={() => handleStartChat(activeMission.donationId, activeMission.donation.donorId)}
                         className="flex-1 py-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm"
                      >
                         <MessageSquare className="w-4 h-4" /> Message Donor
                      </button>
                   </div>
                </div>
             </div>
           </motion.div>
         ) : (
           <div className="p-16 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                 <Zap className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Missions</h3>
              <p className="text-xs text-gray-500 max-w-xs">Scan the bounty board below or in the menu to pick up new delivery requests.</p>
           </div>
         )}
      </section>

      {/* Bounties */}
      <section className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
               <Zap className="w-4 h-4 text-orange-600" /> Available Bounties
            </h2>
            <div className="flex items-center gap-3">
               <Badge variant="outline" className="text-gray-500">{availableBounties.length} Available</Badge>
               <Link href="/rider/bounties" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">See all opportunities &rarr;</Link>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableBounties.slice(0, 6).map((bounty, i) => (
              <motion.div 
                key={bounty.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 sm:p-8 rounded-[1.5rem] sm:rounded-3xl bg-white border border-gray-100 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer group flex flex-col"
                onClick={() => router.push(`/rider/mission/${bounty.id}`)}
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors shrink-0">
                       <Package className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100 text-[9px] sm:text-[10px] font-bold">LIVE CARGO</Badge>
                 </div>
                 <h4 className="text-lg sm:text-xl font-bold mb-1 truncate text-gray-900">{bounty.donation.title}</h4>
                 <p className="text-[10px] sm:text-xs text-gray-500 truncate mb-6 sm:mb-8">{bounty.donation.donor.address}</p>
                 
                 <div className="flex items-center justify-between pt-4 sm:pt-5 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-2">
                       <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                       <span className="text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-tighter sm:tracking-normal">+150 KARMA</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all scale-90 sm:scale-100">
                       <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
         {availableBounties.length === 0 && (
           <div className="p-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-3xl">
             No available bounties in your region right now.
           </div>
         )}
      </section>

      {/* Handover PIN Modal */}
      <AnimatePresence>
         {verifyingId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl space-y-6 text-center">
                  <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                     <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-2xl font-bold text-gray-900">Security Key</h2>
                     <p className="text-gray-500 text-xs px-4">Enter the 4-digit verification code provided by the donor.</p>
                  </div>

                  <div className="space-y-6">
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
                        <button onClick={() => setVerifyingId(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">Cancel</button>
                        <button 
                           onClick={handleHandover}
                           disabled={actionLoading || pin.length < 4}
                           className="flex-[2] py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/10 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                           {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
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

function MissionWayPoint({ label, value, active = false }: { label: string, value: string, active?: boolean }) {
   return (
      <div className={`p-5 rounded-2xl border transition-all duration-300 ${active ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
         <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-orange-600 animate-pulse' : 'bg-gray-300'}`} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
         </div>
         <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
   );
}
