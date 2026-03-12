"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Package,
  User,
  AlertTriangle,
  Info,
  Trash2,
  Check,
  CheckCheck,
  Filter,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Notification {
  id: string;
  type: "REQUEST_STATUS" | "NEW_DONATION" | "URGENT_EXPIRY" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: typeof Bell }> = {
  REQUEST_STATUS: { bg: "bg-blue-50", text: "text-blue-600", icon: Package },
  NEW_DONATION: { bg: "bg-green-50", text: "text-green-600", icon: Package },
  URGENT_EXPIRY: { bg: "bg-red-50", text: "text-red-600", icon: AlertTriangle },
  SYSTEM: { bg: "bg-purple-50", text: "text-purple-600", icon: Info },
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [wsConnected, setWsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      setNotifications(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    const connectWebSocket = async () => {
      if (isUnmounted) return;
      
      try {
        // Get token from cookie or session
        const tokenRes = await fetch("/api/auth/token", { credentials: "include" });
        if (!tokenRes.ok) {
          console.log("No token available for WebSocket");
          return;
        }
        const { token } = await tokenRes.json();

        const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

        ws.onopen = () => {
          console.log("WebSocket connected");
          if (!isUnmounted) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "NOTIFICATION") {
              const notification = data.payload as Notification;
              setNotifications((prev) => [notification, ...prev]);
            }
          } catch (err) {
            console.error("WebSocket message error:", err);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          if (!isUnmounted) {
            setWsConnected(false);
            // Reconnect after 10 seconds
            reconnectTimeout = setTimeout(connectWebSocket, 10000);
          }
        };

        ws.onerror = (err) => {
          console.log("WebSocket error:", err);
          if (!isUnmounted) setWsConnected(false);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("WebSocket connection error:", err);
        // Try reconnect after 10 seconds
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 10000);
        }
      }
    };

    fetchNotifications();
    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    try {
      await fetch("/api/admin/notifications/clear", {
        method: "DELETE",
        credentials: "include",
      });
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  // Filter notifications
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4 border border-gray-200">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="text-gray-500">{error}</p>
          <button onClick={fetchNotifications} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${wsConnected ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {wsConnected ? "Live" : "Offline"}
          </div>
          
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border ${soundEnabled ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-gray-50 border-gray-200 text-gray-400"}`}
            title={soundEnabled ? "Sound On" : "Sound Off"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button onClick={fetchNotifications} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="REQUEST_STATUS">Request Status</option>
            <option value="NEW_DONATION">New Donations</option>
            <option value="URGENT_EXPIRY">Urgent Expiry</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filtered.map((notification) => {
              const style = TYPE_STYLES[notification.type] || TYPE_STYLES.SYSTEM;
              const Icon = style.icon;

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-orange-50/30" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg shrink-0 ${style.bg}`}>
                      <Icon className={`h-5 w-5 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                          )}
                          <span className="text-xs text-gray-400">{formatDate(notification.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {notification.type.replace(/_/g, " ")}
                        </span>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                          >
                            View Details →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
