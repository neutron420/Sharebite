"use client";

import { useEffect, useState, useCallback } from "react";
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
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Activity,
  Bike,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Label,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
  pendingReports: number;
  pendingVerifications: number;
  hiveViolations: number;
}

interface UserRoles {
  donors: number;
  ngos: number;
  admins: number;
  community: number;
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

interface DashboardData {
  stats: Stats;
  userRoles: UserRoles;
  deliveryStats: {
    activeRiders: number;
    assignedTasks: number;
    onTheWayTasks: number;
  };
  donationStatuses: DonationStatuses;
  monthlyDonations: MonthlyDonation[];
  categoryBreakdown: CategoryBreakdown[];
  recentDonations: RecentDonation[];
  recentLogs: AuditLog[];
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

function formatCategory(c: string) {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleDateString("en-US", { month: "long" });
}

// ── Animated Counter Component ──────────────────
function AnimatedCounter({ value, label, icon: Icon, color, limit = 4 }: { 
  value: number; 
  label: string; 
  icon: any; 
  color: string;
  limit?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 1000;
    let increment = end / (totalDuration / 16);
    
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const isCapped = displayValue > limit;
  const displayText = isCapped ? `${limit}+` : displayValue;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150`} style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between relative z-10">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {isCapped && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 animate-pulse">
            URGENT
          </span>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <p className={`text-3xl font-black transition-all duration-300 ${isCapped ? 'text-red-500 scale-110' : 'text-gray-900'}`}>
          {displayText}
        </p>
        <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
      <div className="flex items-center justify-center h-96">
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
  const { stats, userRoles, donationStatuses, monthlyDonations, categoryBreakdown, recentDonations, recentLogs, deliveryStats } = data;

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
    { name: "Community", value: userRoles.community, color: "#ec4899" },
  ];

  const statusData = Object.entries(donationStatuses).map(([key, value]) => ({
    status: key.charAt(0).toUpperCase() + key.slice(1),
    count: value,
    color: STATUS_COLORS[key.toUpperCase()] || "#94a3b8",
  }));

  const chartMonthly = monthlyDonations.map((m) => ({ ...m, label: formatMonthLabel(m.month) }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ── Actionable Alerts (Lively Counters) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCounter 
          value={stats.pendingReports} 
          label="Pending Reports" 
          icon={AlertCircle} 
          color="#ef4444" 
        />
        <AnimatedCounter 
          value={stats.pendingVerifications} 
          label="NGO Verifications" 
          icon={ShieldCheck} 
          color="#3b82f6" 
        />
        <AnimatedCounter 
          value={stats.hiveViolations || 0} 
          label="Hive Guard Alerts" 
          icon={ShieldAlert} 
          color="#ef4444" 
          limit={0}
        />
        <AnimatedCounter 
          value={deliveryStats?.onTheWayTasks || 0} 
          label="Active Deliveries" 
          icon={Bike} 
          color="#f97316" 
        />
        <div className="bg-orange-500 rounded-2xl p-5 flex flex-col justify-between text-white lg:col-span-2 group cursor-pointer hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
           <div className="flex items-center justify-between">
              <div className="bg-white/20 p-2 rounded-xl">
                 <Package className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
           </div>
           <div className="mt-4">
              <p className="text-sm font-medium opacity-80">Quick Action</p>
              <p className="text-xl font-bold">Review New Donations</p>
           </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`${card.lightColor} p-2.5 rounded-xl`}>
                <card.icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600`}>
                <ArrowUpRight className="h-3 w-3" />
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
          <div className="h-72">
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-gray-900">User Distribution</h2>
            <p className="text-sm text-gray-500">Breakdown by current roles</p>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-200 p-2.5 rounded-xl shadow-sm border-gray-200">
                          <p className="text-xs font-semibold text-gray-900">{payload[0].name}</p>
                          <p className="text-xs text-gray-500 font-medium">Quantity: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  strokeWidth={5}
                  stroke="#fff"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const totalUsers = pieData.reduce((acc, curr) => acc + curr.value, 0);
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-gray-900 text-3xl font-bold"
                            >
                              {totalUsers.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-gray-500 text-sm font-medium"
                            >
                              Users
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-4">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-medium text-gray-600">{p.name} ({p.value})</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium text-gray-900">
              Community growth active <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="leading-none text-gray-500">
              Showing total community distribution
            </div>
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
          <div className="h-64">
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Monthly Analysis</h2>
              <p className="text-sm text-gray-500">Donation radar for last 12 months</p>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartMonthly}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} />
                <Radar
                   name="Donations"
                   dataKey="count"
                   stroke="#f97316"
                   fill="#f97316"
                   fillOpacity={0.5}
                 />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "12px", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-xs text-gray-500">
             <div className="h-3 w-3 rounded-full bg-orange-500" />
             <span>Active Monthly Donations</span>
          </div>
        </div>
      </div>

      {/* ── Status Breakdown ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Donation Status</h2>
              <p className="text-sm text-gray-500">Current status distribution</p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statusData.map((s) => {
              const total = Object.values(donationStatuses).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0";
              const Icon = STATUS_ICONS[s.status.toUpperCase()] || Package;
              return (
                <div key={s.status} className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: s.color }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">{pct}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.status}</p>
                    <p className="text-lg font-bold text-gray-900">{s.count}</p>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
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
                    <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900 truncate max-w-48">{d.title}</p></td>
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
    </div>
  );
}
