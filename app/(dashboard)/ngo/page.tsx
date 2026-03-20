"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  History, 
  TrendingUp, 
  Truck, 
  Users, 
  Award,
  ArrowRight,
  Clock,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Loader2,
  MapPin,
  Heart,
  Soup,
  Plus,
  Bell,
  Package,
  ShieldCheck,
  Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";

interface Activity {
  id: string;
  status: string;
  donation: {
    title: string;
    donor: { name: string; latitude: number; longitude: number };
  };
  ngo: { latitude: number; longitude: number };
  riderId: string;
  rider?: { name: string };
}

interface NgoStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  completedRequests: number;
  totalWeightCollected: number;
  availableDonations: any[];
  activeRequests: any[];
}

/**
 * ShareBite NGO Operations Command - Premium Edition
 * Real-time Backend Integration
 */
export default function NgoDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<NgoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Command Center");
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const statsRes = await fetch("/api/ngo/stats");
        if (statsRes.status === 403) {
          const errData = await statsRes.json();
          throw new Error(errData.error || "Access Denied. NGO only.");
        }
        if (!statsRes.ok) throw new Error("Failed to fetch NGO ops data");
        const statsData = await statsRes.json();
        setStats(statsData);
        if (statsData.userName) setUserName(statsData.userName);
      } catch (error: any) {
        console.error("NGO dashboard load error:", error);
        toast.error(error.message || "Ops center offline. Retrying...");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      toast.success("Disconnected from HQ");
    } catch (e) {
      router.push("/login");
    }
  };

  const statCards = [
    { label: "Food Collected", value: `${stats?.totalWeightCollected || 0} kg`, icon: <Truck className="w-5 h-5" />, trend: "Impact Star", colorClass: "text-orange-600 group-hover:text-white" },
    { label: "Active Requests", value: stats?.pendingRequests || 0, icon: <Clock className="w-5 h-5" />, trend: "Urgent Ops", colorClass: "text-slate-900 group-hover:text-white" },
    { label: "Feed Count", value: ((stats?.completedRequests || 0) * 8).toLocaleString(), icon: <Users className="w-5 h-5" />, trend: "Daily Lives", colorClass: "text-orange-600 group-hover:text-white" },
  ];

  if (loading) return null; // Let layout handle loading placeholder or just show empty content briefly

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2  underline decoration-orange-600/10 underline-offset-8 transition-all hover:decoration-orange-500/20 cursor-default">
             {userName} 👋
          </h1>
          <p className="text-slate-400 font-bold">Deploy your logistics to rescue surplus nearby.</p>
        </motion.div>
        <Link href="/donations" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest">
          Source New Supplies <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
      </header>

      {/* Logistics Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-orange-50"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-8">
              <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 transition-colors duration-500 ${stat.colorClass} shadow-inner`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-1 uppercase tracking-widest leading-none">{stat.label}</p>
            <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </section>

      {/* Active Operations Pursuit Grid */}
      {stats && stats.activeRequests && stats.activeRequests.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black  tracking-tighter flex items-center gap-3 text-orange-600">
              <ShieldCheck className="w-8 h-8" /> Active Operations
            </h2>
            <Badge className="bg-orange-50 text-orange-600 border-none font-black">{stats.activeRequests.length} Live</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.activeRequests.map((req: any) => (
              <div key={req.id} className="flex flex-col gap-4">
                <div className="p-8 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden group shadow-2xl border border-white/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl" />
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                          <Package className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg tracking-tight truncate max-w-[150px]">{req.donation.title}</h4>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">From: {req.donation.donor.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <Badge className="bg-orange-600 border-none text-[10px] font-black">{req.status}</Badge>
                         <p className="text-[10px] font-black uppercase text-slate-500 mt-1">{req.rider?.name || 'Rider Assigned'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setTrackingId(trackingId === req.id ? null : req.id)}
                      className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                    >
                      {trackingId === req.id ? 'Close Pursuit' : 'Live Pursuit'} <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {trackingId === req.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 300 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg bg-slate-50 relative"
                    >
                      <LiveRiderMap 
                        riderId={req.riderId}
                        riderName={req.rider?.name || "Rider"}
                        donorCoords={[req.donation.donor.longitude, req.donation.donor.latitude]}
                        ngoCoords={[req.ngo.longitude, req.ngo.latitude]}
                        status={req.status}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Nearby Supplies Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black  tracking-tighter">Available Supplies Nearby</h2>
            <Link href="/donations" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-orange-600 transition-colors">Global Search</Link>
          </div>

          <div className="space-y-4">
            {stats && stats.availableDonations.length > 0 ? (
              stats.availableDonations.map((item, i) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-orange-200/50 flex items-center justify-between transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-50/50"
                  onClick={() => router.push(`/ngo/donations/${item.id}`)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-50 group-hover:bg-orange-50 rounded-3xl flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all border border-slate-50 group-hover:border-orange-100 relative overflow-hidden">
                       {item.imageUrl ? (
                          <img src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                       ) : (
                          <span className="group-hover:scale-110 transition-transform">🥪</span>
                       )}
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {item.city} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {formatDistanceToNow(new Date(item.createdAt))} ago
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Donor</p>
                       <p className="text-xs font-black text-slate-900">{item.donor?.name || "Shared Hub"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                       <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-20 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Soup className="w-8 h-8" />
                 </div>
                 <h4 className="font-black text-lg text-slate-900">No active surplus found</h4>
                 <p className="text-slate-400 text-sm font-bold mt-1 max-w-[240px]">We couldn&apos;t find any active donations in your sector. Expand your search radius.</p>
                 <Link href="/donations" className="mt-6 px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-orange-100 ">
                    Explore Large Hub hubs
                 </Link>
              </div>
            )}
          </div>
        </div>

        {/* NGO Sidebar Cards */}
        <div className="space-y-6">
          <div className="p-8 rounded-[3.5rem] bg-orange-600 text-white relative overflow-hidden group shadow-2xl shadow-orange-100 border-4 border-white">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                   <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black  mb-4 leading-tight tracking-tighter">Verified Distributer <br />Status Active</h3>
                <p className="text-orange-50/80 text-[10px] font-bold mb-10 leading-relaxed uppercase tracking-[0.2em]">Your certificate expires in 120 days. Keep operations active to auto-renew.</p>
                <button className="w-full py-5 bg-white text-orange-600 font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-xl shadow-orange-800/10 uppercase text-[10px] tracking-widest">
                   Download Identity
                </button>
             </div>
          </div>

          <div className="p-8 rounded-[3rem] border border-slate-100 bg-white flex flex-col items-center text-center group hover:border-orange-200 transition-all">
             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                <TrendingUp className="w-6 h-6 text-slate-400 group-hover:text-orange-600" />
             </div>
             <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Growth Projection</h4>
             <p className="text-xs font-bold text-slate-400 leading-relaxed">Partner with 3 more donors to increase your operations hub capacity.</p>
             <button className="mt-6 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-slate-950 transition-colors">Unlock Benefits &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
