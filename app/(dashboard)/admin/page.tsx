"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  ClipboardList,
  Weight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  LayoutDashboard,
  HandHeart,
  Building2,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Star,
  Search,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────
interface Stats {
  totalUsers: number;
  totalDonations: number;
  totalRequests: number;
  totalWeightSaved: number;
}

interface UserRoles {
  donors: number;
  ngos: number;
  admins: number;
}

interface DonationStatuses {
  available: number;
  requested: number;
  approved: number;
  collected: number;
  expired: number;
}

interface MonthlyDonation {
  month: string;
  count: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
}

interface RecentDonation {
  id: string;
  title: string;
  quantity: number;
  weight: number | null;
  category: string;
  status: string;
  city: string;
  createdAt: string;
  donor: { name: string };
  requests: { status: string; ngo: { name: string } }[];
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { name: string };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardData {
  stats: Stats;
  userRoles: UserRoles;
  donationStatuses: DonationStatuses;
  monthlyDonations: MonthlyDonation[];
  categoryBreakdown: CategoryBreakdown[];
  recentDonations: RecentDonation[];
  recentLogs: AuditLog[];
}

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  id: string;
  badge?: string;
  children?: { label: string; id: string }[];
}

// ── Helpers ────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899",
  "#eab308", "#06b6d4", "#ef4444", "#84cc16",
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#3b82f6", REQUESTED: "#eab308", APPROVED: "#8b5cf6",
  COLLECTED: "#10b981", EXPIRED: "#ef4444",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  AVAILABLE: Package, REQUESTED: Clock, APPROVED: CheckCircle2,
  COLLECTED: CheckCircle2, EXPIRED: XCircle,
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    children: [
      { label: "Overview", id: "overview" },
      { label: "Analytics", id: "analytics" },
    ],
  },
  {
    label: "Donations",
    icon: HandHeart,
    id: "donations",
    children: [
      { label: "All Donations", id: "all-donations" },
      { label: "Categories", id: "categories" },
      { label: "Status", id: "status" },
    ],
  },
  {
    label: "Users",
    icon: Users,
    id: "users",
    children: [
      { label: "All Users", id: "all-users" },
      { label: "Donors", id: "donors" },
      { label: "NGOs", id: "ngos" },
      { label: "Verification", id: "verification" },
    ],
  },
  { label: "Pickup Requests", icon: ClipboardList, id: "requests", badge: "New" },
  { label: "NGO Partners", icon: Building2, id: "ngo-partners" },
  { label: "Reviews", icon: Star, id: "reviews" },
  { label: "Notifications", icon: Bell, id: "notifications" },
  { label: "Messages", icon: MessageSquare, id: "messages" },
  { label: "Audit Logs", icon: FileText, id: "audit-logs" },
  { label: "User Verify", icon: UserCheck, id: "user-verify" },
  { label: "Settings", icon: Settings, id: "settings" },
];

