"use client";

import React, { useEffect, useState } from "react";
import { 
  History, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  ArrowRight,
  Loader2,
  TrendingUp,
  Search
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DonationHistory {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  donation: {
    title: string;
    pickupLocation: string;
    city: string;
    quantity: number;
    category: string;
  };
}

export default function NgoHistoryPage() {
  const [history, setHistory] = useState<DonationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/requests", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        // Filter for completed or approved requests
        const filtered = data.filter((req: any) => 
          req.status === "COMPLETED" || req.status === "APPROVED" || req.status === "IN_TRANSIT"
        );
        setHistory(filtered);
      } catch (error) {
        console.error("History fetch error:", error);
        toast.error("Unable to load mission logs.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.donation.title.toLowerCase().includes(search.toLowerCase()) ||
    item.donation.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalRescued = history.reduce((acc, curr) => acc + (curr.donation.quantity || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Mission Archive...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 sm:space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 underline decoration-orange-600/10 underline-offset-8 uppercase italic">
            Mission History
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Audit of all successful harvests and deployments.</p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
           <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 min-w-[120px] sm:min-w-[150px]">
              <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-1">Total Rescued</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 italic">{totalRescued} <span className="text-[10px] sm:text-xs uppercase italic opacity-40">kg</span></h3>
           </div>
           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 min-w-[120px] sm:min-w-[150px]">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Missions</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 italic">{history.length} <span className="text-[10px] sm:text-xs uppercase italic opacity-40">Ops</span></h3>
           </div>
        </div>
      </header>

      <section className="relative">
         <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <Search className="w-full h-full" />
         </div>
         <input 
            type="text"
            placeholder="Search mission archives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-4 sm:py-5 pl-12 pr-6 bg-white border border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-slate-200/20 font-bold text-sm outline-none focus:border-orange-200 transition-all placeholder:italic placeholder:font-bold placeholder:text-slate-300"
         />
      </section>

      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group p-5 sm:p-8 rounded-3xl sm:rounded-[3rem] bg-white border border-slate-100 hover:border-orange-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 hover:shadow-2xl hover:shadow-orange-100/30 shadow-sm"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 transition-all duration-500 group-hover:text-white shrink-0">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-base sm:text-xl italic tracking-tight text-slate-950 group-hover:text-orange-600 transition-colors uppercase truncate">{item.donation.title}</h4>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest shrink-0">{item.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-orange-600" /> {item.donation.city}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-orange-600" /> {format(new Date(item.updatedAt), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1.5"><Package className="w-3 h-3 text-orange-600" /> {item.donation.quantity} kg</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sector</p>
                  <p className="text-[11px] sm:text-xs font-black text-slate-800 uppercase">{item.donation.category.replaceAll("_", " ")}</p>
                </div>
                <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all group-hover:rotate-[360deg] duration-500">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 sm:py-40 text-center space-y-4 rounded-3xl sm:rounded-[4rem] border-2 border-dashed border-slate-100 italic">
             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <History className="w-8 h-8 sm:w-10 sm:h-10" />
             </div>
             <div className="space-y-2 px-6">
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Archive Empty</h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 max-w-xs mx-auto uppercase tracking-wide leading-relaxed">No records found in the mission logs. Start new harvests to build your legacy.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
