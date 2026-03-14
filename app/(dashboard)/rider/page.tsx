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

export default function RiderDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
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
      if (!res.ok) throw new Error("Ops grid offline.");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Could not load mission grid.");
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

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      router.push("/login");
    }
  };

  const activeMission = tasks.find(t => t.riderId && (t.status === "ASSIGNED" || t.status === "ON_THE_WAY"));
  const availableBounties = tasks.filter(t => !t.riderId && t.status === "APPROVED");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Zap className="w-12 h-12 text-orange-500 animate-pulse" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em] text-orange-500/50 animate-pulse">Initializing Tactical Grid...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex selection:bg-orange-600/30 italic">
      
      {/* Sidebar - Dark Tactical */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 flex flex-col items-center md:items-stretch py-10 px-4">
        <div className="px-2 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-950/50 italic font-black text-white text-xl">R</div>
            <span className="hidden md:block text-xl font-black tracking-tighter uppercase whitespace-nowrap">Rider Stealth</span>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
           <SidebarItem icon={<LayoutDashboard />} label="Ops Grid" active />
           <SidebarItem icon={<Truck />} label="Active Missions" />
           <SidebarItem icon={<Zap />} label="Bounties" />
           <SidebarItem icon={<Bell />} label="Comms" />
        </nav>

        <button onClick={handleSignOut} className="flex items-center gap-4 px-4 py-4 text-white/40 hover:text-orange-500 transition-colors font-black text-xs uppercase tracking-widest">
           <LogOut className="w-5 h-5" />
           <span className="hidden md:block">Abort Session</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-20 md:pl-64 pt-12 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/80">System Online / Location Active</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 uppercase">
                 Mission Update
              </h1>
              <p className="text-white/40 font-bold italic">Secure logistics & humanitarian response protocol.</p>
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
                 className="bg-zinc-900/50 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl"
               >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px]" />
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <Badge className="bg-orange-600 text-white border-none font-black text-[10px] px-3 py-1">
                             {activeMission.status}
                          </Badge>
                          <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-none truncate">{activeMission.donation.title}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-white/40 italic">
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
                          <button className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                             <Phone className="w-4 h-4" /> Contact NGO
                          </button>
                          <button className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                             <Phone className="w-4 h-4" /> Contact Donor
                          </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="p-20 rounded-[3.5rem] bg-zinc-900/20 border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center opacity-30">
                  <Zap className="w-12 h-12 mb-4" />
                  <h3 className="text-xl font-black uppercase tracking-widest">No Active Mission</h3>
                  <p className="text-xs font-bold mt-2">Check available bounties in your sector.</p>
               </div>
             )}
          </section>

          {/* Available Bounties */}
          <section className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-3">
                   <Zap className="w-4 h-4 text-orange-500" /> Regional Bounties
                </h2>
                <Badge className="bg-white/5 text-white/40 border-none font-black text-[9px] uppercase tracking-widest">{availableBounties.length} Available</Badge>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableBounties.map((bounty, i) => (
                  <motion.div 
                    key={bounty.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 hover:border-orange-500/50 transition-all cursor-pointer group"
                    onClick={() => router.push(`/rider/mission/${bounty.id}`)}
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                           <Package className="w-6 h-6 text-white/40 group-hover:text-white" />
                        </div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full italic">Priority</span>
                     </div>
                     <h4 className="text-xl font-black mb-1 truncate">{bounty.donation.title}</h4>
                     <p className="text-xs font-bold text-white/30 italic mb-6 truncate">{bounty.donation.donor.address}</p>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-green-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest">+50 Karma</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                     </div>
                  </motion.div>
                ))}
             </div>
          </section>
        </div>
      </main>

      {/* Handover PIN Modal */}
      <AnimatePresence>
         {verifyingId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-white/10 rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 text-center italic">
                  <div className="w-24 h-24 bg-orange-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-950 animate-pulse">
                     <ShieldCheck className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black tracking-tight uppercase">Enter Handover PIN</h2>
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
                        <button onClick={() => setVerifyingId(null)} className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-2xl hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button 
                           onClick={handleHandover}
                           disabled={actionLoading || pin.length < 4}
                           className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-500 transition-all shadow-xl shadow-orange-900 disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
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
    </div>
  );
}

function SidebarItem({ icon, label, active = false, link = "#" }: { icon: React.ReactNode, label: string, active?: boolean, link?: string }) {
  return (
    <Link 
      href={link}
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
        active ? 'bg-orange-600 text-white shadow-2xl shadow-orange-950' : 'text-white/30 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`flex justify-center items-center [&>svg]:w-5 [&>svg]:h-5 ${active ? 'text-white' : 'text-white/30 group-hover:text-orange-500'}`}>
        {icon}
      </div>
      <span className={`font-black text-[11px] tracking-[0.1em] uppercase hidden md:block ${active ? 'text-white' : 'group-hover:text-white'}`}>{label}</span>
    </Link>
  );
}

function MissionWayPoint({ label, value, active = false }: { label: string, value: string, active?: boolean }) {
   return (
      <div className={`p-6 rounded-3xl border transition-all ${active ? 'bg-orange-600/5 border-orange-600/30' : 'bg-white/5 border-white/5 opacity-50'}`}>
         <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-white/20'}`} />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
         </div>
         <p className="text-sm font-bold text-white/90 truncate">{value}</p>
      </div>
   );
}
