"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Package, 
  Loader2,
  Calendar,
  AlertTriangle,
  Heart,
  User,
  Truck,
  MessageSquare,
  Utensils,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function NgoDonationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      const res = await fetch(`/api/donations/${id}`);
      if (!res.ok) throw new Error("Item may have been claimed or expired.");
      const data = await res.json();
      setDonation(data);
    } catch (error: any) {
      toast.error(error.message);
      router.push("/ngo");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPickup = async () => {
    setRequesting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId: id, message })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mission deployment failed.");

      toast.success("Pickup Requested! Awaiting donor approval.");
      setIsModalOpen(false);
      router.push("/ngo/requests");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Scanning Supply...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex selection:bg-orange-100 italic">
      <main className="flex-grow w-full px-6 py-12 space-y-12">
        <button 
           onClick={() => router.push("/ngo")}
           className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-600 transition-colors"
        >
           <ArrowLeft className="w-4 h-4" /> Return to Command
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
           {/* Visual Assets */}
           <div className="space-y-6">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} 
                 animate={{ opacity: 1, scale: 1 }} 
                 className="aspect-square rounded-[3.5rem] bg-slate-100 border-4 border-white shadow-2xl relative overflow-hidden"
              >
                 {donation.imageUrl ? (
                    <img src={donation.imageUrl} className="w-full h-full object-cover" alt="" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl grayscale opacity-30">🍱</div>
                 )}
                 <div className="absolute top-8 left-8">
                    <Badge className="bg-white/90 backdrop-blur-md text-orange-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 shadow-xl">
                       {donation.status}
                    </Badge>
                 </div>
              </motion.div>

              <div className="p-8 rounded-[2.5rem] bg-orange-600 text-white space-y-4 shadow-2xl shadow-orange-100 border-4 border-white">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="font-black uppercase text-[10px] tracking-widest">Quality Assurance</h4>
                 </div>
                 <p className="text-xl font-black  leading-tight">This item is verified surplus and ready for distribution.</p>
              </div>
           </div>

           {/* Tactical Info */}
           <div className="space-y-8">
              <div className="space-y-4">
                 <h1 className="text-5xl font-black tracking-tight leading-none ">{donation.title}</h1>
                 <div className="flex gap-2">
                    <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none font-black text-[10px] uppercase tracking-widest">{donation.category}</Badge>
                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest">{donation.quantity} Servings</Badge>
                 </div>
              </div>

              <p className="text-lg font-bold text-slate-500 leading-relaxed">{donation.description || "No mission brief provided by donor."}</p>

              <div className="grid grid-cols-2 gap-4">
                 <InfoCard icon={<Clock />} label="Expiry" value={format(new Date(donation.expiryTime), "p, MMM dd")} />
                 <InfoCard icon={<Package />} label="Weight" value={`${donation.weight || 1} kg`} />
                 <InfoCard icon={<User />} label="Donor" value={`${donation.donor?.name || "Hub Provider"} (${donation.donor?.donorType?.replace(/_/g, " ") || "NORMAL"})`} />
                 <InfoCard icon={<MapPin />} label="Sector" value={donation.city || "Direct Sect"} />
              </div>

              <div className="p-8 rounded-[3rem] bg-slate-900 text-white space-y-6">
                 <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <h4 className="font-black uppercase text-[10px] tracking-widest ">Pickup Logistics</h4>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                       <p className="text-sm font-bold text-slate-300">{donation.pickupLocation}, {donation.city}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                       <p className="text-sm font-bold text-slate-300">Window: {format(new Date(donation.pickupStartTime), "HH:mm")} - {format(new Date(donation.pickupEndTime), "HH:mm")}</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-white hover:text-orange-600 transition-all active:scale-95 shadow-xl shadow-orange-900/50 uppercase text-xs tracking-widest flex items-center justify-center gap-3"
                 >
                    Deploy Request <Truck className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>
      </main>

      {/* Deployment Modal */}
      <AnimatePresence>
         {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl" />
                  <div className="text-center space-y-4">
                     <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl border border-slate-100">
                        <Send className="w-10 h-10 text-orange-600" />
                     </div>
                     <h2 className="text-3xl font-black  tracking-tight">Mission Brief</h2>
                     <p className="text-slate-500 font-bold text-sm">Send a message to the donor explaining your distribution plan.</p>
                  </div>

                  <div className="space-y-6">
                     <textarea 
                        className="w-full h-40 p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-orange-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 font-bold text-slate-700 resize-none"
                        placeholder="How will you distribute this food? E.g. Weekly community drive..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                     />
                     <div className="flex gap-4">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button 
                           onClick={handleRequestPickup}
                           disabled={requesting || !message.trim()} 
                           className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-slate-950 transition-all shadow-xl shadow-orange-200 disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
                        >
                           {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                           Deploy Ops
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

function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
   return (
      <div className="p-6 rounded-3xl border border-slate-100 bg-white group hover:border-orange-200 transition-all shadow-sm hover:shadow-md">
         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3 text-slate-400 group-hover:text-orange-600 transition-colors">
            {icon}
         </div>
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
         <p className="text-sm font-black text-slate-900 truncate">{value}</p>
      </div>
   );
}
