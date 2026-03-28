"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Loader2,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Plus,
  ShieldCheck,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiAward, FiCheckCircle, FiClock, FiX } from "react-icons/fi";
import DonationList from "@/components/ui/donation-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import LiveRiderMap from "@/components/ui/live-rider-map";
import { useSocket } from "@/components/providers/socket-provider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DonorStats {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  totalWeightDonated: number;
  userName?: string;
}

interface DonorNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string | null;
}

interface BadgeSpotlight {
  id: string;
  notificationId: string;
  badgeName: string;
  message: string;
  createdAt: string;
}

function extractBadgeName(title: string) {
  const match = title.replace("🏅", "").trim().match(/Badge Unlocked:\s*(.+?)(?:!|$)/i);
  return match?.[1]?.trim() || "New Achievement";
}

function toBadgeSpotlight(notification: DonorNotification): BadgeSpotlight | null {
  if (notification.type !== "SYSTEM" || !notification.title?.includes("Badge Unlocked")) {
    return null;
  }

  return {
    id: `${notification.id}:${notification.createdAt}`,
    notificationId: notification.id,
    badgeName: extractBadgeName(notification.title),
    message: notification.message,
    createdAt: notification.createdAt,
  };
}

function mergeBadgeSpotlights(
  current: BadgeSpotlight[],
  incoming: Array<BadgeSpotlight | null>,
) {
  const deduped = new Map<string, BadgeSpotlight>();

  [...current, ...incoming.filter(Boolean)].forEach((spotlight) => {
    if (!spotlight) {
      return;
    }

    deduped.set(spotlight.notificationId, spotlight);
  });

  return Array.from(deduped.values()).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export default function DonorDashboard() {
  const router = useRouter();
  const { addListener } = useSocket();
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [liveOps, setLiveOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Hero");
  const [badgeSpotlights, setBadgeSpotlights] = useState<BadgeSpotlight[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const handleStartChat = async (donationId: string, participantId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, participantId }),
      });
      
      if (res.ok) {
        const conversation = await res.json();
        router.push(`/donor/messages?id=${conversation.id}`);
      } else {
        const error = await res.json();
        toast.error("Failed to start chat", { description: error.message });
      }
    } catch (err) {
      toast.error("Something went wrong joining the ops channel.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const statsRes = await fetch("/api/donor/stats");
        
        if (statsRes.status === 401) {
            router.push("/login");
            return;
        }
        
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
            if (statsData.userName) setUserName(statsData.userName);
        }

        const myDonationsRes = await fetch("/api/donations");
        if (myDonationsRes.ok) {
            const data = await myDonationsRes.json();
            setRecentItems(data);
            const active = data.filter((d: any) => 
               d.requests?.some((r: any) => 
                  (r.status === "APPROVED" || r.status === "ON_THE_WAY" || r.status === "COLLECTED") && 
                  r.status !== "COMPLETED"
               )
            );
            setLiveOps(active);
        }

        const notificationsRes = await fetch("/api/notifications");
        if (notificationsRes.ok) {
          const notificationsData: DonorNotification[] = await notificationsRes.json();
          const unreadBadgeSpotlights = notificationsData
            .filter((notification) => !notification.isRead)
            .map(toBadgeSpotlight);
          setBadgeSpotlights((previous) => mergeBadgeSpotlights(previous, unreadBadgeSpotlights));
        }

      } catch (error: any) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  useEffect(() => {
    const unsubscribe = addListener("NOTIFICATION", (payload) => {
      const spotlight = toBadgeSpotlight(payload as DonorNotification);
      if (spotlight) {
        setBadgeSpotlights((previous) => mergeBadgeSpotlights(previous, [spotlight]));
      }
    });

    return () => unsubscribe();
  }, [addListener]);

  const activeBadgeSpotlight = badgeSpotlights[0] || null;

  useEffect(() => {
    if (activeBadgeSpotlight) {
      confetti({
        particleCount: 120,
        spread: 85,
        startVelocity: 35,
        origin: { y: 0.28 },
        colors: ["#f97316", "#fb923c", "#facc15", "#ffffff"],
      });
    }
  }, [activeBadgeSpotlight]);

  const markBadgeNotificationRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (error) {
      console.error("Failed to mark badge notification as read", error);
    }
  };

  const dismissBadgeSpotlight = async () => {
    if (activeBadgeSpotlight) {
      setBadgeSpotlights((previous) =>
        previous.filter((spotlight) => spotlight.notificationId !== activeBadgeSpotlight.notificationId),
      );
      await markBadgeNotificationRead(activeBadgeSpotlight.notificationId);
    }
  };

  const openBadgeSpotlight = async () => {
    if (activeBadgeSpotlight) {
      const id = activeBadgeSpotlight.notificationId;
      setBadgeSpotlights((previous) =>
        previous.filter((spotlight) => spotlight.notificationId !== id),
      );
      await markBadgeNotificationRead(id);
      router.push("/donor/profile#badges-gallery");
    }
  };

  const statCards = [
    { label: "Food Rescued", value: `${stats?.totalWeightDonated || 0} kg`, icon: UtensilsCrossed, trend: "Impact Live", colorClass: "text-orange-600" },
    { label: "Active Shares", value: stats?.activeDonations || 0, icon: Users, trend: "Active Hub", colorClass: "text-slate-900" },
    { label: "Karma Points", value: ((stats?.totalDonations || 0) * 150).toLocaleString(), icon: TrendingUp, trend: "Level 01", colorClass: "text-orange-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Mission Logs...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 underline decoration-orange-600/10 underline-offset-8 leading-tight">
             Salute, {userName}! 👋
          </h1>
          <p className="text-xs sm:text-base text-slate-400 font-bold">Your donations have impacted hundreds of lives today.</p>
        </motion.div>
        <Link href="/donor/donate" className="group w-full sm:w-fit px-8 py-5 sm:py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest">
          Share Surplus <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </Link>
      </header>

      <AnimatePresence>
        {activeBadgeSpotlight && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            className="fixed inset-x-4 top-24 z-50 md:left-auto md:right-6 md:w-[24rem]"
          >
            <Alert
              className="overflow-hidden rounded-[2rem] border-emerald-200/80 bg-[linear-gradient(135deg,#f0fdf4_0%,#dcfce7_58%,#bbf7d0_100%)] p-4 pr-12 shadow-2xl shadow-emerald-200/70"
            >
              <FiAward className="left-4 top-4 h-5 w-5 text-emerald-700" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-lime-400" />
              <button
                type="button"
                onClick={dismissBadgeSpotlight}
                className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-emerald-700 transition hover:bg-white"
              >
                <FiX className="h-4 w-4" />
              </button>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTitle className="mb-0 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">Badge Unlocked</AlertTitle>
                  {badgeSpotlights.length > 1 && (
                    <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">+{badgeSpotlights.length - 1} more</span>
                  )}
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 shadow-sm shadow-emerald-100/80">
                  <p className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-950"><FiCheckCircle className="h-4 w-4 text-emerald-600" />{activeBadgeSpotlight.badgeName}</p>
                  <AlertDescription className="mt-1 text-xs font-semibold text-slate-600">{activeBadgeSpotlight.message}</AlertDescription>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700/80"><FiClock className="h-3.5 w-3.5" />{formatDistanceToNow(new Date(activeBadgeSpotlight.createdAt), { addSuffix: true })}</p>
                  <button type="button" onClick={openBadgeSpotlight} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700">View <FiArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {liveOps.length > 0 && (
        <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-orange-600"><ShieldCheck className="w-8 h-8" /> Live Operations</h2>
            <Badge className="bg-orange-50 text-orange-600 border-none font-black">{liveOps.length} Active</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveOps.map((donation, i) => {
               const approvedReq = donation.requests?.find((r: any) => 
                  ["APPROVED", "ASSIGNED", "ON_THE_WAY", "COLLECTED"].includes(r.status)
               );
               const isTracking = approvedReq && approvedReq.riderId && ["ASSIGNED", "ON_THE_WAY"].includes(approvedReq.status);

               return (
                 <motion.div key={donation.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="flex flex-col gap-4">
                   <div 
                     className="p-8 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden group shadow-2xl border border-white/10 cursor-pointer"
                     onClick={() => router.push(`/donor/donations/${donation.id}`)}
                   >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl" />
                     <div className="relative z-10 flex flex-col gap-6">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                             <Truck className="w-5 h-5 text-orange-400" />
                           </div>
                           <div>
                             <h3 className="font-black text-lg tracking-tight truncate max-w-[150px]">{donation.title}</h3>
                             <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">{approvedReq?.ngo?.name || "Verified NGO"}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleStartChat(donation.id, approvedReq?.ngoId || "");
                             }}
                             className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-orange-600 transition-all flex items-center justify-center border border-white/20 group/msg"
                           >
                             <MessageSquare className="w-5 h-5 text-white group-hover/msg:scale-110 transition-transform" />
                           </button>
                           <div className="text-right">
                             <p className="text-[10px] uppercase font-black tracking-widest text-orange-400 mb-1">Status</p>
                             <div className="flex items-center gap-2 justify-end">
                               <ShieldCheck className="w-4 h-4 text-green-500" />
                               <p className="text-xl font-black tracking-tight uppercase">{approvedReq?.status === 'ON_THE_WAY' ? 'En Route' : 'Assigned'}</p>
                             </div>
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                         <Badge className="bg-orange-600 text-white border-none py-1 px-3">{approvedReq?.status}</Badge>
                         <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {donation.city}</span>
                         <span className="text-orange-400 animate-pulse ml-auto flex items-center gap-2"><Navigation className="w-3 h-3" /> Click for details & PIN</span>
                       </div>
                     </div>
                   </div>
                   {isTracking && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[250px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg relative bg-slate-50">
                        <LiveRiderMap riderId={approvedReq.riderId} riderName={approvedReq.rider?.name || "Rider"} donorCoords={[donation.longitude, donation.latitude]} ngoCoords={[approvedReq.ngo.longitude, approvedReq.ngo.latitude]} status={approvedReq.status} />
                        <div className="absolute bottom-4 left-6 z-10"><Badge className="bg-black/80 text-white backdrop-blur-md border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Live Pursuit Grid</Badge></div>
                     </motion.div>
                   )}
                 </motion.div>
               );
            })}
          </div>
        </motion.section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-slate-100 hover:border-orange-200 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/20">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 transition-all duration-500 ${stat.colorClass} shadow-inner shrink-0`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tighter leading-none mb-1">{stat.value}</h3>
                  <p className="text-slate-400 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">{stat.label}</p>
                  <div className="mt-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[9px] sm:text-[10px] font-black uppercase text-green-600 tracking-widest">{stat.trend}</span></div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 border-l-4 border-slate-950">
            <div>
               <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-slate-950">Mission Audit Feed</h2>
               <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Comprehensive logs of all sharing operations</p>
            </div>
            <Link href="/donor/donations" className="w-fit px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-all shadow-sm">Full Archive &rarr;</Link>
          </div>
          <div className="space-y-4">
            {recentItems.length > 0 ? (
              <>
                <DonationList donations={recentItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)} className="rounded-[2.5rem] border border-slate-100 shadow-xl shadow-orange-50/20 bg-white" />
                {recentItems.length > itemsPerPage && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                      {Array.from({ length: Math.ceil(recentItems.length / itemsPerPage) }).map((_, i) => (
                        <PaginationItem key={i}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }} isActive={currentPage === i + 1} className="cursor-pointer">{i + 1}</PaginationLink></PaginationItem>
                      ))}
                      <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(recentItems.length / itemsPerPage)) setCurrentPage(currentPage + 1); }} className={currentPage === Math.ceil(recentItems.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="p-10 sm:p-20 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300"><Plus className="w-8 h-8" /></div>
                 <h4 className="font-black text-lg">No active shipments</h4>
                 <p className="text-slate-400 text-sm font-bold mt-1 max-w-[280px]">You haven&apos;t shared any surplus recently. Start your first mission today.</p>
                 <Link href="/donor/donate" className="mt-8 px-10 py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-950 transition-all shadow-xl shadow-orange-100 italic">Post Donation</Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[3rem] border border-slate-100 bg-white relative overflow-hidden shadow-xl shadow-orange-50/30">
             <div className="absolute top-0 right-0 h-32 w-32 bg-orange-100/70 blur-3xl" />
             <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 text-orange-600"><UserRound className="w-6 h-6" /></div>
                <h3 className="text-2xl font-black italic mb-4 tracking-tighter text-slate-950">Profile Center</h3>
                <p className="text-slate-500 text-[10px] font-bold mb-10 uppercase tracking-[0.2em]">Your account details, badges, and journey now live in one place.</p>
                <Link href="/donor/profile" className="w-full inline-flex items-center justify-center gap-3 py-5 bg-slate-950 text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 uppercase text-[10px] tracking-widest">Open Profile <ArrowRight className="w-4 h-4" /></Link>
             </div>
          </div>
          <div className="p-8 rounded-[3rem] border border-slate-100 bg-white flex flex-col items-center text-center group hover:border-orange-200 transition-all">
             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4"><Calendar className="w-6 h-6 text-slate-400 group-hover:text-orange-600" /></div>
             <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Recurring Logistics</h4>
             <p className="text-xs font-bold text-slate-400">Schedule your weekly surplus pickups to automate your impact.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
