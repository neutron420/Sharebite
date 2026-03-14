"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Truck, MapPin, Loader2 } from "lucide-react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface LiveRiderMapProps {
  riderId: string;
  riderName?: string;
  donorCoords?: [number, number]; // [lng, lat]
  ngoCoords?: [number, number];   // [lng, lat]
  status?: string;
}

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11", // Tactical dark theme
      zoom: 13,
      center: donorCoords || [77.209, 28.613], // Default to Delhi if no coords
      attributionControl: false
    });

    map.current.on('load', () => {
      setLoading(false);

      // Add Donor Marker
      if (donorCoords) {
        const el = document.createElement('div');
        el.innerHTML = '<div class="p-2 bg-orange-600 rounded-full border-2 border-white shadow-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>';
        new mapboxgl.Marker(el)
          .setLngLat(donorCoords)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>Donor Location</h3>'))
          .addTo(map.current!);
      }

      // Add NGO Marker
      if (ngoCoords) {
        const el = document.createElement('div');
        el.innerHTML = '<div class="p-2 bg-blue-600 rounded-full border-2 border-white shadow-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="m9 22 3-6 3 6"/><path d="m9 2 3 6 3-6"/></svg></div>';
        new mapboxgl.Marker(el)
          .setLngLat(ngoCoords)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>NGO Hub</h3>'))
          .addTo(map.current!);
      }

      // Create Initial Rider Marker (Hidden until data arrives)
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
        .setLngLat([0, 0])
        .addTo(map.current!);
    });

    return () => map.current?.remove();
  }, []);

  // Poll for Rider Location
  useEffect(() => {
    if (!riderId) return;

    const pollLocation = async () => {
      try {
        const res = await fetch(`/api/rider/location?riderId=${riderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lng && data.lat) {
            riderMarker.current?.setLngLat([data.lng, data.lat]);
            
            // Auto-center on rider if map is ready
            if (map.current) {
              map.current.easeTo({
                center: [data.lng, data.lat],
                duration: 1000
              });
            }
          }
        }
      } catch (err) {
        console.error("Map tracking poll error:", err);
      }
    };

    const interval = setInterval(pollLocation, 3000); // 3s polling
    pollLocation();

    return () => clearInterval(interval);
  }, [riderId]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 group">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Acquiring Sat-Link...</p>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full grayscale-[0.5] contrast-[1.2] brightness-[0.8]" />
      
      {/* Overlay Status */}
      <div className="absolute top-6 left-6 z-10">
         <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Active Tracking: {status}</span>
         </div>
      </div>
    </div>
  );
}
