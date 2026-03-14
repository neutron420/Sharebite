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
  Bell,
  ShieldCheck,
  MapPin,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import DonationList from "@/components/ui/donation-list";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch("/api/donor/stats");
        if (!statsRes.ok) throw new Error("Failed to fetch stats");
        const statsData = await statsRes.json();
        setStats(statsData);
        if (statsData.userName) setUserName(statsData.userName);

        // Fetch all donor's donations to find active ones with PINs
        const myDonationsRes = await fetch("/api/donations");
        if (myDonationsRes.ok) {
            const data = await myDonationsRes.json();
            setRecentItems(data.slice(0, 5));
            
            // Extract "Live Ops" (Approved requests that have a PIN and aren't completed)
            const active = data.filter((d: any) => 
               d.requests?.some((r: any) => 
                  (r.status === "APPROVED" || r.status === "ON_THE_WAY" || r.status === "COLLECTED") && 
                  r.status !== "COMPLETED"
               )
            );
            setLiveOps(active);
        }

      } catch (error) {
        console.error("Dashboard load error:", error);
        toast.error("HQ connection unstable. Data may be stale.");
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
    { label: "Food Rescued", value: `${stats?.totalWeightDonated || 0} kg`, icon: <UtensilsCrossed className="w-5 h-5" />, trend: "Impact Live", colorClass: "text-orange-600 group-hover:text-white" },
    { label: "Active Shares", value: stats?.activeDonations || 0, icon: <Users className="w-5 h-5" />, trend: "Active Hub", colorClass: "text-slate-900 group-hover:text-white" },
    { label: "Karma Points", value: ((stats?.totalDonations || 0) * 150).toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, trend: "Level 01", colorClass: "text-orange-600 group-hover:text-white" },
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
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex selection:bg-orange-100 italic">
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-slate-100 bg-white z-50 flex flex-col items-center md:items-stretch py-10 px-4">
        <div className="px-2 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 italic font-black text-white text-xl">S</div>
            <span className="hidden md:block text-xl font-black tracking-tighter">DONOR HUB</span>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
           <SidebarItem icon={<LayoutDashboard />} label="Overview" active link="/donor" />
           <SidebarItem icon={<History />} label="My History" link="/donor/donations" />
           <SidebarItem icon={<Plus />} label="New Post" link="/donor/donate" />
           <SidebarItem icon={<Bell />} label="Alerts" link="/donor/notifications" />
        </nav>

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-orange-600 transition-colors font-bold text-sm"
        >
           <LogOut className="w-5 h-5" />
           <span className="hidden md:block uppercase tracking-wider">Disconnect</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-20 md:pl-64 pt-12 pb-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic underline decoration-orange-600/10 underline-offset-8">
                 Salute, {userName}! 👋
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
                  <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-orange-600">
                    <ShieldCheck className="w-8 h-8" /> Live Operations
                  </h2>
                  <Badge className="bg-orange-50 text-orange-600 border-none font-black">{liveOps.length} Active</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveOps.map((donation, i) => {
                    const approvedReq = donation.requests.find((r: any) => 
                      r.status === "APPROVED" || r.status === "ON_THE_WAY" || r.status === "COLLECTED"
                    );
                    return (
                      <motion.div 
                        key={donation.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden group shadow-2xl border border-white/10"
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
                                  <p className="text-[10px] uppercase font-black tracking-widest text-orange-400 mb-1">Handover PIN</p>
                                  <p className="text-4xl font-black tracking-[0.2em]">{approvedReq?.handoverPin || "----"}</p>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                               <Badge className="bg-orange-600 text-white border-none py-1 px-3">
                                  {approvedReq?.status}
                               </Badge>
                               <span className="text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {donation.city}
                               </span>
                            </div>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Real-time Stats */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Recent Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic tracking-tighter">Mission Inventory</h2>
                <Link href="/donor/donations" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-orange-600 transition-colors">Archive</Link>
              </div>

              <div className="h-[450px]">
                {recentItems.length > 0 ? (
                  <DonationList donations={recentItems} className="rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-orange-50/20 bg-white" />
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
                    <h3 className="text-2xl font-black italic mb-4 leading-tight tracking-tighter">Impact Level <br />Pro-Donor 04</h3>
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
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, link = "#" }: { icon: React.ReactNode, label: string, active?: boolean, link?: string }) {
  return (
    <Link 
      href={link}
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
        active ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <div className={`flex justify-center items-center [&>svg]:w-6 [&>svg]:h-6 ${active ? 'text-white' : 'text-slate-400 group-hover:text-orange-600'}`}>
        {icon}
      </div>
      <span className={`font-black text-[11px] tracking-tight uppercase hidden md:block ${active ? 'text-white' : 'group-hover:text-slate-900'}`}>{label}</span>
    </Link>
  );
}
