"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Search } from 'lucide-react';

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
}

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * LocationPicker Component
 * Integrates Mapbox to allow users to pick a location.
 * Features: Search auto-complete and click-to-geodecode.
 */
export default function LocationPicker({ onLocationSelect, initialCoords }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
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

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      })
    );

    // Click handler for geocoding
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      await reverseGeocode(lng, lat);
    });

    return () => map.current?.remove();
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
    <div className="location-picker-container w-full h-[500px] relative rounded-xl overflow-hidden shadow-2xl border border-white/20">
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full bg-white/90 backdrop-blur-md border border-white/30 rounded-full py-3 pl-10 pr-4 text-sm font-medium shadow-lg outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-gray-800"
            placeholder="Search address or landmark..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 rounded-xl flex items-start gap-3 transition-colors group"
              >
                <MapPin className="h-5 w-5 text-gray-400 group-hover:text-orange-500 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900 line-clamp-1">{s.text}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{s.place_name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={mapContainer} className="w-full h-full" />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20">
        <p className="text-xs font-semibold text-gray-600 flex items-center gap-2">
          <MapPin className="h-3 w-3 text-orange-500" />
          Click on map to pin exact location
        </p>
      </div>
    </div>
  );
}
