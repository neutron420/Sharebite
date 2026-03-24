"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Navigation,
  Loader2,
  TrendingUp,
  Zap,
  Clock,
  ChevronRight,
  Search,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  status: string;
  riderId?: string;
  donationId: string;
  ngoId: string;
  createdAt: string;
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

export default function RiderBountyBoardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      toast.error("Could not load bounties.");
    } finally {
      setLoading(false);
    }
  };

  const availableBounties = tasks.filter(t => !t.riderId && t.status === "APPROVED");
  const filteredBounties = availableBounties.filter(b => 
    b.donation.title.toLowerCase().includes(search.toLowerCase()) ||
    b.donation.donor.address.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-gray-500 text-sm">Scanning bounty board...</span>
    </div>
  );

  return (
    <div className="w-full space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-none">
             Bounty Board
          </h1>
          <p className="text-gray-500 text-sm mt-2">Available delivery targets for immediate assignment.</p>
        </motion.div>
      </header>

      {/* Search and Filters */}
      <section className="relative">
         <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
            <Search className="w-full h-full" />
         </div>
         <input 
            type="text"
            placeholder="Search regional bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-5 pl-12 pr-6 bg-white border border-gray-100 rounded-2xl shadow-sm font-medium text-sm outline-none focus:border-orange-500 transition-all"
         />
      </section>

      {/* Available Bounties */}
      <section className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
               <Zap className="w-4 h-4 text-orange-600" /> Sector Analysis
            </h2>
            <Badge variant="outline" className="text-gray-500">{filteredBounties.length} Available Targets</Badge>
         </div>

         {filteredBounties.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredBounties.map((bounty, i) => (
               <motion.div 
                 key={bounty.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="p-8 rounded-3xl bg-white border border-gray-100 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer group flex flex-col shadow-sm relative overflow-hidden"
                 onClick={() => router.push(`/rider/mission/${bounty.id}`)}
               >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                     <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors shrink-0 group-hover:text-orange-500 text-gray-300">
                        <Package className="w-7 h-7" />
                     </div>
                     <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100 text-[10px] font-bold">LIVE MISSION</Badge>
                  </div>

                  <h4 className="text-xl font-bold mb-1 truncate text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{bounty.donation.title}</h4>
                  <p className="text-xs text-gray-500 mb-8 truncate uppercase tracking-tight font-medium">{bounty.donation.donor.address}, {bounty.donation.donor.city}</p>
                  
                  <div className="mt-auto space-y-4 relative z-10">
                     <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-orange-500" /> {bounty.donation.donor.city}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-orange-500" /> {formatDistanceToNow(new Date(bounty.createdAt))} ago</span>
                     </div>

                     <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-emerald-500" />
                           <span className="text-xs font-bold text-gray-900">+150 KARMA</span>
                        </div>
                        <button className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-md group-hover:bg-orange-600 group-hover:-translate-y-1 transition-all">
                           <ArrowRight className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </motion.div>
             ))}
           </div>
         ) : (
           <div className="p-24 rounded-[2.5rem] bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <Zap className="w-12 h-12 text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bounty Grid Empty</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">No missions currently available for extraction in this sector.</p>
           </div>
         )}
      </section>
    </div>
  );
}
