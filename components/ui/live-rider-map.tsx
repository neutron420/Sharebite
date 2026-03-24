"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, Navigation, MapPin, Truck, Clock } from "lucide-react";
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

const DEFAULT_CENTER: [number, number] = [77.209, 28.613];

// Helper to calculate bearing between two points
const getBearing = (start: [number, number], end: [number, number]) => {
  const startLat = (start[1] * Math.PI) / 180;
  const startLng = (start[0] * Math.PI) / 180;
  const endLat = (end[1] * Math.PI) / 180;
  const endLng = (end[0] * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

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
  const riderLocation = useRef<[number, number]>(donorCoords || DEFAULT_CENTER);
  
  const [loading, setLoading] = useState(true);
  const [routeStats, setRouteStats] = useState<{ distance: string, duration: string } | null>(null);
  const { addListener } = useSocket();

  const fetchRoute = useCallback(async (m: mapboxgl.Map, start: [number, number], end: [number, number]) => {
    if (!mapboxgl.accessToken) return;
    
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: "GET" }
      );
      const json: DirectionsResponse = await query.json();
      const data = json.routes?.[0];

      if (!data) return;

      const geojson: any = {
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
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#f97316",
            "line-width": 6,
            "line-opacity": 0.8,
            "line-dasharray": [0, 2], // Create a "dotted" or "glowing" path effect
          },
        });

        // Add an "animated" glow layer beneath
        m.addLayer({
            id: "route-glow",
            type: "line",
            source: { type: "geojson", data: geojson },
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#f97316",
              "line-width": 12,
              "line-opacity": 0.15,
              "line-blur": 8
            },
          }, "route");
      }

      setRouteStats({
        distance: (data.distance / 1000).toFixed(1) + " km",
        duration: Math.floor(data.duration / 60) + " min",
      });
    } catch (err) {
      console.error("Failed to fetch route:", err);
    }
  }, []);

  const animateMarker = useCallback((newPos: [number, number]) => {
    if (!riderMarker.current || !map.current) return;

    const startPos = riderLocation.current;
    const bearing = getBearing(startPos, newPos);
    
    // Rotate the marker element
    const el = riderMarker.current.getElement();
    const truckIcon = el.querySelector('.truck-icon') as HTMLElement;
    if (truckIcon) {
      truckIcon.style.transform = `rotate(${bearing}deg)`;
    }

    // Smooth transition using Mapbox's ease mode or interpolation
    // For simplicity and "real-time" feel, we let Mapbox handle center and we just set position
    riderMarker.current.setLngLat(newPos);
    riderLocation.current = newPos;

    map.current.easeTo({
      center: newPos,
      duration: 1200,
      essential: true
    });

    // Update dynamic route based on status
    const target = status === "ASSIGNED" ? donorCoords : ngoCoords;
    if (target) {
      void fetchRoute(map.current, newPos, target);
    }
  }, [donorCoords, ngoCoords, status, fetchRoute]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl.accessToken) {
      setLoading(false);
      return;
    }

    const nextMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11", // Cleaner, modern light theme
      zoom: 14,
      center: donorCoords || DEFAULT_CENTER,
      attributionControl: false,
      pitch: 45 // 3D Perspective
    });

    map.current = nextMap;

    nextMap.on('load', () => {
      setLoading(false);
      const m = nextMap;

      // Add Donor Marker
      if (donorCoords) {
        const el = document.createElement('div');
        el.className = 'marker-donor';
        el.innerHTML = '<div class="p-2.5 bg-orange-600 rounded-2xl border-2 border-white shadow-xl scale-110"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>';
        new mapboxgl.Marker(el).setLngLat(donorCoords).addTo(m);
      }

      // Add NGO Marker
      if (ngoCoords) {
        const el = document.createElement('div');
        el.className = 'marker-ngo';
        el.innerHTML = '<div class="p-2.5 bg-indigo-600 rounded-2xl border-2 border-white shadow-xl scale-110"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.91A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.09L21 9"/></svg></div>';
        new mapboxgl.Marker(el).setLngLat(ngoCoords).addTo(m);
      }

      // Initial Rider Marker
      const riderEl = document.createElement('div');
      riderEl.className = 'rider-marker-container';
      riderEl.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="mb-2 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-lg whitespace-nowrap uppercase tracking-wider">
            ${riderName}
          </div>
          <div class="truck-icon p-3.5 bg-white rounded-[1.25rem] border-2 border-orange-500 shadow-2xl transition-transform duration-500 ease-out">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M9 18h6"/><path d="M19 18a1 1 0 0 0 1-1v-5l-3-3h-3v9"/><path d="M16 13.5h4.5"/></svg>
          </div>
          <div class="absolute -bottom-2 w-4 h-4 bg-orange-500/20 rounded-full blur-md animate-ping" />
        </div>
      `;
      riderMarker.current = new mapboxgl.Marker(riderEl)
        .setLngLat(donorCoords ?? DEFAULT_CENTER)
        .addTo(m);

      // Initial Route
      const target = status === "ASSIGNED" ? donorCoords : ngoCoords;
      if (target) {
        void fetchRoute(m, donorCoords || DEFAULT_CENTER, target);
      }
    });

    return () => {
      riderMarker.current = null;
      nextMap.remove();
      map.current = null;
    };
  }, [donorCoords, fetchRoute, ngoCoords, riderName, status]);

  // Real-time Update Listener
  useEffect(() => {
    if (!riderId || status === "COMPLETED") return;

    const unsubscribe = addListener("RIDER_LOCATION", (data) => {
      if (data.riderId === riderId && typeof data.lng === "number" && typeof data.lat === "number") {
        animateMarker([data.lng, data.lat]);
      }
    });

    return () => unsubscribe();
  }, [riderId, status, addListener, animateMarker]);

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-gray-100 group shadow-inner border border-gray-100">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">Synchronizing GPS...</p>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* HUD Info Box */}
      {routeStats && (
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <div className="max-w-md mx-auto bg-white/90 backdrop-blur-2xl p-5 rounded-[2rem] border border-gray-100 shadow-2xl flex items-center justify-between gap-6 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
             
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                   <Clock className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Estimated ETA</p>
                   <p className="text-xl font-bold font-mono tracking-tight text-gray-900">{routeStats.duration}</p>
                </div>
             </div>

             <div className="h-10 w-px bg-gray-200" />

             <div className="flex items-center gap-4 text-right">
                <div className="sm:block hidden">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Distance</p>
                   <p className="text-xl font-bold font-mono tracking-tight text-gray-900">{routeStats.distance}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                   <Navigation className="w-6 h-6" />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Connection Status Badge */}
      <div className="absolute top-8 left-8">
         <div className="bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Sector Uplink Active</span>
         </div>
      </div>
    </div>
  );
}
