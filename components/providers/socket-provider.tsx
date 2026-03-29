"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  addListener: (type: string, callback: (payload: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  addListener: () => () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children, initialToken }: { children: React.ReactNode; initialToken?: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listeners = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | undefined>(initialToken);

  const connect = useCallback(async () => {
    const startTime = performance.now();
    try {
      let token = tokenRef.current;
      
      if (!token) {
        console.log("📡 No initial token, fetching via API...");
        const res = await fetch("/api/auth/token");
        if (!res.ok) return;
        const data = await res.json();
        token = data.token;
      } else {
        console.log("⚡ Tactical Pre-Seeded Token Found");
      }
      
      if (!token) return;

      let wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
      if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
        // Remove 'www.' if present to avoid 'ws.www.domain.com'
        const baseHost = window.location.hostname.replace(/^www\./, "");
        wsBaseUrl = `wss://ws.${baseHost}`;
      }
      const wsUrl = `${wsBaseUrl}?token=${token}`;
      console.log(`🔌 Attempting Tactical Connection: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      // 💓 Heartbeat to keep connection alive on mobile/flaky networks
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "HEARTBEAT" }));
        }
      }, 30000);

      ws.onopen = () => {
        const duration = performance.now() - startTime;
        console.log(`✅ WebSocket Tactical Link Established in ${duration.toFixed(0)}ms`);
        setIsConnected(true);
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          if (type === "HEARTBEAT_ACK") return; // Ignore heartbeat responses
          const typeListeners = listeners.current.get(type);
          if (typeListeners) {
            typeListeners.forEach((callback) => callback(payload));
          }
        } catch (err) {
          console.error("WebSocket message error:", err);
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        setIsConnected(true); // Temporarily set so we don't show "disconnected" immediately if it's transient
        setIsConnected(false);
        setSocket(null);
        console.log("WebSocket Disconnected. Reconnecting in 1.5s...");
        reconnectTimeout.current = setTimeout(connect, 1500);
      };

      ws.onerror = (err) => {
        clearInterval(heartbeatInterval);
        console.error("WebSocket Error:", err);
        ws.close();
      };

      setSocket(ws);
    } catch (err) {
      console.error("WebSocket Connection Error:", err);
      reconnectTimeout.current = setTimeout(connect, 5000);
    }
  }, []);

  const addListener = useCallback((type: string, callback: (payload: any) => void) => {
    if (!listeners.current.has(type)) {
      listeners.current.set(type, new Set());
    }
    listeners.current.get(type)!.add(callback);

    return () => {
      listeners.current.get(type)?.delete(callback);
    };
  }, []);

  useEffect(() => {
    tokenRef.current = initialToken;
  }, [initialToken]);

  useEffect(() => {
    connect();
    return () => {
      if (socket) socket.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, addListener }}>
      {children}
    </SocketContext.Provider>
  );
}
