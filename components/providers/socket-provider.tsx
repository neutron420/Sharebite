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

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listeners = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/token");
      if (!res.ok) return;
      
      const { token } = await res.json();
      if (!token) return;

      const wsUrl = `ws://localhost:8080?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket Connected");
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          const typeListeners = listeners.current.get(type);
          if (typeListeners) {
            typeListeners.forEach((callback) => callback(payload));
          }
        } catch (err) {
          console.error("WebSocket message error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        console.log("WebSocket Disconnected. Reconnecting in 3s...");
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
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
