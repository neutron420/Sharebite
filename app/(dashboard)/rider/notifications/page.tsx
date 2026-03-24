"use client";

import React, { useEffect, useState } from "react";
import { 
  Bell, 
  Loader2,
  Trash2,
  CheckCircle2,
  Info,
  AlertTriangle,
  Zap,
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function RiderCommsLogPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Comms offline.");
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      toast.error("Failed to sync notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success("Read all notifications.");
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification removed.");
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-gray-500 text-sm">Loading notifications...</span>
    </div>
  );

  return (
    <div className="w-full space-y-10 pb-20 text-gray-900">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-none">
             Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-2">Historical log of mission updates and system alerts.</p>
        </motion.div>
        
        <button 
          onClick={markAllRead}
          className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md active:scale-95"
        >
          Mark all as read
        </button>
      </header>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {notifications.map((notif, i) => (
              <motion.div 
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group p-6 rounded-3xl bg-white border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 shadow-sm relative overflow-hidden ${!notif.isRead ? 'border-l-4 border-l-orange-600' : ''}`}
              >
                {!notif.isRead && (
                   <div className="absolute top-0 right-0 w-2 h-full bg-orange-600/5" />
                )}
                
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-50 shrink-0 group-hover:scale-105 transition-transform duration-300 ${
                    notif.type === 'ALERT' ? 'bg-rose-50 text-rose-500' : 
                    notif.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-500' : 
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {notif.type === 'ALERT' ? <AlertTriangle className="w-6 h-6" /> : 
                     notif.type === 'SUCCESS' ? <CheckCircle2 className="w-6 h-6" /> : 
                     <Info className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-gray-900">{notif.title}</h4>
                      {!notif.isRead && <Badge className="bg-orange-600 text-white border-none text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">NEW</Badge>}
                    </div>
                    <p className="text-sm font-medium text-gray-500 max-w-xl leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-4 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                       <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-orange-500" /> {format(new Date(notif.createdAt), "PPP")}</span>
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-500" /> {format(new Date(notif.createdAt), "p")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteNotif(notif.id)}
                    className="p-3.5 rounded-xl bg-gray-50 text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className="p-3.5 rounded-xl bg-gray-900 text-white hover:bg-orange-600 transition-all shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="p-24 rounded-[3rem] bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-200" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-1">No Notifications</h3>
             <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">You're all caught up! New updates will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
