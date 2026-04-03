"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  ChevronLeft,
  History,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Search,
  UserRound,
  Utensils,
  X,
  ShieldCheck,
  Zap,
  Package,
  Globe,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  IconButton,
  Menu as MuiMenu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";
import { useSocket } from "@/components/providers/socket-provider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NGOUser {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string | null;
}

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  id: string;
  href: string;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Ops Hub",
    icon: LayoutDashboard,
    id: "overview",
    href: "/ngo",
  },
  {
    label: "My Pickups",
    icon: Package,
    id: "requests",
    href: "/ngo/requests",
  },
  {
    label: "Find Food",
    icon: Search,
    id: "donations",
    href: "/ngo/find-food",
  },
  {
    label: "History",
    icon: History,
    id: "history",
    href: "/ngo/history",
  },
  {
    label: "Complaints",
    icon: AlertTriangle,
    id: "complaints",
    href: "/ngo/complaints",
  },
  {
    label: "Notifications",
    icon: Bell,
    id: "notifications",
    href: "/ngo/notifications",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    id: "messages",
    href: "/ngo/messages",
  },
  {
    label: "Profile",
    icon: UserRound,
    id: "profile",
    href: "/ngo/profile",
  },
];

export default function NGOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addListener, isConnected } = useSocket();

  const [user, setUser] = useState<NGOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // WhatsApp-style Immersive Mode Detection
  const activeChatId = searchParams.get("id");
  const isImmersiveChat = pathname?.includes("/messages") && activeChatId;

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.role !== "NGO") {
        router.push("/login");
        return;
      }

      setUser(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
        setUnreadCount(Array.isArray(data) ? data.filter((notification: any) => notification && !notification.isRead).length : 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchNotifications();

    const unsubscribe = addListener("NOTIFICATION", (newNotification) => {
      if (!newNotification) return;
      setNotifications((previous) => [newNotification, ...previous]);
      setUnreadCount((previous) => previous + 1);
      toast.info(newNotification.title || "New Update", { description: newNotification.message || "You have a new notification" });
    });

    return () => unsubscribe();
  }, [addListener, fetchNotifications, fetchUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Ops Intelligence...</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/ngo") return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const userInitials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const renderSidebar = (isMobile = false) => {
    const openState = isMobile ? true : sidebarOpen;
    return (
      <nav className="flex-1 overflow-x-hidden overflow-y-auto py-4 px-3 space-y-1">
        <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${openState ? "max-h-8 opacity-100 mb-2" : "max-h-0 opacity-0 mb-0"}`}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">NGO Ops Menu</p>
        </div>
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", active ? "text-orange-600" : "text-gray-400")} />
              {openState && <span className="ml-3 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden" 
            onClick={() => setMobileOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-72 h-full bg-white border-r border-gray-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
                <img src="/sharebite-logo.jpg" alt="Logo" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
                <span className="text-lg font-black tracking-tighter uppercase text-gray-900">NGO Hub</span>
                <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 rounded-md text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderSidebar(true)}
              {user && (
                <div className="border-t border-gray-200 p-4 shrink-0">
                   <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-9 w-9 border border-orange-100">
                        <AvatarImage src={user.imageUrl || undefined} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                   </div>
                   <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-2 text-xs font-bold text-red-600 uppercase tracking-widest active:scale-95 transition-all">
                      <LogOut className="h-3.5 w-3.5" /> Terminate Link
                   </button>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className={cn("hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 overflow-x-hidden", sidebarOpen ? "w-64" : "w-20")}>
        <div className={cn("h-16 flex items-center border-b border-gray-200 shrink-0", sidebarOpen ? "px-5 gap-3" : "px-3 justify-center")}>
          <img src="/sharebite-logo.jpg" alt="Logo" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
          {sidebarOpen && <span className="text-lg font-black uppercase tracking-tighter text-gray-900 truncate flex-1">NGO Ops Hub</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900">
             <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
        {renderSidebar(false)}
      </aside>

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:ml-64" : "lg:ml-20")}>
        <header className={cn(
           "sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all duration-500",
           isImmersiveChat ? "hidden lg:flex" : "flex"
        )}>
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between w-full">
             <div className="flex items-center gap-4">
                <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 h-10 w-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                   <Menu className="h-5 w-5" />
                </button>
             </div>
             <div className="flex items-center gap-2 sm:gap-4">
                <DashboardRefreshButton className="h-10" />
                <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} className="h-10 w-10 rounded-xl hover:bg-orange-50/50 transition-colors">
                   <Badge badgeContent={unreadCount} color="error"><Bell className="h-5 w-5" /></Badge>
                </IconButton>
                {user && (
                   <div className="h-10 flex items-center pl-4 border-l border-gray-100">
                      <Avatar className="h-9 w-9 border-2 border-orange-100 shadow-sm">
                         <AvatarImage src={user.imageUrl || undefined} />
                         <AvatarFallback className="bg-orange-600 text-white font-bold text-xs">{userInitials}</AvatarFallback>
                      </Avatar>
                   </div>
                )}
             </div>
          </div>
        </header>

        <main className={cn(
          "flex-1 overflow-y-auto bg-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-500",
          isImmersiveChat ? "p-0" : "p-4 sm:p-6 pb-[15rem] lg:pb-6 relative z-10"
        )}>
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            {children}
          </motion.div>
        </main>

        <div className={cn(
           "lg:hidden fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 transform",
           isImmersiveChat ? "translate-y-32 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}>
           <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl flex items-center justify-between">
              {[
                { icon: LayoutDashboard, href: "/ngo", label: "Hub" },
                { icon: Package, href: "/ngo/requests", label: "Pickups" },
                { icon: Search, href: "/ngo/find-food", label: "Find", primary: true },
                { icon: UserRound, href: "/ngo/profile", label: "Profile" },
                { icon: MessageSquare, href: "/ngo/messages", label: "Chat" },
              ].map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-3 py-2 transition-all", active ? "text-orange-500" : "text-slate-400")}>
                    {item.primary ? (
                      <div className="bg-orange-600 p-4 rounded-full shadow-2xl -mt-10 mb-2 border-4 border-slate-900">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <>
                        <item.icon className="h-5 w-5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                      </>
                    )}
                  </Link>
                );
              })}
           </nav>
        </div>
      </div>
    </div>
  );
}
