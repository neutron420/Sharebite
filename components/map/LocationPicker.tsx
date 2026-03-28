"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface LocationPickerProps {
  onLocationSelect: (data: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    district: string;
    pincode: string;
  }) => void;
  initialCoords?: { lat: number; lng: number };
  initialSearchQuery?: string;
  externalSearchTrigger?: string; // Change to triggerEffect
}

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * LocationPicker Component
 * Integrates Mapbox to allow users to pick a location.
 * Features: Search auto-complete and click-to-geodecode.
 */
export default function LocationPicker({ onLocationSelect, initialCoords, initialSearchQuery, externalSearchTrigger }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoords ? [initialCoords.lng, initialCoords.lat] : [77.2090, 28.6139], // Default Delhi
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'bottom-right'
    );

    // Click handler for geocoding
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      await reverseGeocode(lng, lat);
    });

    // Fix for map rendering at half width in flex/grid containers
    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      map.current?.remove();
    };
  }, []);

  const updateMarker = (lng: number, lat: number) => {
    if (!map.current) return;
    if (marker.current) marker.current.remove();
    
    marker.current = new mapboxgl.Marker({ color: '#FF5733' })
      .setLngLat([lng, lat])
      .addTo(map.current);
    
    map.current.flyTo({ center: [lng, lat], zoom: 15 });
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,place,postcode,region,locality`
      );
      const data = await resp.json();
      
      if (data.features && data.features.length > 0) {
        processGeocodeData(data.features[0], lat, lng);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processGeocodeData = (feature: any, lat: number, lng: number) => {
    const context = feature.context || [];
    
    const address = feature.place_name;
    const city = context.find((c: any) => c.id.startsWith('place'))?.text || '';
    const state = context.find((c: any) => c.id.startsWith('region'))?.text || '';
    const district = context.find((c: any) => c.id.startsWith('district'))?.text || '';
    const pincode = context.find((c: any) => c.id.startsWith('postcode'))?.text || '';

    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address,
      city,
      state,
      district,
      pincode
    });
    setSearchQuery(address);
  };

  useEffect(() => {
    if (externalSearchTrigger && externalSearchTrigger.length > 5 && mapboxToken) {
      const runSearch = async () => {
        try {
          const resp = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(externalSearchTrigger)}.json?access_token=${mapboxToken}&limit=1`
          );
          const data = await resp.json();
          if (data.features && data.features.length > 0) {
            selectSuggestion(data.features[0]);
          }
        } catch (err) {
          console.error('Trigger search error:', err);
        }
      }
      runSearch();
    }
  }, [externalSearchTrigger]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 3) {
      try {
        const resp = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`
        );
        const data = await resp.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (feature: any) => {
    const [lng, lat] = feature.center;
    setSuggestions([]);
    updateMarker(lng, lat);
    processGeocodeData(feature, lat, lng);
  };

  return (
    <div className="location-picker-container w-full h-full relative rounded-xl overflow-hidden shadow-2xl border border-white/20 min-h-[400px]">
      {/* Search Bar Overlay - Fixed Top Left with High Presence */}
      <div className="absolute top-8 left-8 z-30 flex flex-col gap-2 w-full max-w-[420px]">
        <div className="relative group/search">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-slate-400 group-focus-within/search:text-orange-600 transition-all group-focus-within/search:scale-110" strokeWidth={3} />
          </div>
          <input
            type="text"
            className="w-full bg-white/95 backdrop-blur-2xl border-2 border-slate-100/50 rounded-[1.5rem] py-4.5 pl-14 pr-12 text-[13px] font-black shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] outline-none focus:border-orange-600/20 focus:ring-8 focus:ring-orange-600/5 transition-all text-slate-900 uppercase tracking-tighter placeholder:text-slate-300 placeholder:font-bold h-14"
            placeholder="Search address or landmark..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <AnimatePresence>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors z-10"
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all">
                   <span className="text-xl font-light leading-none">×</span>
                </div>
              </button>
            )}
          </AnimatePresence>
          {loading && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 z-10">
              <div className="animate-spin h-4 w-4 border-3 border-orange-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-100/50 rounded-[2rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] p-2.5 overflow-y-auto max-h-[350px] animate-in fade-in slide-in-from-top-2 duration-300 mt-2 scrollbar-hide z-50">
            <div className="px-5 py-2 mb-1 border-b border-slate-50">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Quick Results</span>
            </div>
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-5 py-4 hover:bg-orange-50/50 rounded-2xl flex items-start gap-4 transition-all group mb-1 border border-transparent hover:border-orange-100"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors shadow-sm">
                  <MapPin className="h-5 w-5 text-slate-400 group-hover:text-orange-600" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-grow py-1">
                  <div className="text-[12px] font-black text-slate-900 line-clamp-1 uppercase tracking-tight group-hover:text-orange-950 transition-colors">{s.text}</div>
                  <div className="text-[9px] font-bold text-slate-400 line-clamp-1 truncate uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">{s.place_name}</div>
                </div>
                <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                   <ChevronRight className="w-4 h-4 text-orange-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={mapContainer} className="w-full h-full" />
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-2xl px-6 py-3 rounded-full shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] border border-white/50 z-20 animate-bounce duration-[2000ms]">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
          Click range to pin exact base
        </div>
      </div>
    </div>
  );
}
