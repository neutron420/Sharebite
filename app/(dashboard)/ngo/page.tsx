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
  Navigation,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";
import { useSocket } from "@/components/providers/socket-provider";

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

export default function NgoDashboard() {
  const router = useRouter();
  const { addListener } = useSocket();
  const [stats, setStats] = useState<NgoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Command Center");
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const handleStartChat = async (donationId: string, participantId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, participantId }),
      });
      
      if (res.ok) {
        const conversation = await res.json();
        router.push(`/ngo/messages?id=${conversation.id}`);
      } else {
        const error = await res.json();
        toast.error("Failed to start chat", { description: error.message });
      }
    } catch (err) {
      toast.error("Something went wrong joining the ops channel.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const statsRes = await fetch("/api/ngo/stats");
        if (statsRes.status === 403 || statsRes.status === 401) {
          router.push("/login");
          return;
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
  }, [router]);

  const statCards = [
    { label: "Food Rescued", value: `${stats?.totalWeightCollected || 0} kg`, icon: Truck, trend: "Impact Star", colorClass: "text-orange-600" },
    { label: "Active Ops", value: stats?.pendingRequests || 0, icon: Clock, trend: "Urgent Hub", colorClass: "text-slate-900" },
    { label: "Lives Impacted", value: ((stats?.completedRequests || 0) * 8).toLocaleString(), icon: Users, trend: "Daily Lives", colorClass: "text-orange-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Mission Logs...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 underline decoration-orange-600/10 underline-offset-8">
             Welcome, {userName}! 👋
          </h1>
          <p className="text-slate-400 font-bold">Deploy your logistics to rescue surplus nearby.</p>
        </motion.div>
        <Link href="/ngo/find-food" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest">
          Source New Supplies <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
      </header>

      {/* Logistics Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/20">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 transition-all duration-500 ${stat.colorClass} shadow-inner shrink-0 group-hover:text-white`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-950 tracking-tighter leading-none mb-1">{stat.value}</h3>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">{stat.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">{stat.trend}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Active Operations Pursuit Grid */}
      {stats && stats.activeRequests && stats.activeRequests.length > 0 && (
        <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-orange-600">
              <ShieldCheck className="w-8 h-8" /> Active Operations
            </h2>
            <Badge className="bg-orange-50 text-orange-600 border-none font-black">{stats.activeRequests.length} Live</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.activeRequests.map((req: any, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="flex flex-col gap-4">
                <div 
                  className="p-8 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden group shadow-2xl border border-white/10 cursor-pointer"
                  onClick={() => router.push(`/ngo/requests/${req.id}`)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl" />
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                          <Package className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg tracking-tight truncate max-w-[150px]">{req.donation.title}</h3>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Donor: {req.donation.donor.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(req.donation.id, req.donation.donorId);
                          }}
                          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-orange-600 transition-all flex items-center justify-center border border-white/20 group/msg"
                        >
                          <MessageSquare className="w-5 h-5 text-white group-hover/msg:scale-110 transition-transform" />
                        </button>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-black tracking-widest text-orange-400 mb-1">Status</p>
                          <div className="flex items-center gap-2 justify-end">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            <p className="text-xl font-black tracking-tight uppercase">{req.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrackingId(trackingId === req.id ? null : req.id);
                      }}
                      className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                    >
                      {trackingId === req.id ? 'Close Pursuit Grid' : 'Open Pursuit Grid'} <Navigation className="w-4 h-4" />
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
                      <div className="absolute bottom-4 left-6 z-10">
                        <Badge className="bg-black/80 text-white backdrop-blur-md border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Live Pursuit Grid</Badge>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4 border-l-4 border-slate-950">
            <div>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-950">Supply Audit Feed</h2>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available surplus sources in your sector</p>
            </div>
            <Link href="/ngo/find-food" className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-all shadow-sm">Global Hub &rarr;</Link>
          </div>
          
          <div className="space-y-4">
            {stats && stats.availableDonations.length > 0 ? (
              stats.availableDonations.map((item, i) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 flex items-center justify-between transition-all cursor-pointer hover:shadow-xl hover:shadow-orange-50/50 shadow-sm"
                  onClick={() => router.push(`/ngo/donations/${item.id}`)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 group-hover:bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all border border-slate-100 group-hover:border-orange-100 relative overflow-hidden shrink-0">
                       {item.imageUrl ? (
                          <img src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                       ) : (
                          <Soup className="w-6 h-6 text-slate-400 group-hover:text-orange-600" />
                       )}
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight group-hover:text-orange-600 transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        <MapPin className="w-3 h-3" /> {item.city} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {formatDistanceToNow(new Date(item.createdAt))} ago
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                       <p className="text-xs font-black text-slate-900">{item.donor?.name || "Shared Hub"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all border border-transparent group-hover:border-orange-100">
                       <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
                 <Link href="/ngo/find-food" className="mt-6 px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-orange-100 italic">
                    Explore Global Hub
                 </Link>
              </div>
            )}
          </div>
        </div>

        {/* NGO Sidebar Cards */}
        <div className="space-y-6">
          <div className="p-8 rounded-[3rem] border border-slate-100 bg-white relative overflow-hidden shadow-xl shadow-orange-50/30">
             <div className="absolute top-0 right-0 h-32 w-32 bg-orange-100/70 blur-3xl" />
             <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 text-orange-600">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black italic mb-4 tracking-tighter text-slate-950 leading-tight">Verified <br />Distributor Hub</h3>
                <p className="text-slate-500 text-[10px] font-bold mb-10 uppercase tracking-[0.2em] leading-relaxed">Your certificate is active. Keep operations fluid to maintain high trust ranking.</p>
                <button className="w-full inline-flex items-center justify-center gap-3 py-5 bg-slate-950 text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 uppercase text-[10px] tracking-widest">
                  View Credentials <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="p-8 rounded-[3rem] border border-slate-100 bg-white flex flex-col items-center text-center group hover:border-orange-200 transition-all shadow-xl shadow-slate-200/10">
             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6 text-slate-400 group-hover:text-orange-600" /></div>
             <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Growth Projection</h4>
             <p className="text-xs font-bold text-slate-400">Partner with more donors to increase your operations hub capacity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
