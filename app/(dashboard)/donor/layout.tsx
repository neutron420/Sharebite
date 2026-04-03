"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Users,
  type LucideIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
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
import { cn } from "@/lib/utils";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";
import { useSocket } from "@/components/providers/socket-provider";

interface DonorUser {
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
    label: "Community",
    icon: Users,
    id: "community",
    href: "/community",
  },
  {
    label: "My History",
    icon: History,
    id: "history",
    href: "/donor/donations",
  },
  {
    label: "Profile",
    icon: UserRound,
    id: "profile",
    href: "/donor/profile",
  },
  {
    label: "NGO Map",
    icon: MapPin,
    id: "ngos",
    href: "/donor/ngos",
  },
  {
    label: "Complaints",
    icon: AlertTriangle,
    id: "complaints",
    href: "/donor/complaints",
  },
  {
    label: "Notifications",
    icon: Bell,
    id: "notifications",
    href: "/donor/notifications",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    id: "messages",
    href: "/donor/messages",
  },
];

export default function DonorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { addListener, isConnected } = useSocket();

  const [user, setUser] = useState<DonorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
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
      if (
        newNotification.title &&
        typeof newNotification.title === "string" &&
        newNotification.title.includes("Badge Unlocked")
      ) {
        // Trigger celebration!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f97316", "#fb923c", "#fdba74"]
        });

        toast.success(newNotification.title, {
          description: `${newNotification.message} Open Profile to see it in your badge wall.`,
        });
        return;
      }

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Initializing Donor Hub...</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/donor") {
      return pathname === href;
    }

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
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Donor Menu
          </p>
        </div>
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                  active ? "text-orange-600" : "text-gray-400"
                }`}
              />
              <div className={`flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap ${openState ? "opacity-100 w-[180px] ml-3" : "opacity-0 w-0 ml-0"}`}>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded ml-2">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden">
      {/* Decorative tactical background - Intelligence Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="relative w-72 h-full bg-white border-r border-gray-200 flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
              <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">ShareBite</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto p-1 rounded-md text-gray-400 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebar(true)}
            {user && (
              <div className="border-t border-gray-200 p-4 shrink-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-orange-100">
                    <AvatarImage src={user.imageUrl || undefined} alt={user.name} />
                    <AvatarFallback className="bg-orange-50 text-xs font-bold text-orange-600">
                      {userInitials || "SB"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/donor/profile"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-orange-600"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-600"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 overflow-x-hidden ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div
          className={`h-16 flex items-center border-b border-gray-200 shrink-0 ${
            sidebarOpen ? "px-5 gap-3" : "px-3 justify-between"
          }`}
        >
          <div
            className={`rounded-lg bg-orange-500 flex items-center justify-center shrink-0 transition-all duration-300 ${
              sidebarOpen ? "h-9 w-9 mx-0" : "h-10 w-10 mx-auto"
            }`}
          >
            <Utensils
              className={`text-white transition-all duration-300 ${sidebarOpen ? "h-5 w-5" : "h-5 w-5"}`}
            />
          </div>
          <div className={`flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
            <span className="text-lg font-bold text-gray-900 flex-1 truncate">ShareBite</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 shrink-0"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${
                !sidebarOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        {renderSidebar(false)}
        {user && (
          <div className="border-t border-gray-200 p-4 shrink-0 overflow-hidden">
            <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? "gap-3" : "gap-0"}`}>
              <Avatar className={`shrink-0 border border-orange-100 transition-all duration-300 ${sidebarOpen ? "h-9 w-9" : "h-10 w-10 mx-auto"}`}>
                <AvatarImage src={user.imageUrl || undefined} alt={user.name} />
                <AvatarFallback className="bg-orange-50 text-xs font-bold text-orange-600">
                  {userInitials || "SB"}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? "opacity-100 w-[150px]" : "opacity-0 w-0"}`}>
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Global Hub Search..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-500 ${isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {isConnected ? 'Sync Online' : 'Sync Error'}
                </span>
                <Zap className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
              </div>

              <DashboardRefreshButton className="shrink-0" />

              <IconButton
                onClick={(event) => setNotifAnchor(event.currentTarget)}
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
                    borderRadius: "16px",
                    mt: 1.5,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    border: "1px solid #f3f4f6",
                  },
                }}
              >
                <Box className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <Typography className="font-bold text-gray-900">Notifications</Typography>
                  <Chip
                    label={`${unreadCount} New`}
                    size="small"
                    className="bg-orange-50 text-orange-600 font-bold text-[10px]"
                  />
                </Box>

                <Box className="overflow-y-auto max-h-[300px]">
                  {notifLoading ? (
                    <Box className="flex items-center justify-center p-8">
                      <CircularProgress size={20} className="text-orange-500" />
                    </Box>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      notification && (
                        <MenuItem
                          key={notification.id}
                        onClick={() => {
                          setNotifAnchor(null);
                          if (notification.link) {
                            router.push(notification.link);
                          }
                        }}
                        className="py-3 px-4 hover:bg-orange-50 transition-colors whitespace-normal"
                      >
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box
                            className={`mt-1 p-1.5 rounded-full ${
                              notification.type === "ALERT"
                                ? "bg-red-50 text-red-500"
                                : "bg-blue-50 text-blue-500"
                            }`}
                          >
                            {notification.type === "ALERT" ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <Info className="h-3.5 w-3.5" />
                            )}
                          </Box>
                          <Box>
                            <Typography className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                              {notification.title}
                            </Typography>
                            <Typography className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                      )
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
                  onClick={() => {
                    setNotifAnchor(null);
                    router.push("/donor/notifications");
                  }}
                  className="py-3 justify-center text-xs font-bold text-orange-600 hover:bg-orange-50"
                >
                  View All Activity
                </MenuItem>
              </MuiMenu>

              {user && (
                <>
                  <button
                    onClick={(event) => setProfileAnchor(event.currentTarget)}
                    className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200 rounded-xl py-1.5 pr-1.5 hover:bg-gray-100 transition-colors"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">
                        {user.role} HUB
                      </p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-orange-100 shadow-sm">
                      <AvatarImage src={user.imageUrl || undefined} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white">
                        {userInitials || user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  <MuiMenu
                    anchorEl={profileAnchor}
                    open={Boolean(profileAnchor)}
                    onClose={() => setProfileAnchor(null)}
                    TransitionComponent={Fade}
                    PaperProps={{
                      sx: {
                        width: 300,
                        borderRadius: "16px",
                        mt: 1.5,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        border: "1px solid #f3f4f6",
                      },
                    }}
                  >
                    <Box className="px-4 py-3 border-b border-gray-100">
                      <Typography className="font-bold text-gray-900">{user.name}</Typography>
                      <Typography className="text-xs text-gray-500 mt-0.5">{user.email}</Typography>
                    </Box>
                    <MenuItem
                      onClick={() => {
                        setProfileAnchor(null);
                        router.push("/donor/profile");
                      }}
                      className="py-3 px-4 hover:bg-orange-50 transition-colors whitespace-normal"
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box className="p-2 rounded-full bg-orange-50 text-orange-600">
                          <UserRound className="h-4 w-4" />
                        </Box>
                        <Box>
                          <Typography className="text-sm font-semibold text-gray-900">Profile</Typography>
                          <Typography className="text-xs text-gray-500 mt-0.5">
                            View your badges, karma level, and donor account details.
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  </MuiMenu>
                </>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] pb-[15rem] lg:pb-6 relative z-10">{children}</main>

        {/* Mobile Bottom Navigation - Floating Premium Design */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
          <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-950/40 flex items-center justify-between">
            {[
              { icon: LayoutDashboard, href: "/donor", label: "Hub" },
              { icon: Bell, href: "/donor/notifications", label: "Alerts" },
              { icon: Plus, href: "/donor/donate", label: "Share", primary: true },
              { icon: MessageSquare, href: "/donor/messages", label: "Chat" },
              { icon: UserRound, href: "/donor/profile", label: "Profile" },
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
