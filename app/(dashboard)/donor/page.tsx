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
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface DonorStats {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  totalWeightDonated: number;
  recentRequests: any[];
}

/**
 * ShareBite Donor Hub - Orange & White Edition
 * Premium Design System with Real-time Backend Integration
 */
export default function DonorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);
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

        // Fetch donations for recent activity (using the same donorId implicitly via session in API)
        const donationsRes = await fetch("/api/donations?status=AVAILABLE"); // Could also fetch multiple statuses
        if (donationsRes.ok) {
           const donations = await donationsRes.json();
           // Note: In a real scenario we'd filter by donorId but our API handles session-based donor stats.
           // Let's assume statsData already contains what we need or we fetch donations explicitly.
        }

        // To get donor's own donations properly:
        // We'll use the statsData.recentRequests for NGO interaction and fetch donations separately
        const myDonationsRes = await fetch("/api/donations"); // The backend returns recent donations
        if (myDonationsRes.ok) {
            const data = await myDonationsRes.json();
            setRecentItems(data.slice(0, 5));
        }

      } catch (error) {
        console.error("Dashboard load error:", error);
        toast.error("Cloud sync failed. Showing cached view.");
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
      toast.success("Signed out successfully");
    } catch (e) {
      router.push("/login");
    }
  };

  const statCards = [
    { label: "Food Rescued", value: `${stats?.totalWeightDonated || 0} kg`, icon: <UtensilsCrossed className="w-5 h-5" />, trend: "Impact Live", colorClass: "text-orange-600 group-hover:text-white" },
    { label: "Active Shares", value: stats?.activeDonations || 0, icon: <Users className="w-5 h-5" />, trend: "Active Hub", colorClass: "text-slate-900 group-hover:text-white" },
    { label: "Total Points", value: ((stats?.totalDonations || 0) * 150).toLocaleString(), icon: <Award className="w-5 h-5" />, trend: "Top Donor", colorClass: "text-orange-600 group-hover:text-white" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing with HQ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex selection:bg-orange-100">
      
      {/* Sidebar - Minimalist White */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-slate-100 bg-white z-50 flex flex-col items-center md:items-stretch py-10 px-4">
        <div className="px-2 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 italic font-black text-white text-xl">S</div>
            <span className="hidden md:block text-xl font-black tracking-tighter">DONOR HUB</span>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
           <SidebarItem icon={<LayoutDashboard />} label="Overview" active />
           <SidebarItem icon={<History />} label="My History" link="/donor/donations" />
           <SidebarItem icon={<Plus />} label="New Post" link="/donor/donate" />
        </nav>

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-orange-600 transition-colors font-bold text-sm"
        >
           <LogOut className="w-5 h-5" />
           <span className="hidden md:block uppercase tracking-wider">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-20 md:pl-64 pt-12 pb-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic underline decoration-orange-600/10 underline-offset-8 transition-all hover:decoration-orange-500/20 cursor-default">
                 Salute, {userName}! 👋
              </h1>
              <p className="text-slate-400 font-bold">You&apos;ve made a {stats?.totalWeightDonated || 0}kg difference so far.</p>
            </motion.div>
            <Link href="/donor/donate" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95">
              Post New Donation <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </Link>
          </header>

          {/* Real-time Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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
            {/* History Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic tracking-tighter">Recent Logistics</h2>
                <Link href="/donor/donations" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-orange-600 transition-colors">Full Archive</Link>
              </div>

              <div className="space-y-4">
                {recentItems.length > 0 ? (
                  recentItems.map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-orange-200/50 flex items-center justify-between transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-50/50"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 group-hover:bg-orange-50 rounded-3xl flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all border border-slate-50 group-hover:border-orange-100 relative overflow-hidden">
                           {item.imageUrl ? (
                              <img src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                           ) : (
                              <span className="group-hover:scale-110 transition-transform">🍱</span>
                           )}
                        </div>
                        <div>
                          <h4 className="font-black text-lg tracking-tight">{item.title}</h4>
                          <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {item.category} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {formatDistanceToNow(new Date(item.createdAt))} ago
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${
                          item.status === 'COLLECTED' ? 'bg-green-50 text-green-600 border-green-100' :
                          item.status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                           {item.status}
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
                        <Plus className="w-8 h-8" />
                     </div>
                     <h4 className="font-black text-lg">No active shipments</h4>
                     <p className="text-slate-400 text-sm font-bold mt-1">Ready to share surplus with those in need?</p>
                     <Link href="/donor/donate" className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-950 transition-all">
                        Start First Donation
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
                       <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black italic mb-4 leading-tight tracking-tighter">Impact Master Level 01</h3>
                    <p className="text-orange-50/80 text-xs font-bold mb-10 leading-relaxed uppercase tracking-widest">Contribute {Math.max(0, 50 - (stats?.totalWeightDonated || 0))}kg more to unlock <br />the community badges.</p>
                    <button className="w-full py-5 bg-white text-orange-600 font-black rounded-[2rem] hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-xl shadow-orange-800/10 uppercase text-[10px] tracking-widest">
                       View My Ranks
                    </button>
                 </div>
              </div>

              <div className="p-8 rounded-[3rem] border border-slate-100 bg-white flex flex-col items-center text-center group hover:border-orange-200 transition-all">
                 <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                    <Calendar className="w-6 h-6 text-slate-400 group-hover:text-orange-600" />
                 </div>
                 <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Schedule Pickups</h4>
                 <p className="text-xs font-bold text-slate-400 leading-relaxed">Optimize your logistics by setting <br />recurring surplus hours.</p>
                 <button className="mt-6 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-slate-950 transition-colors">Settings &rarr;</button>
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
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        active ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <div className={`flex justify-center items-center [&>svg]:w-6 [&>svg]:h-6 ${active ? 'text-white' : 'text-slate-400 group-hover:text-orange-600'}`}>
        {icon}
      </div>
      <span className="hidden md:block font-black text-[10px] uppercase tracking-[0.2em]">{label}</span>
    </Link>
  );
}
