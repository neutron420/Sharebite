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
  LayoutDashboard,
  LogOut,
  Bell,
  Truck,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  Phone,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
      toast.error(error.message || "Could not load mission grid.");
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
      toast.error("Something went wrong joining the ops channel.");
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
      <div className="max-w-6xl mx-auto space-y-12 py-10 px-4">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/80">System Online / Location Active</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 uppercase text-black italic">
                 Mission Update
              </h1>
              <p className="text-gray-600 font-bold italic uppercase text-[10px] tracking-widest">Secure logistics & humanitarian response protocol.</p>
            </motion.div>
          </header>

          {/* Active Mission */}
          <section className="space-y-6">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600/50 flex items-center gap-3">
                <Truck className="w-4 h-4" /> Primary Mission
             </h2>

             {activeMission ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.98 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-white border-2 border-slate-100 rounded-[3.5rem] p-10 relative overflow-hidden group shadow-2xl shadow-slate-100"
               >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px]" />
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8">
                       <div className="space-y-3">
                          <Badge className="bg-slate-950 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                             {activeMission.status}
                          </Badge>
                          <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none italic text-black uppercase">{activeMission.donation.title}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-600 tracking-widest">
                             {activeMission.status === 'ASSIGNED' ? 'Objective: Pickup Food' : 'Objective: Deliver to NGO'}
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
                       <button 
                          onClick={() => {
                             if (activeMission.status === 'ASSIGNED') {
                                setVerifyingId(activeMission.id);
                             } else {
                                router.push(`/rider/mission/${activeMission.id}`);
                             }
                          }}
                          className={`w-full py-8 ${activeMission.status === 'ASSIGNED' ? 'bg-orange-600 shadow-orange-200' : 'bg-slate-950 shadow-slate-200'} text-white font-black rounded-[2.5rem] text-xl shadow-2xl hover:scale-105 transition-all active:scale-95 uppercase tracking-tighter flex items-center justify-center gap-4`}
                       >
                          {activeMission.status === 'ASSIGNED' ? 'Verify Handover' : 'Mission Brief'} <Navigation className="w-6 h-6" />
                       </button>
                       
                       <div className="flex gap-4 w-full">
                          <button 
                             onClick={() => handleStartChat(activeMission.donationId, activeMission.ngoId)}
                             className="flex-1 py-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase hover:bg-slate-950 hover:text-white transition-all text-slate-400 group/msg shadow-sm"
                          >
                             <MessageSquare className="w-4 h-4 group-hover/msg:scale-110 transition-transform" /> Msg NGO
                          </button>
                          <button 
                             onClick={() => handleStartChat(activeMission.donationId, activeMission.donation.donorId)}
                             className="flex-1 py-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase hover:bg-slate-950 hover:text-white transition-all text-slate-400 group/msg shadow-sm"
                          >
                             <MessageSquare className="w-4 h-4 group-hover/msg:scale-110 transition-transform" /> Msg Donor
                          </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="p-20 rounded-[3.5rem] bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50">
                     <Zap className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-slate-950 mb-2 italic">Scanning Sector...</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active mission detected. Check the bounty board below.</p>
               </div>
             )}
          </section>

          {/* Bounties */}
          <section className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                   <Zap className="w-4 h-4 text-orange-600" /> Regional Bounties
                </h2>
                <Badge className="bg-slate-50 text-slate-400 border border-slate-100 font-black text-[10px] uppercase tracking-widest px-3 py-1">{availableBounties.length} Available</Badge>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableBounties.map((bounty, i) => (
                  <motion.div 
                    key={bounty.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-10 rounded-[3rem] bg-white border border-slate-100 hover:border-orange-600/50 hover:shadow-2xl hover:shadow-orange-100/30 transition-all cursor-pointer group flex flex-col shadow-sm"
                    onClick={() => router.push(`/rider/mission/${bounty.id}`)}
                  >
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-orange-600 transition-all duration-500 border border-slate-100 shadow-inner shrink-0">
                           <Package className="w-8 h-8 text-slate-200 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full italic border border-orange-100">Live Cargo</span>
                     </div>
                     <h4 className="text-2xl font-black mb-1 truncate text-slate-950 italic uppercase tracking-tighter">{bounty.donation.title}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 truncate">{bounty.donation.donor.address}</p>
                     
                     <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-emerald-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-950">+150 KARMA</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                           <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </section>
      </div>

      {/* Handover PIN Modal */}
      <AnimatePresence>
         {verifyingId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white border-4 border-white/10 rounded-[4rem] p-12 max-w-md w-full shadow-2xl space-y-8 text-center">
                  <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-950/30">
                     <ShieldCheck className="w-12 h-12 text-orange-600" />
                  </div>
                  <div className="space-y-3">
                     <h2 className="text-4xl font-black tracking-tighter uppercase italic text-slate-950">Security Key</h2>
                     <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Input the 4-digit code provided by the donor.</p>
                  </div>

                  <div className="space-y-10">
                     <input 
                        type="text" 
                        maxLength={4}
                        placeholder="----"
                        autoFocus
                        className="w-full text-center text-6xl font-black tracking-[0.5em] py-12 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 focus:border-slate-950 focus:bg-white focus:outline-none transition-all placeholder:text-slate-200 uppercase italic shadow-inner"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                     />
                     <div className="flex gap-4">
                        <button onClick={() => setVerifyingId(null)} className="flex-1 py-6 bg-slate-100 text-slate-400 font-black rounded-3xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button 
                           onClick={handleHandover}
                           disabled={actionLoading || pin.length < 4}
                           className="flex-[2] py-6 bg-slate-950 text-white font-black rounded-3xl hover:bg-orange-600 transition-all shadow-2xl shadow-slate-950/20 disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-4"
                        >
                           {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                           Verify
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
      <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 ${active ? 'bg-orange-50 border-orange-600/20 shadow-xl shadow-orange-100/50' : 'bg-slate-50 border-slate-100'}`}>
         <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${active ? 'bg-orange-600 shadow-lg shadow-orange-300 animate-pulse' : 'bg-slate-200'}`} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
         </div>
         <p className="text-sm font-black text-slate-950 truncate uppercase tracking-tight">{value}</p>
      </div>
   );
}
