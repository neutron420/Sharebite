"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface LiveRiderMapProps {
  riderId: string;
  riderName?: string;
  donorCoords?: [number, number]; // [lng, lat]
  ngoCoords?: [number, number];   // [lng, lat]
  status?: string;
}

interface DirectionsResponse {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

interface RiderLocationResponse {
  lat?: number | null;
  lng?: number | null;
  offline?: boolean;
}

type RouteGeoJson = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

const DEFAULT_CENTER: [number, number] = [77.209, 28.613];

export default function LiveRiderMap({ 
  riderId, 
  riderName = "Rider", 
  donorCoords, 
  ngoCoords,
  status = "ASSIGNED"
}: LiveRiderMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const riderMarker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeStats, setRouteStats] = useState<{ distance: string, duration: string } | null>(null);
  const { addListener } = useSocket();

  const fetchRoute = useCallback(async (m: mapboxgl.Map) => {
    if (!donorCoords || !ngoCoords || !mapboxgl.accessToken) {
      setRouteStats(null);
      return;
    }
    
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${donorCoords[0]},${donorCoords[1]};${ngoCoords[0]},${ngoCoords[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: "GET" }
      );
      const json: DirectionsResponse = await query.json();
      const data = json.routes?.[0];

      if (!data) {
        setRouteStats(null);
        return;
      }

      const geojson: RouteGeoJson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: data.geometry.coordinates,
        },
      };

      if (m.getSource("route")) {
        (m.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        m.addLayer({
          id: "route",
          type: "line",
          source: {
            type: "geojson",
            data: geojson,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ea580c",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }

      setRouteStats({
        distance: (data.distance / 1000).toFixed(1) + " km",
        duration: Math.floor(data.duration / 60) + " min",
      });
    } catch (err) {
      console.error("Failed to fetch route:", err);
    }
  }, [donorCoords, ngoCoords]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl.accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const nextMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      zoom: 12,
      center: donorCoords || DEFAULT_CENTER,
      attributionControl: false
    });

    map.current = nextMap;

    nextMap.on('load', () => {
      setLoading(false);
      const m = nextMap;

      // Add Donor Marker
      if (donorCoords) {
        const el = document.createElement('div');
        el.innerHTML = '<div class="p-2 bg-orange-600 rounded-full border-2 border-white shadow-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>';
        new mapboxgl.Marker(el).setLngLat(donorCoords).addTo(m);
      }

      // Add NGO Marker
      if (ngoCoords) {
        const el = document.createElement('div');
        el.innerHTML = '<div class="p-2 bg-blue-600 rounded-full border-2 border-white shadow-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="m9 22 3-6 3 6"/><path d="m9 2 3 6 3-6"/></svg></div>';
        new mapboxgl.Marker(el).setLngLat(ngoCoords).addTo(m);
      }

      // Initial Route
      void fetchRoute(m);

      // Rider Marker setup
      const riderEl = document.createElement('div');
      riderEl.innerHTML = `
        <div class="relative">
          <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-2 py-1 rounded whitespace-nowrap border border-white/20 uppercase tracking-tighter">
            ${riderName}
          </div>
          <div class="p-3 bg-white rounded-2xl border-2 border-orange-600 shadow-2xl animate-bounce">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M15 6h5l3 3v7h-2"/></svg>
          </div>
        </div>
      `;
      riderMarker.current = new mapboxgl.Marker(riderEl)
        .setLngLat(donorCoords ?? ngoCoords ?? DEFAULT_CENTER)
        .addTo(m);
    });

    return () => {
      riderMarker.current = null;
      nextMap.remove();
      if (map.current === nextMap) {
        map.current = null;
      }
    };
  }, [donorCoords, fetchRoute, ngoCoords, riderName]);

  // Main Socket Listener for live tracking
  useEffect(() => {
    if (!riderId || status === "COLLECTED" || status === "COMPLETED") return;

    const unsubscribe = addListener("RIDER_LOCATION", (data) => {
      if (data.riderId === riderId && typeof data.lng === "number" && typeof data.lat === "number") {
        riderMarker.current?.setLngLat([data.lng, data.lat]);
        if (map.current) {
          map.current.easeTo({ center: [data.lng, data.lat], duration: 800 });
        }
      }
    });

    return () => unsubscribe();
  }, [riderId, status, addListener]);

  // Poll for Rider Location as a fallback
  useEffect(() => {
    if (!riderId || status === "COLLECTED" || status === "COMPLETED") return;

    let cancelled = false;

    const pollLocation = async () => {
      try {
        const res = await fetch(`/api/rider/location?riderId=${riderId}`);
        if (res.ok) {
          const data: RiderLocationResponse = await res.json();
          if (
            !cancelled &&
            !data.offline &&
            typeof data.lng === "number" &&
            typeof data.lat === "number"
          ) {
            riderMarker.current?.setLngLat([data.lng, data.lat]);
            if (map.current) {
              map.current.easeTo({ center: [data.lng, data.lat], duration: 1000 });
            }
          }
        }
      } catch {}
    };

    const interval = window.setInterval(pollLocation, 30000); 
    void pollLocation();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [riderId, status]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 group">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Linking Logistics...</p>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full grayscale-[0.2] contrast-[1.1]" />
      
      {/* Strategic Stat Overlays */}
      <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-3">
         <div className="flex justify-between items-start">
            <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{status} Activity</span>
            </div>

            {routeStats && (
               <div className="flex gap-2">
                  <div className="bg-orange-600 px-4 py-2 rounded-xl shadow-xl flex flex-col items-center">
                     <span className="text-[8px] font-black uppercase text-orange-100 tracking-tighter">Distance</span>
                     <span className="text-sm font-black text-white leading-none">{routeStats.distance}</span>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-xl shadow-xl flex flex-col items-center border border-white/10">
                     <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">ETA</span>
                     <span className="text-sm font-black text-orange-500 leading-none">{routeStats.duration}</span>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
