"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Bell, 
  CheckCheck,
  Package,
  MessageSquare,
  Loader2,
  Trash2,
  Clock
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
      toast.error("Failed to update status.");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
      toast.success("Transmission History Purged");
    } catch (e) {
      toast.error("Failed to purge logs.");
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
        <Loader2 className="w-10 sm:w-12 h-10 sm:h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accessing Logs...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 sm:space-y-10 py-4 sm:py-6 italic">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 underline decoration-orange-600/10 underline-offset-8 uppercase">
             Alerts
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest max-w-xs sm:max-w-none">Real-time operation updates and humanitarian alerts.</p>
        </motion.div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-3.5 sm:py-3 bg-white border border-slate-100 text-slate-900 font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm active:scale-95 text-[9px] sm:text-[10px] uppercase tracking-widest"
            >
              <CheckCheck className="w-4 h-4 shrink-0" /> <span className="truncate">Mark Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-3.5 sm:py-3 bg-slate-950 text-white font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-red-600 transition-all shadow-xl active:scale-95 text-[9px] sm:text-[10px] uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4 shrink-0" /> <span className="truncate">Clear logs</span>
            </button>
          )}
        </div>
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
              className={`p-5 sm:p-6 rounded-3xl sm:rounded-[2.5rem] border flex items-start gap-4 sm:gap-5 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-orange-50/50 group ${
                !notif.isRead 
                  ? 'bg-orange-50/20 border-orange-200/40 hover:border-orange-300' 
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border transition-all ${!notif.isRead ? 'bg-orange-100 border-orange-200 shadow-sm' : 'bg-slate-50 border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100'}`}>
                 {getNotifIcon(notif.type)}
              </div>
              <div className="flex-grow min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse shrink-0" />}
                    <h4 className="font-black text-lg sm:text-xl tracking-tighter group-hover:text-orange-600 transition-colors uppercase truncate italic">{notif.title}</h4>
                 </div>
                 <p className="text-xs sm:text-sm font-bold text-slate-500 leading-relaxed mb-3 line-clamp-2">{notif.message}</p>
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(notif.createdAt))} ago
                 </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 sm:p-20 rounded-3xl sm:rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center italic">
             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10" />
             </div>
             <h4 className="font-black text-lg sm:text-xl uppercase tracking-tight text-slate-950">No logs found</h4>
             <p className="text-slate-400 text-[10px] font-bold mt-2 max-w-sm uppercase tracking-widest leading-relaxed">Notifications will appear here when operations update or donors respond.</p>
          </div>
        )}
      </div>
    </div>
  );
}
