"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSocket } from "@/components/providers/socket-provider";
import { Truck, MapPin, Navigation } from "lucide-react";
import { createRoot } from "react-dom/client";

interface LiveRiderMapProps {
  riderId: string;
  pickupCoords: { lat: number; lng: number };
  deliveryCoords: { lat: number; lng: number };
  pickupLabel?: string;
  deliveryLabel?: string;
}

export function LiveRiderMap({ 
  riderId, 
  pickupCoords, 
  deliveryCoords,
  pickupLabel = "Pickup Location",
  deliveryLabel = "NGO Delivery"
}: LiveRiderMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const riderMarker = useRef<mapboxgl.Marker | null>(null);
  const { addListener } = useSocket();
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-night-v1", // Sleek "Zomato" night style
      center: [pickupCoords.lng, pickupCoords.lat],
      zoom: 13,
      pitch: 45, // Add some 3D feel
    });

    // Add Pickup Marker
    const pickupEl = document.createElement("div");
    pickupEl.className = "p-2 bg-orange-100 rounded-full border-2 border-orange-600 shadow-lg";
    const pickupIcon = createRoot(pickupEl);
    pickupIcon.render(<MapPin className="w-5 h-5 text-orange-600" />);
    new mapboxgl.Marker(pickupEl)
      .setLngLat([pickupCoords.lng, pickupCoords.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${pickupLabel}</h3>`))
      .addTo(map.current);

    // Add Delivery Marker
    const deliveryEl = document.createElement("div");
    deliveryEl.className = "p-2 bg-emerald-100 rounded-full border-2 border-emerald-600 shadow-lg";
    const deliveryIcon = createRoot(deliveryEl);
    deliveryIcon.render(<Navigation className="w-5 h-5 text-emerald-600" />);
    new mapboxgl.Marker(deliveryEl)
      .setLngLat([deliveryCoords.lng, deliveryCoords.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${deliveryLabel}</h3>`))
      .addTo(map.current);

    // Initial Rider Marker (Hidden until we get location)
    const riderRootEl = document.createElement("div");
    riderRootEl.className = "rider-marker-container transition-all duration-1000"; // Smooth CSS transition
    const riderIcon = createRoot(riderRootEl);
    riderIcon.render(
      <div className="p-3 bg-white rounded-full shadow-[0_0_20px_rgba(249,115,22,0.4)] border-2 border-orange-500 scale-110">
        <Truck className="w-6 h-6 text-orange-600" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      </div>
    );
    
    riderMarker.current = new mapboxgl.Marker(riderRootEl)
      .setLngLat([pickupCoords.lng, pickupCoords.lat]) // Start at pickup
      .addTo(map.current);

    // Fit map to bounds
    const bounds = new mapboxgl.LngLatBounds()
      .extend([pickupCoords.lng, pickupCoords.lat])
      .extend([deliveryCoords.lng, deliveryCoords.lat]);
    map.current.fitBounds(bounds, { padding: 80 });

    return () => {
      map.current?.remove();
    };
  }, [pickupCoords, deliveryCoords, pickupLabel, deliveryLabel]);

  useEffect(() => {
    // Listen for rider location updates via socket
    const cleanup = addListener("RIDER_LOCATION", (payload) => {
      if (payload.riderId === riderId) {
        setRiderLocation({ lat: payload.lat, lng: payload.lng });
        
        if (riderMarker.current && map.current) {
          // Smoothly move the marker
          riderMarker.current.setLngLat([payload.lng, payload.lat]);
          
          // Optionally pan map to follow rider
          // map.current.easeTo({ center: [payload.lng, payload.lat], duration: 1000 });
        }
      }
    });

    return cleanup;
  }, [riderId, addListener]);

  return (
    <div className="relative w-full h-[400px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner group">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Overlay Info */}
      <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-2xl flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
               <Truck className={`w-6 h-6 ${riderLocation ? 'animate-bounce' : ''}`} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none mb-1">Rider Status</p>
               <h4 className="text-sm font-black text-gray-950 uppercase tracking-tighter">
                  {riderLocation ? 'En-route to Destination' : 'Awaiting Connection...'}
               </h4>
            </div>
         </div>
         {riderLocation && (
            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live GPS Active</span>
            </div>
         )}
      </div>
    </div>
  );
}
