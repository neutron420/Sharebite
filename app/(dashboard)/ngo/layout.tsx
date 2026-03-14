"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Search,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface NGOUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NGOLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<NGOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.role !== "NGO") {
        router.push("/login"); // Only allow NGOs
        return;
      }
      setUser(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    toast.success("Disconnected from Ops Center");
  };

  const navItems = [
    { label: "Ops Hub", icon: LayoutDashboard, href: "/ngo" },
    { label: "My Pickups", icon: Package, href: "/ngo/requests" },
    { label: "Find Food", icon: Search, href: "/donations" },
    { label: "Alerts", icon: Bell, href: "/ngo/notifications" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Ops Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex italic selection:bg-orange-100">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-slate-100 bg-white z-50 py-10 px-6">
        <div className="flex items-center gap-3 mb-16 px-2">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 italic font-black text-white text-xl uppercase">N</div>
          <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">NGO Ops Hub</span>
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                pathname === item.href 
                  ? 'bg-orange-600 text-white shadow-xl shadow-orange-100' 
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-white' : 'text-slate-400 group-hover:text-orange-600'}`} />
              <span className={`font-black text-[11px] tracking-[0.1em] uppercase ${pathname === item.href ? 'text-white' : 'group-hover:text-slate-900'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          {user && (
            <div className="px-4 py-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600/10 flex items-center justify-center border border-orange-500/20">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate">{user.name}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 truncate">Coordinator</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 text-slate-400 hover:text-orange-600 transition-colors font-black text-xs uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" />
            <span>Terminate Link</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-white">
        
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center font-black text-white italic">N</div>
            <span className="font-black text-sm tracking-tighter uppercase whitespace-nowrap">NGO Hub</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed inset-0 z-50 bg-white lg:hidden pt-24 px-8 space-y-8"
            >
              <nav className="space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-6 h-6 text-orange-600" />
                      <span className="text-2xl font-black uppercase tracking-tighter">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </Link>
                ))}
              </nav>
              <div className="pt-8 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 text-slate-400 font-black uppercase tracking-widest"
                >
                  <LogOut className="w-6 h-6" /> Terminate Link
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
