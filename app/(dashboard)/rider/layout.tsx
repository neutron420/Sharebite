"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Truck,
  Zap,
  Bell,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";

interface RiderUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<RiderUser | null>(null);
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
      if (data.role !== "RIDER") {
        router.push("/login"); // Only allow Riders
        return;
      }
      setUser(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const { addListener } = useSocket();

  useEffect(() => {
    fetchUser();

    // Listen for real-time notifications via WebSocket
    const unsubscribe = addListener("NOTIFICATION", (newNotif) => {
       toast.info(newNotif.title, { description: newNotif.message });
    });

    return () => unsubscribe();
  }, [fetchUser, addListener]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const navItems = [
    { label: "Ops Grid", icon: LayoutDashboard, href: "/rider" },
    { label: "My Missions", icon: Truck, href: "/rider/missions" }, // Assuming missions page exists or will exist
    { label: "Bounty Board", icon: Zap, href: "/rider/bounties" },
    { label: "Comms", icon: Bell, href: "/rider/notifications" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Zap className="w-10 h-10 text-orange-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex italic selection:bg-orange-500/30">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white/90 backdrop-blur-xl z-50 py-10 px-6 shadow-lg">
        <div className="flex items-center gap-3 mb-16 px-2">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-950/50 italic font-black text-white text-xl">R</div>
          <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap text-black">Rider Stealth</span>
        </div>

        <nav className="grow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                pathname === item.href 
                  ? 'bg-orange-600 text-white shadow-2xl shadow-orange-950' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-white' : 'text-gray-600 group-hover:text-orange-500'}`} />
              <span className={`font-black text-[11px] tracking-widest uppercase ${pathname === item.href ? 'text-white' : 'group-hover:text-black'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          {user && (
            <div className="px-4 py-4 rounded-3xl bg-gray-100 border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center border border-orange-500/20">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-black truncate">{user.name}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 truncate">Elite Operative</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 text-gray-500 hover:text-orange-500 transition-colors font-black text-xs uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" />
            <span>Abort Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-6 h-20 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center font-black text-white italic">R</div>
            <span className="font-black text-sm tracking-tighter uppercase whitespace-nowrap text-black">Rider Hub</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-black"
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
                      <item.icon className="w-6 h-6 text-orange-500" />
                      <span className="text-2xl font-black uppercase tracking-tighter text-black">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </nav>
              <div className="pt-8 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 text-gray-500 font-black uppercase tracking-widest"
                >
                  <LogOut className="w-6 h-6" /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-12">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <DashboardRefreshButton />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
