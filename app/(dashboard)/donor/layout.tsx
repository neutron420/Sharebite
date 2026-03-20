"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import {
  LayoutDashboard,
  History,
  Plus,
  MapPin,
  AlertTriangle,
  Bell,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Search,
  Settings,
  ShieldCheck,
  Utensils,
  type LucideIcon,
  Info
} from "lucide-react";
import { 
  Badge, 
  IconButton, 
  Typography, 
  Box, 
  Divider,
  Fade,
  CircularProgress,
  Stack,
  Chip,
  MenuItem,
  Menu as MuiMenu
} from "@mui/material";

interface DonorUser {
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
    label: "Overview",
    icon: LayoutDashboard,
    id: "overview",
    href: "/donor",
  },
  {
    label: "Share Food",
    icon: Plus,
    id: "donate",
    href: "/donor/donate",
  },
  {
    label: "My History",
    icon: History,
    id: "history",
    href: "/donor/donations",
  },
  { 
    label: "NGO Map", 
    icon: MapPin, 
    id: "ngos", 
    href: "/donor/ngos" 
  },
  { 
    label: "Complaints", 
    icon: AlertTriangle, 
    id: "complaints", 
    href: "/donor/complaints" 
  },
  { 
    label: "Notifications", 
    icon: Bell, 
    id: "notifications", 
    href: "/donor/notifications" 
  },
];

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DonorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  const { addListener } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.role !== "DONOR") {
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
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchNotifications();

    // Listen for real-time notifications via WebSocket
    const unsubscribe = addListener("NOTIFICATION", (newNotif) => {
       setNotifications(prev => [newNotif, ...prev]);
       setUnreadCount(prev => prev + 1);
       toast.info(newNotif.title, { description: newNotif.message });
    });

    return () => unsubscribe();
  }, [fetchUser, fetchNotifications, addListener]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Initializing Donor Hub...</p>
        </div>
      </div>
    );
  }

  const isActive = (href?: string, children?: typeof SIDEBAR_ITEMS[0]["children"]) => {
    if (href && (pathname === href || pathname?.startsWith(href + "/"))) return true;
    if (children?.some((c) => pathname === c.href.split("?")[0])) return true;
    return false;
  };

  const renderSidebar = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {sidebarOpen && <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Donor Menu</p>}
      {SIDEBAR_ITEMS.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedMenus.includes(item.id);
        const active = isActive(item.href, item.children);

        return (
          <div key={item.id}>
            {hasChildren ? (
              <button
                onClick={() => setExpandedMenus(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active ? "bg-orange-50 text-orange-600" : "text-black-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-orange-600" : "text-gray-400"}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
            ) : (
              <Link
                href={item.href || "#"}
                onClick={() => setMobileOpen(false)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active ? "bg-orange-50 text-orange-600" : "text-black-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-orange-600" : "text-gray-400"}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="relative w-72 h-full bg-white border-r border-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
              <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">ShareBite</span>
              <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 rounded-md text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebar()}
            {user && (
              <div className="border-t border-gray-200 p-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 overflow-x-hidden ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className={`h-16 flex items-center border-b border-gray-200 shrink-0 ${sidebarOpen ? "px-5 gap-3" : "px-3 justify-between"}`}>
          <div className={`${sidebarOpen ? "h-9 w-9" : "h-8 w-8"} rounded-lg bg-orange-500 flex items-center justify-center shrink-0 transition-all duration-300`}>
            <Utensils className={`${sidebarOpen ? "h-5 w-5" : "h-4 w-4"} text-white transition-all`} />
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900 flex-1 truncate">ShareBite</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 shrink-0">
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        {renderSidebar()}
        {user && sidebarOpen && (
          <div className="border-t border-gray-200 p-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
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
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                <Search className="h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Global Hub Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" 
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton 
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                className="hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <Bell className="h-4.5 w-4.5" />
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
                  <Typography className="font-bold text-gray-900">Notifications</Typography>
                  <Chip label={`${unreadCount} New`} size="small" className="bg-orange-50 text-orange-600 font-bold text-[10px]" />
                </Box>
                
                <Box className="overflow-y-auto max-h-[300px]">
                  {notifLoading ? (
                    <Box className="flex items-center justify-center p-8">
                       <CircularProgress size={20} className="text-orange-500" />
                    </Box>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <MenuItem 
                        key={n.id} 
                        onClick={() => {
                          setNotifAnchor(null);
                          if (n.link) router.push(n.link);
                        }}
                        className="py-3 px-4 hover:bg-orange-50 transition-colors whitespace-normal"
                      >
                         <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box className={`mt-1 p-1.5 rounded-full ${n.type === 'ALERT' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                               {n.type === 'ALERT' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
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
                       <Typography className="text-xs">No notifications yet</Typography>
                    </Box>
                  )}
                </Box>
                
                <Divider />
                <MenuItem 
                   onClick={() => router.push('/donor/notifications')}
                   className="py-3 justify-center text-xs font-bold text-orange-600 hover:bg-orange-50"
                >
                  View All Activity
                </MenuItem>
              </MuiMenu>

              {user && (
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">{user.role} HUB</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                </div>
              )}
              <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white/50">{children}</main>
      </div>
    </div>
  );
}
