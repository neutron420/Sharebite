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
  Trash2,
  Package,
  MessageSquare,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export default function DonorNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to update.");
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      toast.success("Signed out successfully");
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
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading Alerts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic underline decoration-orange-600/10 underline-offset-8">
                 Alerts
              </h1>
              <p className="text-slate-400 font-bold">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
              </p>
            </motion.div>
            {unreadCount > 0 && (
               <button 
                  onClick={markAllAsRead}
                  className="group px-6 py-3 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest"
               >
                  <CheckCheck className="w-5 h-5" /> Mark All Read
               </button>
            )}
          </header>

          <div className="space-y-3">
            <AnimatePresence>
              {notifications.length > 0 ? (
                notifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => notif.link && router.push(notif.link)}
                    className={`group p-6 rounded-[2rem] border flex items-start gap-5 transition-all cursor-pointer ${
                      !notif.isRead 
                        ? 'bg-orange-50/30 border-orange-200/50 hover:border-orange-300 shadow-lg shadow-orange-50/50' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-orange-100' : 'bg-slate-50'}`}>
                       {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          {!notif.isRead && <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />}
                          <h4 className="font-black text-base tracking-tight truncate">{notif.title}</h4>
                       </div>
                       <p className="text-sm font-bold text-slate-500 leading-relaxed">{notif.message}</p>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 block">
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
                   <h4 className="font-black text-xl">No notifications yet</h4>
                   <p className="text-slate-400 text-sm font-bold mt-2 max-w-sm">When NGOs request your donations or logistics updates happen, you&apos;ll see them here.</p>
                </div>
              )}
            </AnimatePresence>

            {notifications.length > itemsPerPage && (
              <Pagination className="mt-12 bg-white/50 border border-slate-100 p-4 rounded-3xl">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }} 
                       className={currentPage === 1 ? "pointer-events-none opacity-50 text-slate-300" : "cursor-pointer text-orange-600 hover:text-orange-700 bg-white shadow-sm border-slate-100 rounded-xl px-4"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.ceil(notifications.length / itemsPerPage) }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                        isActive={currentPage === i + 1}
                        className={cn(
                          "cursor-pointer rounded-xl font-black w-10 h-10 flex items-center justify-center transition-all",
                          currentPage === i + 1 
                            ? "bg-orange-600 text-white shadow-xl shadow-orange-100 border-none scale-110" 
                            : "bg-white text-slate-400 hover:text-slate-900 border-slate-100"
                        )}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(notifications.length / itemsPerPage)) setCurrentPage(currentPage + 1); }}
                       className={currentPage === Math.ceil(notifications.length / itemsPerPage) ? "pointer-events-none opacity-50 text-slate-300" : "cursor-pointer text-orange-600 hover:text-orange-700 bg-white shadow-sm border-slate-100 rounded-xl px-4"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
    </div>
  );
}


