"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Utensils,
  LayoutDashboard,
  HandHeart,
  Building2,
  Bell,
  FileText,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Star,
  Search,
  UserCheck,
  ClipboardList,
  Settings,
  Map,
  type LucideIcon,
} from "lucide-react";

interface AdminUser {
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
    label: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    href: "/admin",
  },
  {
    label: "Donations",
    icon: HandHeart,
    id: "donations",
    href: "/admin/donations",
  },
  {
    label: "Users",
    icon: Users,
    id: "users",
    children: [
      { label: "All Users", id: "all-users", href: "/admin/users" },
      { label: "Donors", id: "donors", href: "/admin/users?role=DONOR" },
      { label: "NGOs", id: "ngos", href: "/admin/users?role=NGO" },
    ],
  },
  { label: "NGO Verification", icon: UserCheck, id: "verification", href: "/admin/verification" },
  { label: "Pickup Requests", icon: ClipboardList, id: "requests", href: "/admin/requests", badge: "New" },
  { label: "NGO Partners", icon: Building2, id: "ngo-partners", href: "/admin/ngo" },
  { label: "Reviews", icon: Star, id: "reviews", href: "/admin/reviews" },
  { label: "Operations Map", icon: Map, id: "map", href: "/admin/map" },
  { label: "Notifications", icon: Bell, id: "notifications", href: "/admin/notifications" },
  { label: "Audit Logs", icon: FileText, id: "audit-logs", href: "/admin/logs" },
  { label: "Settings", icon: Settings, id: "settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["users"]);

  // Skip layout for login/register pages
  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/register");

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        if (!isAuthPage) router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.role !== "ADMIN") {
        router.push("/admin/login");
        return;
      }
      setUser(data);
    } catch {
      if (!isAuthPage) router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [router, isAuthPage]);

  useEffect(() => {
    if (!isAuthPage) fetchUser();
    else setLoading(false);
  }, [fetchUser, isAuthPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  // Return children directly for auth pages
  if (isAuthPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const isActive = (href?: string, children?: typeof SIDEBAR_ITEMS[0]["children"]) => {
    if (href && pathname === href) return true;
    if (children?.some((c) => pathname === c.href.split("?")[0])) return true;
    return false;
  };

  const renderSidebar = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Menu</p>
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
                      pathname === child.href.split("?")[0]
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
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 border border-gray-200">
                <Search className="h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search..." className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" readOnly />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
              </button>
              {user && (
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
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
