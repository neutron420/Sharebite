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
import { Wallet, Trophy, Coins, CreditCard } from "lucide-react";
import { TimesheetConfirmation } from "@/components/timesheet-confirmation";
import { RIDER_PAYOUT_AMOUNT_INR } from "@/lib/payout";

interface Task {
  id: string;
  status: string;
  step?: number;
  riderId?: string;
  donationId: string;
  ngoId: string;
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

export default function RiderDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ balance: 0, totalEarnings: 0, rewardPoints: 0, completedMissions: 0 });
  const [isDeliveryVerify, setIsDeliveryVerify] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedMissionData, setCompletedMissionData] = useState<any>(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/rider/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {}
  };

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

      if (isDeliveryVerify) {
        const activeReq = tasks.find(t => t.id === verifyingId);
        if (activeReq) {
          setCompletedMissionData({
            clientName: activeReq.ngo.name,
            taskName: activeReq.donation.title,
            timeEntries: [
              { date: "Pickup Verified", duration: "Step 1 ✓" },
              { date: "Delivery Verified", duration: "Step 2 ✓" }
            ],
            financials: [
              { label: "Base Payout", value: RIDER_PAYOUT_AMOUNT_INR }
            ],
            totalHours: "10 Karma Pts",
            takeHomeAmount: RIDER_PAYOUT_AMOUNT_INR
          });
          setShowSuccessModal(true);
        }
      }

      toast.success(isDeliveryVerify ? "NGO takeover verified. Awaiting payout release." : "Donor pickup verified. Move to NGO location.");
      setVerifyingId(null);
      setPin("");
      fetchTasks();
      fetchStats();
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

  const activeMission = tasks.find(
    (t) => t.riderId && (t.status === "ASSIGNED" || t.status === "ON_THE_WAY" || isPayoutPendingMission(t))
  );
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

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 gap-3 sm:gap-4 w-full md:w-auto">
           <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                 <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earnings</p>
                 <p className="text-base sm:text-xl font-black text-gray-950 tracking-tighter truncate">₹{stats.balance.toFixed(2)}</p>
              </div>
           </div>
           <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl flex items-center gap-3 sm:gap-4 text-white">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0">
                 <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rewards</p>
                 <p className="text-base sm:text-xl font-black text-white tracking-tighter truncate">{stats.rewardPoints} Pts</p>
              </div>
           </div>
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
                      {(() => {
                        const step = activeMission.step || 0;
                        const isPaymentTake = activeMission.status === "COMPLETED" && step >= 3.4 && step < 3.5;
                        const isWaitingPayout = activeMission.status === "COMPLETED" && step >= 3.5 && step < 4;
                        const badgeLabel = isPaymentTake
                          ? "PAYMENT TAKE"
                          : isWaitingPayout
                            ? "PAYOUT PENDING"
                            : activeMission.status;
                        return (
                          <Badge className="bg-orange-500 text-white border-none py-1">
                            {badgeLabel}
                          </Badge>
                        );
                      })()}
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{activeMission.donation.title}</h3>
                      <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                         {(() => {
                            const step = activeMission.step || 0;
                            if (activeMission.status === "ASSIGNED") return "Objective: Pickup Food";
                            if (activeMission.status === "ON_THE_WAY") return "Objective: Deliver to NGO";
                            if (activeMission.status === "COMPLETED" && step >= 3.4 && step < 3.5) return "Objective: Take Payment (Send NGO PIN)";
                            if (activeMission.status === "COMPLETED" && step >= 3.5 && step < 4) return "Objective: Waiting For NGO Payout";
                            return "Objective: Mission Finalized";
                         })()}
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
                    {activeMission.status === "COMPLETED" && (activeMission.step || 0) < 3.5 ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          <button 
                             onClick={() => handleSendOtp(activeMission.id)}
                             disabled={actionLoading}
                             className="py-4 bg-white border-2 border-orange-600 text-orange-600 font-bold rounded-2xl text-xs hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                          >
                             <Zap className="w-4 h-4" /> Take Payment (Send PIN)
                          </button>
                          <button 
                             onClick={() => {
                                setIsDeliveryVerify(true);
                                setVerifyingId(activeMission.id);
                             }}
                             className="py-4 bg-orange-600 text-white font-bold rounded-2xl text-xs hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                          >
                             <ShieldCheck className="w-4 h-4" /> Verify NGO PIN
                          </button>
                       </div>
                    ) : activeMission.status === "COMPLETED" && (activeMission.step || 0) >= 3.5 && (activeMission.step || 0) < 4 ? (
                       <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest text-center">
                          NGO PIN verified. Waiting for NGO to release payout.
                       </div>
                    ) : (
                       <button 
                          onClick={() => {
                             if (activeMission.status === 'ASSIGNED') {
                                setIsDeliveryVerify(false);
                                setVerifyingId(activeMission.id);
                             } else {
                                router.push(`/rider/mission/${activeMission.id}`);
                             }
                          }}
                          className="w-full py-6 bg-orange-600 text-white font-bold rounded-2xl text-lg hover:bg-orange-700 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
                       >
                          {activeMission.status === 'ASSIGNED' ? 'Verify Handover' : 'Briefing Details'} <Navigation className="w-5 h-5" />
                       </button>
                    )}
                   
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

      <TimesheetConfirmation 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        clientName={completedMissionData?.clientName || ""}
        taskName={completedMissionData?.taskName || ""}
        timeEntries={completedMissionData?.timeEntries || []}
        financials={completedMissionData?.financials || []}
        totalHours={completedMissionData?.totalHours || ""}
        takeHomeAmount={completedMissionData?.takeHomeAmount || 0}
      />
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
