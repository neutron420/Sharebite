"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  LogOut,
  Truck,
  Zap,
  Bell,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  X,
  Search,
  Settings,
  Menu,
  Info,
  AlertTriangle,
  Utensils,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { 
  Badge, 
  Menu as MuiMenu, 
  MenuItem, 
  IconButton, 
  Typography, 
  Box, 
  Divider,
  Fade,
  CircularProgress,
  Stack,
  Chip
} from "@mui/material";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RiderUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  id: string;
  href?: string;
  badge?: string;
  children?: { label: string; id: string; href: string }[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Ops Grid",
    icon: LayoutDashboard,
    id: "overview",
    href: "/rider",
  },
  {
    label: "My Missions",
    icon: Truck,
    id: "missions",
    href: "/rider/missions",
  },
  {
    label: "Bounty Board",
    icon: Zap,
    id: "bounties",
    href: "/rider/bounties",
  },
  {
    label: "Comms Log",
    icon: Bell,
    id: "notifications",
    href: "/rider/notifications",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    id: "messages",
    href: "/rider/messages",
  },
  {
    label: "Settings",
    icon: Settings,
    id: "settings",
    href: "/rider/settings",
  },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { addListener, isConnected } = useSocket();
  
  const [user, setUser] = useState<RiderUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  // Header state
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.role !== "RIDER") {
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

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  };

  useEffect(() => {
    fetchUser();

    const unsubscribe = addListener("NOTIFICATION", (newNotification) => {
      if (!newNotification) return;
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(newNotification.title || "Notification", { 
        description: newNotification.message || "Priority update received." 
      });
    });

    return () => unsubscribe();
  }, [addListener, fetchUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Initializing Link...</p>
        </div>
      </div>
    );
  }

  const isActive = (href?: string, children?: SidebarItem["children"]) => {
    if (href && pathname === href) return true;
    if (children?.some((c) => pathname === c.href)) return true;
    return false;
  };

  const renderSidebar = (isMobile = false) => {
    // Mobile always behaves as open
    const openState = isMobile ? true : sidebarOpen;
    return (
      <nav className="flex-1 overflow-x-hidden overflow-y-auto py-4 px-3 space-y-1">
        <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${openState ? "max-h-8 opacity-100 mb-2" : "max-h-0 opacity-0 mb-0"}`}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Rider Menu</p>
        </div>
        {SIDEBAR_ITEMS.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.includes(item.id);
          const active = isActive(item.href, item.children);

          return (
            <div key={item.id}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`group w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${active ? "text-orange-600" : "text-gray-400"}`} />
                  <div className={`flex items-center flex-1 overflow-hidden transition-all duration-300 whitespace-nowrap ${openState ? "opacity-100 w-[180px] ml-3" : "opacity-0 w-0 ml-0"}`}>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
              ) : (
                <Link
                  href={item.href || "#"}
                  onClick={() => setMobileOpen(false)}
                  className={`group w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${active ? "text-orange-600" : "text-gray-400"}`} />
                  <div className={`flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap ${openState ? "opacity-100 w-[180px] ml-3" : "opacity-0 w-0 ml-0"}`}>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded ml-2">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              {hasChildren && (
                <div className={`ml-8 space-y-0.5 border-l border-gray-200 pl-4 overflow-hidden transition-all duration-300 ${isExpanded && openState ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"}`}>
                  {item.children!.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-[13px] transition-all duration-150 whitespace-nowrap truncate ${
                        pathname === child.href
                          ? "text-orange-600 bg-orange-50 font-medium"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden">
      {/* Mission Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      {/* Mobile sidebar overlay */}
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
                <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 shadow-sm">
                  <img src="/sharebite-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-bold text-gray-900">ShareBite</span>
                <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderSidebar(true)}
              {user && (
                <div className="border-t border-gray-200 p-4 shrink-0 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 overflow-x-hidden ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className={`h-16 flex items-center border-b border-gray-200 shrink-0 transition-all duration-300 ${sidebarOpen ? "px-5 gap-3" : "px-3 justify-between"}`}>
          <div className={`rounded-xl overflow-hidden shrink-0 transition-all duration-300 shadow-sm ${sidebarOpen ? "h-9 w-9" : "h-10 w-10 mx-auto"}`}>
            <img src="/sharebite-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className={`flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
            <span className="text-lg font-bold text-gray-900 flex-1 truncate">ShareBite</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 shrink-0">
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        {renderSidebar(false)}
        {user && (
          <div className="border-t border-gray-200 p-4 shrink-0 overflow-hidden">
            <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? "gap-3" : "gap-0"}`}>
              <div className={`rounded-full bg-orange-50 flex items-center justify-center shrink-0 transition-all duration-300 ${sidebarOpen ? "h-9 w-9" : "h-10 w-10 mx-auto"}`}>
                <ShieldCheck className="h-4 w-4 text-orange-600" />
              </div>
              <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? "opacity-100 w-[150px]" : "opacity-0 w-0"}`}>
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 shrink-0">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
                <Search className="h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Scan Sector..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" 
                />
              </div>
              <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-500 ${isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {isConnected ? 'Link Active' : 'Link Failure'}
                </span>
                <Zap className={`w-3 h-3 ${isConnected ? 'text-orange-500' : ''}`} />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <DashboardRefreshButton />
              
              <IconButton 
                size="small"
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                className="hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </Badge>
              </IconButton>

              <MuiMenu
                anchorEl={notifAnchor}
                open={Boolean(notifAnchor)}
                onClose={() => setNotifAnchor(null)}
                TransitionComponent={Fade}
                PaperProps={{
                  sx: { 
                    width: 320, 
                    maxHeight: 400, 
                    borderRadius: '16px', 
                    mt: 1.5, 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    border: '1px solid #f3f4f6'
                  }
                }}
              >
                <Box className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <Typography className="font-bold text-gray-900 text-sm">Notifications</Typography>
                  <Chip label={`${unreadCount} New`} size="small" className="bg-orange-50 text-orange-600 font-bold text-[10px]" />
                </Box>
                
                <Box className="overflow-y-auto max-h-[300px]">
                  {notifLoading ? (
                    <Box className="flex items-center justify-center p-8">
                       <CircularProgress size={20} className="text-orange-500" />
                    </Box>
                  ) : notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <MenuItem 
                        key={i} 
                        onClick={() => setNotifAnchor(null)}
                        className="py-3 px-4 hover:bg-orange-50 transition-colors whitespace-normal"
                      >
                         <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box className="mt-1 p-1.5 rounded-full bg-blue-50 text-blue-500">
                               <Info className="h-3.5 w-3.5" />
                            </Box>
                            <Box>
                               <Typography className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{n.title}</Typography>
                               <Typography className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</Typography>
                            </Box>
                         </Stack>
                      </MenuItem>
                    ))
                  ) : (
                    <Box className="p-8 text-center text-gray-400">
                       <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                       <Typography className="text-xs text-gray-500">No notifications yet</Typography>
                    </Box>
                  )}
                </Box>
                
                <Divider />
                <MenuItem 
                  onClick={() => router.push('/rider/notifications')}
                  className="py-3 justify-center text-xs font-bold text-orange-600 hover:bg-orange-50"
                >
                  View All Activity
                </MenuItem>
              </MuiMenu>
              {user && (
                <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-gray-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">Rider</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0">
                    {user.name.charAt(0)}
                  </div>
                </div>
              )}
              <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 shrink-0" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] pb-[15rem] lg:pb-6 relative z-10 transition-all duration-500">
          <motion.div
            key={pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation - Rider Tactical Deck */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
          <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-950/40 flex items-center justify-between">
            {[
              { icon: LayoutDashboard, href: "/rider", label: "Grid" },
              { icon: Truck, href: "/rider/missions", label: "Missions" },
              { icon: Zap, href: "/rider/bounties", label: "Bounties", primary: true },
              { icon: MessageSquare, href: "/rider/messages", label: "Chat" },
              { icon: Bell, href: "/rider/notifications", label: "Comms" },
            ].map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-3 py-2 rounded-[1.5rem] transition-all relative",
                    active ? "text-orange-500" : "text-slate-400"
                  )}
                >
                  {item.primary ? (
                    <div className="bg-orange-600 p-4 rounded-full shadow-2xl shadow-orange-600/40 scale-125 -mt-10 mb-2 border-4 border-slate-900">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <>
                      <item.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                      <span className="text-[8px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                      {active && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                      )}
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
