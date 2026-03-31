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
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  status: string;
  step?: number;
  riderId?: string;
  donationId: string;
  ngoId: string;
  updatedAt: string;
  payment?: {
    status: string;
  };
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

export default function RiderMissionsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeliveryVerify, setIsDeliveryVerify] = useState(false);

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
    } catch (error: any) {
      toast.error("Could not load missions.");
    } finally {
      setLoading(false);
    }
  };

  const handleHandover = async () => {
    if (!verifyingId || pin.length < 4) {
      toast.error(isDeliveryVerify ? "Enter the 4-digit NGO release PIN" : "Enter the 4-digit donor pickup PIN");
      return;
    }
    setActionLoading(true);
    try {
      const endpoint = isDeliveryVerify 
        ? `/api/requests/${verifyingId}/rider-verify`
        : `/api/requests/${verifyingId}/handover`;
      
      const method = isDeliveryVerify ? "POST" : "PATCH";
      const payload = isDeliveryVerify ? { otp: pin } : { pin };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed.");

      toast.success(isDeliveryVerify ? "NGO takeover verified. Awaiting payout release." : "Donor pickup verified. Move to NGO location.");
      setVerifyingId(null);
      setPin("");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOtp = async (requestId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/send-otp`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      toast.success("NGO release PIN sent to the NGO email.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isPayoutPendingMission = (task: Task) =>
    task.status === "COMPLETED" &&
    (task.step || 0) >= 3.4 &&
    (task.step || 0) < 4 &&
    task.payment?.status !== "SUCCESS";

  const myActiveMissions = tasks.filter(
    (t) => t.riderId && (t.status === "ASSIGNED" || t.status === "ON_THE_WAY" || isPayoutPendingMission(t))
  );
  const myCompletedMissions = tasks.filter(
    (t) => t.riderId && t.status === "COMPLETED" && (t.step || 0) >= 4
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-gray-500 text-sm">Loading missions...</span>
    </div>
  );

  return (
    <div className="w-full space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-none">
             My Missions
          </h1>
          <p className="text-gray-500 text-sm mt-2">Log of your active deployments and historical deliveries.</p>
        </motion.div>
      </header>

      {/* Active High-Priority Missions */}
      <section className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
               <Navigation className="w-4 h-4" /> Active Directives
            </h2>
            <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100">{myActiveMissions.length} Deployment{myActiveMissions.length !== 1 ? 's' : ''}</Badge>
         </div>

         {myActiveMissions.length > 0 ? (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
             {myActiveMissions.map((task) => (
               <motion.div 
                 key={task.id} 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
                 
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-2">
                          {(() => {
                            const step = task.step || 0;
                            const isPaymentTake = task.status === "COMPLETED" && step >= 3.4 && step < 3.5;
                            const isWaitingPayout = task.status === "COMPLETED" && step >= 3.5 && step < 4;
                            const badgeLabel = isPaymentTake
                              ? "PAYMENT TAKE"
                              : isWaitingPayout
                                ? "PAYOUT PENDING"
                                : task.status;
                            return (
                              <Badge className="bg-gray-900 text-white border-none py-1">
                                {badgeLabel}
                              </Badge>
                            );
                          })()}
                          <h3 className="text-2xl font-bold text-gray-900">{task.donation.title}</h3>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                          <Truck className="w-6 h-6" />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                       <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-all group-hover:bg-white group-hover:border-orange-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Extraction Site</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{task.donation.donor.address}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-all group-hover:bg-white group-hover:border-orange-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Rendezvous Point</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{task.ngo.name}</p>
                       </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                       {task.status === "COMPLETED" && (task.step || 0) < 3.5 ? (
                          <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={() => handleSendOtp(task.id)}
                                disabled={actionLoading}
                                className="py-4 bg-white border-2 border-orange-600 text-orange-600 font-bold rounded-2xl text-xs hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                             >
                                <Zap className="w-4 h-4" /> Take Payment (Send PIN)
                             </button>
                             <button 
                                onClick={() => {
                                   setIsDeliveryVerify(true);
                                   setVerifyingId(task.id);
                                }}
                                className="py-4 bg-orange-600 text-white font-bold rounded-2xl text-xs hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                             >
                                <ShieldCheck className="w-4 h-4" /> Verify NGO PIN
                             </button>
                          </div>
                       ) : task.status === "COMPLETED" && (task.step || 0) >= 3.5 && (task.step || 0) < 4 ? (
                          <div className="w-full py-4 px-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-widest text-center">
                             NGO PIN verified. Waiting for payout release.
                          </div>
                       ) : (
                          <button 
                             onClick={() => {
                                if (task.status === 'ASSIGNED') {
                                   setIsDeliveryVerify(false);
                                   setVerifyingId(task.id);
                                } else {
                                   router.push(`/rider/mission/${task.id}`);
                                }
                             }}
                             className={`flex-1 py-4 font-bold rounded-2xl text-sm transition-all active:scale-95 flex items-center justify-center gap-3 ${task.status === 'ASSIGNED' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-900 text-white shadow-lg shadow-gray-900/10'}`}
                          >
                             {task.status === 'ASSIGNED' ? 'Verify Handover' : 'Briefing Details'} <ArrowRight className="w-4 h-4" />
                          </button>
                       )}
                    </div>
                 </div>
               </motion.div>
             ))}
           </div>
         ) : (
           <div className="p-16 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
              <Zap className="w-10 h-10 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Directives</h3>
              <p className="text-xs text-gray-500">Pick up new missions from the Bounty Board to see them here.</p>
           </div>
         )}
      </section>

      {/* Completed Mission Logs */}
      <section className="space-y-4">
         <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Historical Logs
         </h2>

         <div className="space-y-3">
            {myCompletedMissions.length > 0 ? (
               myCompletedMissions.map((mission, i) => (
                  <motion.div 
                     key={mission.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className="group p-5 rounded-3xl bg-white border border-gray-100 hover:border-orange-200 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-lg hover:shadow-orange-500/5 shadow-sm"
                  >
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shrink-0">
                           <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-lg text-gray-900">{mission.donation.title}</h4>
                              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 text-[10px] font-bold">COMPLETED</Badge>
                           </div>
                           <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-orange-500" /> {format(new Date(mission.updatedAt), "PPP")}</span>
                              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-orange-500" /> {mission.ngo.city}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                        <div className="text-right">
                           <p className="text-xs font-bold text-emerald-500">+150 KARMA</p>
                           <p className="text-[10px] text-gray-300 uppercase">SUCCESSFUL MISSION</p>
                        </div>
                        <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-all">
                           <ChevronRight className="w-5 h-5" />
                        </button>
                     </div>
                  </motion.div>
               ))
            ) : (
               <div className="p-16 text-center space-y-3 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-1">
                     <Clock className="w-7 h-7 text-gray-200" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Archive Empty</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">No mission records found in the historical logs yet.</p>
               </div>
            )}
         </div>
      </section>

      {/* Pickup / NGO PIN Modal */}
      <AnimatePresence>
         {verifyingId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl space-y-6 text-center">
                  <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                     <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                    <div className="space-y-2">
                       <h2 className="text-2xl font-bold text-gray-900">{isDeliveryVerify ? "NGO Release PIN" : "Donor Pickup PIN"}</h2>
                       <p className="text-gray-500 text-xs px-4">
                          {isDeliveryVerify 
                             ? "Enter the 4-digit PIN shared by the NGO coordinator." 
                             : "Enter the 4-digit pickup PIN provided by the donor."}
                       </p>
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
                             {isDeliveryVerify ? "Verify NGO PIN" : "Verify Pickup"}
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
