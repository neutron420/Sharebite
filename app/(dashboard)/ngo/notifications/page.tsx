"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  History, 
  Plus,
  LayoutDashboard,
  LogOut,
  Loader2,
  Check,
  CheckCheck,
  Package,
  MessageSquare,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function NgoNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success("Operations Log Updated");
    } catch (e) {
      toast.error("Failed to update.");
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      router.push("/login");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    switch(type) {
      case "REQUEST_STATUS": return <Package className="w-5 h-5 text-orange-500" />;
      case "CHAT_MESSAGE": return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accessing Logs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex selection:bg-orange-100">
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-slate-100 bg-white z-50 flex flex-col items-center md:items-stretch py-10 px-4">
        <div className="px-2 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100  font-black text-white text-xl">N</div>
            <span className="hidden md:block text-xl font-black tracking-tighter">NGO OP-CENTER</span>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
           <SidebarItem icon={<LayoutDashboard />} label="Dashboard" link="/ngo" />
           <SidebarItem icon={<Package />} label="My Pickups" link="/ngo/requests" />
           <SidebarItem icon={<Search />} label="Find Food" link="/donations" />
           <SidebarItem icon={<Bell />} label="Alerts" active link="/ngo/notifications" />
        </nav>

        <button onClick={handleSignOut} className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-orange-600 transition-colors font-bold text-sm">
           <LogOut className="w-5 h-5" />
           <span className="hidden md:block uppercase tracking-wider">Disconnect</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-20 md:pl-64 pt-12 pb-24 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2  underline decoration-orange-600/10 underline-offset-8">
                 Alerts
              </h1>
              <p className="text-slate-400 font-bold">Real-time operation updates and humanitarian alerts.</p>
            </motion.div>
            {unreadCount > 0 && (
               <button 
                  onClick={markAllAsRead}
                  className="px-6 py-3 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest"
               >
                  <CheckCheck className="w-5 h-5" /> Clear Logs
               </button>
            )}
          </header>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => notif.link && router.push(notif.link)}
                  className={`p-6 rounded-[2rem] border flex items-start gap-5 transition-all cursor-pointer ${
                    !notif.isRead 
                      ? 'bg-orange-50/20 border-orange-200/40 hover:border-orange-300' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-orange-100' : 'bg-slate-50'}`}>
                     {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-grow">
                     <div className="flex items-center gap-2 mb-1">
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-orange-600" />}
                        <h4 className="font-black text-lg tracking-tight leading-none">{notif.title}</h4>
                     </div>
                     <p className="text-sm font-bold text-slate-500 leading-relaxed mb-2">{notif.message}</p>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {formatDistanceToNow(new Date(notif.createdAt))} ago
                     </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-20 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                    <Bell className="w-10 h-10" />
                 </div>
                 <h4 className="font-black text-xl">No logs found</h4>
                 <p className="text-slate-400 text-sm font-bold mt-2 max-w-sm">You&apos;ll be notified here when donors approve your requests or operations update.</p>
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, link = "#" }: { icon: React.ReactNode, label: string, active?: boolean, link?: string }) {
  return (
    <Link 
      href={link}
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
        active ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <div className={`flex justify-center items-center [&>svg]:w-6 [&>svg]:h-6 ${active ? 'text-white' : 'text-slate-400 group-hover:text-orange-600'}`}>
        {icon}
      </div>
      <span className={`font-black text-[13px] tracking-tight uppercase hidden md:block ${active ? 'text-white' : 'group-hover:text-slate-900'}`}>{label}</span>
    </Link>
  );
}
