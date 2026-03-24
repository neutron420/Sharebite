"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowLeft, Building2, Clock, Loader2, MapPin, Search, X } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { motion } from "framer-motion";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type NgoMapItem = {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance: number | null;
  completedPickups: number;
};

const INDIA_CENTER: [number, number] = [78.9629, 22.5937];
const FOOD_CATEGORIES = [
  "ALL",
  "VEG",
  "NON_VEG",
  "DAIRY",
  "BAKERY",
  "FRUITS_AND_VEGGIES",
  "COOKED_FOOD",
  "STAPLES",
  "PACKAGED_FOOD",
  "OTHERS",
] as const;

export default function DonorNgoMapPage() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [donorId, setDonorId] = useState<string | null>(null);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [activeNgo, setActiveNgo] = useState<NgoMapItem | null>(null);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [ngoMapItems, setNgoMapItems] = useState<NgoMapItem[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Unable to load user");
        }
        const data = await res.json();
        setDonorId(data?.id || null);
      } catch {
        router.push("/login");
      }
    };

    void getMe();
  }, [router]);

  useEffect(() => {
    if (!donorId) return;

    const fetchNetwork = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (city !== "ALL") params.set("city", city);

        const res = await fetch(`/api/donor/network?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch NGO network");

        let data = (await res.json()) as NgoMapItem[];
        
        if (search) {
          data = data.filter(n => n.name.toLowerCase().includes(search.toLowerCase()) || n.city?.toLowerCase().includes(search.toLowerCase()));
        }

        setNgoMapItems(data);
      } catch (error) {
        console.error("NGO network fetch error:", error);
        setNgoMapItems([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchNetwork();
  }, [donorId, search, city]);

  useEffect(() => {
    if (ngoMapItems.length > 0 && allCities.length === 0) {
      const cities = Array.from(new Set(ngoMapItems.map((n) => n.city).filter(Boolean))).sort();
      setAllCities(cities);
    }
  }, [ngoMapItems, allCities.length]);

  const cityOptions = allCities;

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl.accessToken || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: INDIA_CENTER,
      zoom: 4,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => {
      setMapReady(true);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainer.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!ngoMapItems.length) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    for (const ngo of ngoMapItems) {
      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(
        `<div style="font-family:system-ui,sans-serif;padding:6px 4px;min-width:200px;">
          <p style="margin:0 0 6px;font-weight:900;font-size:14px;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px;">${ngo.name}</p>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p style="margin:0;font-size:12px;font-weight:600;color:#64748b;">${ngo.city}</p>
          </div>
          <p style="margin:0;font-size:11px;font-weight:700;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:8px;">${ngo.distance ? `~${ngo.distance.toFixed(1)} km away` : 'Active Node'}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: "#ea580c" })
        .setLngLat([ngo.longitude, ngo.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedNgoId(ngo.id);
        setActiveNgo(ngo);
        setShowModal(true);
      });

      markersRef.current.push(marker);
      bounds.extend([ngo.longitude, ngo.latitude]);
    }

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 11,
      duration: 700,
    });
  }, [ngoMapItems, mapReady]);

  const focusNgo = (ngo: NgoMapItem) => {
    setSelectedNgoId(ngo.id);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [ngo.longitude, ngo.latitude],
        zoom: 12,
        duration: 700,
      });
    }
  };

  if (!mapboxgl.accessToken) {
    return (
      <div className="min-h-screen bg-white p-6 lg:p-10">
        <div className="max-w-3xl mx-auto rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-black text-red-700 uppercase tracking-wider">Mapbox Token Missing</h1>
          <p className="mt-3 text-sm font-semibold text-red-600">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file to enable donor NGO map.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-3xl bg-white border border-slate-200 p-6">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight uppercase ">NGO Network</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">Discover and visualize trusted Sharebite NGOs around you.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search NGOs by name or city..."
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
            <span className="rounded-xl bg-orange-50 text-orange-700 px-3 py-2">NGOs {ngoMapItems.length}</span>
            <span className="rounded-xl bg-slate-100 px-3 py-2">Cities {new Set(ngoMapItems.map((i) => i.city)).size}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-1 gap-3 items-center">

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700"
          >
            <option value="ALL">All Donation Cities</option>
            {cityOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_420px] gap-6">
        <div className="relative min-h-[55vh] lg:min-h-[74vh] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {(!mapReady || loading) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          )}
          <div ref={mapContainer} className="h-full w-full" />
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5 h-[55vh] lg:h-[74vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">Available NGOs</h2>
            <span className="text-xs font-black text-orange-600">{ngoMapItems.length}</span>
          </div>

          {!loading && ngoMapItems.length === 0 && (
            <p className="p-4 text-sm font-bold text-slate-500">No NGOs with mappable coordinates found for this filter.</p>
          )}

          <div className="space-y-3">
            {ngoMapItems.map((ngo, idx) => (
              <div
                key={`${ngo.id}-${idx}`}
                className={`rounded-2xl border p-4 transition-all ${
                  selectedNgoId === ngo.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                }`}
              >
                <button
                  onClick={() => focusNgo(ngo)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-slate-900 line-clamp-2">{ngo.name}</p>
                    <Building2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-500 line-clamp-1">{ngo.city}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      {ngo.distance ? `${ngo.distance.toFixed(1)} km away` : ngo.state}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      ⭐ {ngo.rating.toFixed(1)} Rating
                    </span>
                  </div>
                </button>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => focusNgo(ngo)}
                    className="flex-1 rounded-xl bg-slate-900 text-white px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-orange-600 transition-colors"
                  >
                    Focus on Map
                  </button>
                  <button
                    onClick={() => router.push(`/donor/donate`)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-orange-400 hover:text-orange-700 transition-colors"
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Donation Details Modal */}
      {showModal && activeNgo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          onClick={() => setShowModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] w-full max-w-md max-h-[80vh] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Compact */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">{activeNgo.name}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeNgo.city}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-1">Total Pickups</p>
                  <p className="text-xl font-black text-orange-600">{activeNgo.completedPickups}</p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Rating</p>
                  <p className="text-xl font-black text-slate-600">⭐ {activeNgo.rating.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Footer - Minimal */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 shrink-0">
               <button 
                 onClick={() => router.push(`/donor/donate`)}
                 className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-orange-600 transition-all active:scale-95"
               >
                 Create Targeted Donation
               </button>
               <button 
                 onClick={() => setShowModal(false)}
                 className="px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all opacity-80"
               >
                 Dismiss
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
