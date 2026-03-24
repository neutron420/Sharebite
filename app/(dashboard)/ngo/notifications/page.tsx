"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Bell, 
  CheckCheck,
  Package,
  MessageSquare,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function NgoNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success("Operations Log Updated");
    } catch (e) {
      toast.error("Failed to update.");
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
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accessing Logs...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 underline decoration-orange-600/10 underline-offset-8">
             Alerts
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Real-time operation updates and humanitarian alerts.</p>
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

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => notif.link && router.push(notif.link)}
              className={`p-6 rounded-[2.5rem] border flex items-start gap-5 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-orange-50/50 group ${
                !notif.isRead 
                  ? 'bg-orange-50/20 border-orange-200/40 hover:border-orange-300' 
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${!notif.isRead ? 'bg-orange-100 border-orange-200' : 'bg-slate-50 border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100'}`}>
                 {getNotifIcon(notif.type)}
              </div>
              <div className="flex-grow">
                 <div className="flex items-center gap-2 mb-1">
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />}
                    <h4 className="font-black text-xl tracking-tighter group-hover:text-orange-600 transition-colors">{notif.title}</h4>
                 </div>
                 <p className="text-sm font-bold text-slate-500 leading-relaxed mb-3">{notif.message}</p>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {formatDistanceToNow(new Date(notif.createdAt))} ago
                 </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-20 rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                <Bell className="w-10 h-10" />
             </div>
             <h4 className="font-black text-xl uppercase tracking-tight text-slate-950">No logs found</h4>
             <p className="text-slate-400 text-sm font-bold mt-2 max-w-sm uppercase tracking-widest text-[10px]">You&apos;ll be notified here when donors approve your requests or operations update.</p>
          </div>
        )}
      </div>
    </div>
  );
}
