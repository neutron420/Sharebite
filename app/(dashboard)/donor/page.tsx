"use client";

import React from "react";
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
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * ShareBite Donor Hub - Orange & White Edition
 * Premium Design System
 */
export default function DonorDashboard() {
  const stats = [
    { label: "Food Rescued", value: "124 kg", icon: <UtensilsCrossed className="w-5 h-5" />, trend: "+12% this mo", colorClass: "text-orange-600 group-hover:text-white" },
    { label: "Lives Fed", value: "480+", icon: <Users className="w-5 h-5" />, trend: "Impact Star", colorClass: "text-slate-900 group-hover:text-white" },
    { label: "Karma Points", value: "3,250", icon: <Award className="w-5 h-5" />, trend: "Top 5% Hub", colorClass: "text-orange-600 group-hover:text-white" },
  ];

  const recentActivity = [
    { title: "Fresh Biryani Surplus", status: "COLLECTED", time: "2h ago", id: "SB-821" },
    { title: "Artisan Bread Pack", status: "APPROVED", time: "5h ago", id: "SB-819" },
    { title: "Dairy Basket", status: "PENDING", time: "1d ago", id: "SB-802" },
  ];

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
           <SidebarItem icon={<History />} label="My History" />
           <SidebarItem icon={<Plus />} label="New Post" link="/donor/donate" />
        </nav>

        <button className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-orange-600 transition-colors font-bold text-sm">
           <LogOut className="w-5 h-5" />
           <span className="hidden md:block uppercase tracking-wider">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-20 md:pl-64 pt-12 pb-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic underline decoration-orange-600/10 underline-offset-8">Morning, Hero! 👋</h1>
              <p className="text-slate-400 font-bold">Ready to make another 10kg difference today?</p>
            </div>
            <Link href="/donor/donate" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95">
              Post New Donation <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </Link>
          </header>

          {/* Real-time Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-orange-50"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 transition-colors duration-500 ${stat.colorClass}`}>
                    {stat.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{stat.trend}</span>
                </div>
                <p className="text-slate-400 font-bold text-sm mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{stat.value}</h3>
              </motion.div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* History Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic tracking-tighter">Recent Logistics</h2>
                <Link href="#" className="text-xs font-bold text-slate-400 hover:text-orange-600">View Archive</Link>
              </div>

              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-slate-200 flex items-center justify-between transition-all cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-50 group-hover:bg-orange-50 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">🍱</div>
                      <div>
                        <h4 className="font-black text-lg">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {item.id} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {item.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${
                        item.status === 'COLLECTED' ? 'bg-green-50 text-green-600 border-green-100' :
                        item.status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                         {item.status}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-600 transition-colors group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              <div className="p-8 rounded-[3rem] bg-orange-600 text-white relative overflow-hidden group shadow-2xl shadow-orange-100">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                 <h3 className="text-2xl font-black italic mb-4 leading-tight">Elite Impact <br /> Tier Unlocked</h3>
                 <p className="text-orange-50 text-sm font-medium mb-10 leading-relaxed">You&apos;ve rescued enough food to plant 50 trees this week. Claim your certificate.</p>
                 <button className="w-full py-4 bg-white text-orange-600 font-extrabold rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-lg">
                    Claim Badge
                 </button>
              </div>

              <div className="p-8 rounded-[3rem] border border-slate-100 bg-white flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-slate-300" />
                 </div>
                 <h4 className="font-black text-sm mb-1">Boost Your Karma</h4>
                 <p className="text-xs font-medium text-slate-400">Complete 3 more donations this week to enter the Platinum Leaderboard.</p>
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
      <span className="hidden md:block font-black text-xs uppercase tracking-wider">{label}</span>
    </Link>
  );
}
