"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface RiderLocationHookProps {
  riderId: string | null;
  activeMissionId: string | null;
  connectedUserIds: string[]; // Donor and NGO IDs to receive updates
}

export function useRiderLocation({ riderId, activeMissionId, connectedUserIds }: RiderLocationHookProps) {
  const { socket, isConnected } = useSocket();
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);
  const watchId = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const UPDATE_INTERVAL = 5000; // Send update every 5 seconds

  useEffect(() => {
    if (!riderId || !activeMissionId || !isConnected || !socket || connectedUserIds.length === 0) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed } = position.coords;
          setLastPosition({ lat: latitude, lng: longitude });

          const now = Date.now();
          if (now - lastUpdate.current > UPDATE_INTERVAL) {
            // Send location update to server
            socket.send(JSON.stringify({
              type: "RIDER_LOCATION_UPDATE",
              payload: {
                riderId,
                missionId: activeMissionId,
                userIds: connectedUserIds,
                lat: latitude,
                lng: longitude,
                heading,
                speed
              }
            }));
            
            lastUpdate.current = now;
            console.log("Rider location sent:", { latitude, longitude });
          }
        },
        (error) => {
          console.error("Geolocation error:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [riderId, activeMissionId, isConnected, socket, connectedUserIds]);

  return { isTracking: watchId.current !== null, lastPosition };
}
