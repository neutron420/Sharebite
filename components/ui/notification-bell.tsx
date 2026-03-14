import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
   const [notifications, setNotifications] = useState<any[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [unreadCount, setUnreadCount] = useState(0);
   const router = useRouter();

   useEffect(() => {
      fetchNotifications();
      // Polling every 30 seconds for new alerts
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
   }, []);

   const fetchNotifications = async () => {
      try {
         const res = await fetch("/api/notifications");
         if (res.ok) {
            const data = await res.json();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
         }
      } catch (e) {
         console.error(e);
      }
   };

   const markAllAsRead = async () => {
      try {
         await fetch("/api/notifications", { method: "PATCH" });
         setUnreadCount(0);
         setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      } catch (e) {
         console.error(e);
      }
   };

   const handleNotificationClick = (notification: any) => {
      setIsOpen(false);
      if (notification.link) {
         router.push(notification.link);
      }
   };

   return (
      <div className="relative">
         <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 bg-slate-50 hover:bg-orange-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 transition-colors relative"
         >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-600 text-[9px] text-white font-black items-center justify-center border-2 border-white">
                     {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
               </span>
            )}
         </button>

         {isOpen && (
            <>
               <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
               <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                     <h4 className="font-black tracking-tight text-sm">Notifications</h4>
                     {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700">
                           Mark all read
                        </button>
                     )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                     {notifications.length > 0 ? (
                        notifications.map((notif: any) => (
                           <div 
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 flex gap-3 ${!notif.isRead ? 'bg-orange-50/20' : ''}`}
                           >
                              {!notif.isRead && (
                                 <div className="w-2 h-2 rounded-full bg-orange-600 shrink-0 mt-1.5" />
                              )}
                              <div className="flex-grow">
                                 <h5 className="text-xs font-black tracking-tight mb-0.5">{notif.title}</h5>
                                 <p className="text-[10px] font-bold text-slate-500 leading-snug">{notif.message}</p>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2 block">
                                    {formatDistanceToNow(new Date(notif.createdAt))} ago
                                 </span>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold">
                           You're all caught up!
                        </div>
                     )}
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
