"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  History, 
  LayoutDashboard,
  LogOut,
  Loader2,
  Package,
  Calendar,
  MapPin,
  Clock,
  Badge,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import DonationList from "@/components/ui/donation-list";

export default function DonorHistory() {
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDonations() {
      try {
        setLoading(true);
        // Assuming /api/donations returns all donations for the logged-in user if called appropriately
        const res = await fetch("/api/donations");
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setDonations(data);
      } catch (error) {
        console.error("History load error:", error);
        toast.error("Could not load your history.");
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
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



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading Logs...</p>
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
           <SidebarItem icon={<LayoutDashboard />} label="Overview" link="/donor" />
           <SidebarItem icon={<History />} label="My History" active link="/donor/donations" />
           <SidebarItem icon={<Plus />} label="New Post" link="/donor/donate" />
           <SidebarItem icon={<Bell />} label="Alerts" link="/donor/notifications" />
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
                 Donation History
              </h1>
              <p className="text-slate-400 font-bold">Track your past and current active shares.</p>
            </motion.div>
            <Link href="/donor/donate" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95">
              Post New <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </Link>
          </header>

          <div className="h-[600px]">
             <DonationList donations={donations} />
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
      <span className={`font-black text-[13px] tracking-wide uppercase ${active ? 'text-white' : 'group-hover:text-slate-900'}`}>{label}</span>
    </Link>
  );
}
