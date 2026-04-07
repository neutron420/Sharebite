"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, MapPin, CheckCircle2, TrendingUp } from "lucide-react";
import { createRoot } from "react-dom/client";

interface Waypoint {
  id: string;
  type: 'pickup' | 'delivery';
  lat: number;
  lng: number;
  label: string;
}

interface RouteOptimizerProps {
  currentLocation: { lat: number; lng: number } | null;
  waypoints: Waypoint[];
}

export function RouteOptimizer({ currentLocation, waypoints }: RouteOptimizerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [optimizedOrder, setOptimizedOrder] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !currentLocation || waypoints.length === 0) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 12,
    });

    // Add Current Location Marker
    const currentEl = document.createElement("div");
    currentEl.className = "w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-xl animate-pulse";
    new mapboxgl.Marker(currentEl)
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .addTo(map.current);

    fetchOptimizedRoute();

    return () => {
      map.current?.remove();
    };
  }, [currentLocation, waypoints]);

  const fetchOptimizedRoute = async () => {
    if (!currentLocation || waypoints.length === 0) return;
    setLoading(true);

    try {
      // Build coordinates string: curr;wp1;wp2...
      const coordsString = [
        `${currentLocation.lng},${currentLocation.lat}`,
        ...waypoints.map(wp => `${wp.lng},${wp.lat}`)
      ].join(';');

      const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsString}?source=first&overview=full&geometries=geojson&access_token=${mapboxgl.accessToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && map.current) {
        const trip = data.trips[0];
        
        // Draw route line
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(trip.geometry);
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: trip.geometry
          });

          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#f97316', 'line-width': 6, 'line-opacity': 0.8 }
          });
        }

        // Map optimization result back to our waypoints
        // Mapbox waypoints are index-based on the input coords
        // waypoint[0] is our current location (index 0)
        const sortedWaypoints = data.waypoints
          .filter((wp: any) => wp.waypoint_index !== 0) // exclude current location
          .sort((a: any, b: any) => a.trips_index - b.trips_index)
          .map((wp: any) => waypoints[wp.waypoint_index - 1]);

        setOptimizedOrder(sortedWaypoints);

        // Add markers for each waypoint with sequence numbers
        sortedWaypoints.forEach((wp: { type: string; lng: number; lat: number; label: any; }, index: number) => {
          const el = document.createElement("div");
          el.className = `w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs text-white ${wp.type === 'pickup' ? 'bg-orange-600' : 'bg-emerald-600'}`;
          el.innerText = (index + 1).toString();
          
          new mapboxgl.Marker(el)
            .setLngLat([wp.lng, wp.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<b>${wp.label}</b>`))
            .addTo(map.current!);
        });

        // Fit map
        const bounds = new mapboxgl.LngLatBounds()
          .extend([currentLocation.lng, currentLocation.lat]);
        waypoints.forEach(wp => bounds.extend([wp.lng, wp.lat]));
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full h-[350px] rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl">
        <div ref={mapContainer} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2">
            <TrendingUp className="w-4 h-4 text-orange-600" /> Optimized Logistics Sequence
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {optimizedOrder.map((wp, i) => (
            <div key={wp.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-200 transition-all">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${wp.type === 'pickup' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{wp.type}</p>
                  <Navigation className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-950 truncate uppercase tracking-tighter">{wp.label}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                {wp.type === 'pickup' ? <MapPin className="w-5 h-5 text-orange-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>
            </div>
          ))}
          {optimizedOrder.length === 0 && !loading && (
             <div className="p-10 text-center border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-300 font-bold uppercase text-xs tracking-widest">
                Calculating most efficient route...
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