function formatCategory(c: string) {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// ── Component ──────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("overview");
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["dashboard"]);

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [meRes, statsRes] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/admin/stats", { credentials: "include" }),
      ]);
      if (meRes.status === 401 || statsRes.status === 401) { router.push("/admin/login"); return; }
      if (!meRes.ok || !statsRes.ok) throw new Error("Failed to fetch dashboard data");
      const meData = await meRes.json();
      if (meData.role !== "ADMIN") { router.push("/admin/login"); return; }
      setUser(meData);
      setData(await statsRes.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4 border border-gray-200">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-500">{error}</p>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { stats, userRoles, donationStatuses, monthlyDonations, categoryBreakdown, recentDonations, recentLogs } = data;

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, lightColor: "bg-blue-50", textColor: "text-blue-600", trend: "+12%", up: true },
    { label: "Total Donations", value: stats.totalDonations, icon: Package, lightColor: "bg-orange-50", textColor: "text-orange-600", trend: "+8%", up: true },
    { label: "Pickup Requests", value: stats.totalRequests, icon: ClipboardList, lightColor: "bg-purple-50", textColor: "text-purple-600", trend: "+5%", up: true },
    { label: "Food Saved (kg)", value: Number(stats.totalWeightSaved.toFixed(1)), icon: Weight, lightColor: "bg-emerald-50", textColor: "text-emerald-600", trend: "+18%", up: true },
  ];

  const pieData = [
    { name: "Donors", value: userRoles.donors, color: "#f97316" },
    { name: "NGOs", value: userRoles.ngos, color: "#3b82f6" },
    { name: "Admins", value: userRoles.admins, color: "#8b5cf6" },
  ];

  const statusData = Object.entries(donationStatuses).map(([key, value]) => ({
    status: key.charAt(0).toUpperCase() + key.slice(1),
    count: value,
    color: STATUS_COLORS[key.toUpperCase()] || "#94a3b8",
  }));

  const chartMonthly = monthlyDonations.map((m) => ({ ...m, label: formatMonthLabel(m.month) }));

  // ── Sidebar renderer ──
  const renderSidebar = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        Menu
      </p>
      {SIDEBAR_ITEMS.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedMenus.includes(item.id);
        const isActive = activeItem === item.id || item.children?.some((c) => c.id === activeItem);

        return (
          <div key={item.id}>
            <button
              onClick={() => {
                if (hasChildren) {
                  toggleMenu(item.id);
                } else {
                  setActiveItem(item.id);
                  setMobileOpen(false);
                }
              }}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-orange-400" : "text-gray-500 group-hover:text-gray-300"}`} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  )}
                </>
              )}
            </button>
            {hasChildren && isExpanded && sidebarOpen && (
              <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-800 pl-4">
                {item.children!.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => { setActiveItem(child.id); setMobileOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
                      activeItem === child.id
                        ? "text-orange-400 bg-orange-500/5 font-medium"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {child.label}
                  </button>
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
      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="relative w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800 shrink-0">
              <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ShareBite</span>
              <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebar()}
            {/* User card */}
            {user && (
              <div className="border-t border-gray-800 p-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-gray-900 border-r border-gray-800 z-40 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800 shrink-0">
          <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-white">ShareBite</span>}
        </div>

        {renderSidebar()}

        {/* Collapse button */}
        <div className="border-t border-gray-800 p-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors text-sm"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>

        {/* User card */}
        {user && sidebarOpen && (
          <div className="border-t border-gray-800 p-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              {/* Search bar */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 border border-gray-200">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search or type command..."
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
                  readOnly
                />
                <kbd className="hidden md:inline text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
              </button>
              {user && (
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className={`${card.lightColor} p-2.5 rounded-xl`}>
                    <card.icon className={`h-5 w-5 ${card.textColor}`} />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${card.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Donation Trends</h2>
                  <p className="text-sm text-gray-500">Monthly donations over the last 12 months</p>
                </div>
                <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-full">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Performance
                </div>
              </div>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartMonthly}>
                    <defs>
                      <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                    <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2.5} fill="url(#colorDonations)" name="Donations" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900">User Distribution</h2>
                <p className="text-sm text-gray-500">Breakdown by role</p>
              </div>
              <div className="h-55">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={4} strokeWidth={0}>
                      {pieData.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-gray-600">{p.name} ({p.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Charts Row 2 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Food Categories</h2>
                  <p className="text-sm text-gray-500">Donations by food category</p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown.map((c) => ({ ...c, label: formatCategory(c.category) }))} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="count" name="Donations" radius={[0, 6, 6, 0]} barSize={18}>
                      {categoryBreakdown.map((_, idx) => (<Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Donation Status</h2>
                  <p className="text-sm text-gray-500">Current status distribution</p>
                </div>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {statusData.map((s) => {
                  const total = Object.values(donationStatuses).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0";
                  const Icon = STATUS_ICONS[s.status.toUpperCase()] || Package;
                  return (
                    <div key={s.status} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                        <Icon className="h-4 w-4" style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{s.status}</span>
                          <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Recent Donations Table ── */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Recent Donations</h2>
                  <p className="text-sm text-gray-500">Latest food donations on the platform</p>
                </div>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">Last 10</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Donation</th>
                    <th className="px-6 py-3">Donor</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentDonations.map((d) => {
                    const StatusIcon = STATUS_ICONS[d.status] || Package;
                    const statusColor = STATUS_COLORS[d.status] || "#94a3b8";
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900 truncate max-w-50">{d.title}</p></td>
                        <td className="px-6 py-4 text-sm text-gray-600">{d.donor.name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{formatCategory(d.category)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{d.city}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.quantity}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                            <StatusIcon className="h-3 w-3" />{d.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(d.createdAt)}</td>
                      </tr>
                    );
                  })}
                  {recentDonations.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No donations yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Audit Logs ── */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500">Latest admin audit logs</p>
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">Audit Trail</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    {log.details && <p className="text-xs text-gray-500 truncate">{log.details}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-600">{log.admin.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-400">No audit logs yet</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
