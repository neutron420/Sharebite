"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  History, 
  TrendingUp, 
  UtensilsCrossed, 
  Users, 
  Award,
  ArrowRight,
  Clock,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Bell,
  ShieldCheck,
  MapPin,
  Truck,
  Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import DonationList from "@/components/ui/donation-list";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DonorStats {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  totalWeightDonated: number;
}

/**
 * ShareBite Donor Hub - Operations Edition
 * Real-time Backend Integration with Live OTP/PIN tracking
 */
export default function DonorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [liveOps, setLiveOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Hero");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch("/api/donor/stats");
        console.log("[DONOR DASHBOARD] Stats response:", statsRes.status);
        
        if (statsRes.status === 401) {
            toast.error("Session expired. Redirecting to login...");
            setTimeout(() => router.push("/login"), 1500);
            return;
        }
        
        if (statsRes.status === 403) {
            const errData = await statsRes.json();
            console.error("[DONOR DASHBOARD] Access denied:", errData);
            toast.error("Access denied. Please log in as a donor.");
            setTimeout(() => router.push("/login"), 2000);
            return;
        }
        
        if (!statsRes.ok) {
          const errText = await statsRes.text();
          console.error("[DONOR DASHBOARD] Stats fetch failed:", statsRes.status, errText);
          toast.error("Stats service is temporarily unavailable. Please retry.");
          return;
        }
        const statsData = await statsRes.json();
        setStats(statsData);
        if (statsData.userName) setUserName(statsData.userName);

        // Fetch all donor's donations to find active ones with PINs
        const myDonationsRes = await fetch("/api/donations");
        if (myDonationsRes.ok) {
            const data = await myDonationsRes.json();
            setRecentItems(data);
            
            // Extract "Live Ops" (Approved requests that have a PIN and aren't completed)
            const active = data.filter((d: any) => 
               d.requests?.some((r: any) => 
                  (r.status === "APPROVED" || r.status === "ON_THE_WAY" || r.status === "COLLECTED") && 
                  r.status !== "COMPLETED"
               )
            );
            setLiveOps(active);
        }

      } catch (error: any) {
        console.error("Dashboard load error:", error);
        if (error.message?.includes("Session expired")) {
          // Already handled with redirect
        } else {
          toast.error("Failed to load dashboard. Please log out and log back in.");
        }
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
    } catch (e) {
      router.push("/login");
    }
  };

  const statCards = [
    { label: "Food Rescued", value: `${stats?.totalWeightDonated || 0} kg`, icon: UtensilsCrossed, trend: "Impact Live", colorClass: "text-orange-600 group-hover:text-white" },
    { label: "Active Shares", value: stats?.activeDonations || 0, icon: Users, trend: "Active Hub", colorClass: "text-slate-900 group-hover:text-white" },
    { label: "Karma Points", value: ((stats?.totalDonations || 0) * 150).toLocaleString(), icon: TrendingUp, trend: "Level 01", colorClass: "text-orange-600 group-hover:text-white" },
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
    <div className="max-w-6xl mx-auto space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                 Salute, {userName}!
              </h1>
              <p className="text-slate-400 font-bold">Your donations have impacted hundreds of lives today.</p>
            </motion.div>
            <Link href="/donor/donate" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest">
              Share Surplus <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </Link>
          </header>

          {/* Live Operations / OTP Section */}
          <AnimatePresence>
            {liveOps.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                className="space-y-6 overflow-hidden"
              >
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black  tracking-tighter flex items-center gap-3 text-orange-600">
                    <ShieldCheck className="w-8 h-8" /> Live Operations
                  </h2>
                  <Badge className="bg-orange-50 text-orange-600 border-none font-black">{liveOps.length} Active</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveOps.map((donation, i) => {
                    const approvedReq = donation.requests?.find((r: any) => 
                      r.status === "APPROVED" || r.status === "ASSIGNED" || r.status === "ON_THE_WAY" || r.status === "COLLECTED"
                    );
                    const isTracking = approvedReq && approvedReq.riderId && (approvedReq.status === "ASSIGNED" || approvedReq.status === "ON_THE_WAY");

                    return (
                      <motion.div 
                        key={donation.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col gap-4"
                      >
                        <div 
                          className="p-8 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden group shadow-2xl border border-white/10 cursor-pointer"
                          onClick={() => router.push(`/donor/donations/${donation.id}`)}
                        >
                           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl" />
                           <div className="relative z-10 flex flex-col gap-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                       <Truck className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                       <h3 className="font-black text-lg tracking-tight leading-none truncate max-w-[150px]">{donation.title}</h3>
                                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">{approvedReq?.ngo?.name || "Verified NGO"}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-orange-400 mb-1">Status</p>
                                    <div className="flex items-center gap-2 justify-end">
                                       <ShieldCheck className="w-4 h-4 text-green-500" />
                                       <p className="text-xl font-black tracking-tight uppercase">
                                          {approvedReq?.status === 'ON_THE_WAY' ? 'En Route' : 'Assigned'}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                                 <Badge className="bg-orange-600 text-white border-none py-1 px-3">
                                    {approvedReq?.status}
                                 </Badge>
                                 <span className="text-slate-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {donation.city}
                                 </span>
                                 <span className="text-orange-400 animate-pulse ml-auto flex items-center gap-2">
                                    <Navigation className="w-3 h-3" /> Click for details & PIN
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Direct Map Preview if tracking is active */}
                        {isTracking && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="h-[250px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg relative bg-slate-50"
                          >
                             <LiveRiderMap 
                                riderId={approvedReq.riderId}
                                riderName={approvedReq.rider?.name || "Rider"}
                                donorCoords={[donation.donor.longitude, donation.donor.latitude]}
                                ngoCoords={[approvedReq.ngo.longitude, approvedReq.ngo.latitude]}
                                status={approvedReq.status}
                             />
                             <div className="absolute bottom-4 left-6 z-10">
                                <Badge className="bg-black/80 text-white backdrop-blur-md border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                                   Live Pursuit Grid
                                </Badge>
                             </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Real-time Stats Report Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/20"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 transition-all duration-500 ${stat.colorClass} shadow-inner shrink-0`}>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Recent Items / Mission Inventory Report */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between px-4 border-l-4 border-slate-950">
                <div>
                   <h2 className="text-3xl font-black  tracking-tighter uppercase text-slate-950">Mission Audit Feed</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprehensive logs of all sharing operations</p>
                </div>
                <Link href="/donor/donations" className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-all shadow-sm">Full Archive &rarr;</Link>
              </div>

              <div className="space-y-4">
                {recentItems.length > 0 ? (
                  <>
                    <DonationList donations={recentItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)} className="rounded-[2.5rem] border border-slate-100 shadow-xl shadow-orange-50/20 bg-white" />
                    
                    {recentItems.length > itemsPerPage && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.ceil(recentItems.length / itemsPerPage) }).map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                                isActive={currentPage === i + 1}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(recentItems.length / itemsPerPage)) setCurrentPage(currentPage + 1); }}
                              className={currentPage === Math.ceil(recentItems.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                ) : (
                  <div className="p-20 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <Plus className="w-8 h-8" />
                     </div>
                     <h4 className="font-black text-lg">No active shipments</h4>
                     <p className="text-slate-400 text-sm font-bold mt-1 max-w-[240px]">You haven&apos;t shared any surplus recently. Start your first mission today.</p>
                     <Link href="/donor/donate" className="mt-6 px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-orange-100">
                        Post Donation
                     </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              <div className="p-8 rounded-[3.5rem] bg-orange-600 text-white relative overflow-hidden group shadow-2xl shadow-orange-100 border-4 border-white">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                 <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                       <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black  mb-4 leading-tight tracking-tighter">Impact Level <br />Pro-Donor 04</h3>
                    <p className="text-orange-50/80 text-[10px] font-bold mb-10 leading-relaxed uppercase tracking-[0.2em]">Unlock premium donor certificates by reaching 100kg impact milestone.</p>
                    <button className="w-full py-5 bg-white text-orange-600 font-black rounded-2xl hover:bg-slate-950 hover:text-white transition-all active:scale-95 shadow-xl shadow-orange-800/10 uppercase text-[10px] tracking-widest">
                       Verify Ranks
                    </button>
                 </div>
              </div>

              <div className="p-8 rounded-[3rem] border border-slate-100 bg-white flex flex-col items-center text-center group hover:border-orange-200 transition-all">
                 <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                    <Calendar className="w-6 h-6 text-slate-400 group-hover:text-orange-600" />
                 </div>
                 <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Recurring Logistics</h4>
                 <p className="text-xs font-bold text-slate-400 leading-relaxed">Schedule your weekly surplus pickups to automate your impact.</p>
                 <button className="mt-6 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-slate-950 transition-colors">Setup Schedule &rarr;</button>
              </div>
            </div>
          </div>
    </div>
  );
}


