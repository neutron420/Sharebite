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

  const renderSidebar = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Rider Menu</p>
      {SIDEBAR_ITEMS.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedMenus.includes(item.id);
        const active = isActive(item.href, item.children);

        return (
          <div key={item.id}>
            {hasChildren ? (
              <button
                onClick={() => toggleMenu(item.id)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                  active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
            {hasChildren && isExpanded && sidebarOpen && (
              <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-4">
                {item.children!.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
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
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
          <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900 flex-1">ShareBite</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100">
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
            <div className="flex items-center gap-2">
              <DashboardRefreshButton />
              
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
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">Rider</p>
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
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
