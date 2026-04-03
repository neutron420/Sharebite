"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, MapPin, Package, Clock, ArrowLeft, Search, X, Navigation, List, Map as MapIcon, Filter } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";
import { cn } from "@/lib/utils";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Donation = {
  id: string;
  title: string;
  city: string;
  pickupLocation: string;
  quantity: number;
  expiryTime: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  isUrgent?: boolean;
};

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

const INDIA_CENTER: [number, number] = [78.9629, 22.5937];

export default function DonationsMapView({ initialSelectedId }: { initialSelectedId?: string }) {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof FOOD_CATEGORIES)[number]>("ALL");
  const [city, setCity] = useState("ALL");
  const [useNearby, setUseNearby] = useState(false);
  const [radiusKm, setRadiusKm] = useState(15);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showFilters, setShowFilters] = useState(false);

  const donationsWithCoords = useMemo(
    () => donations.filter((d) => typeof d.latitude === "number" && typeof d.longitude === "number"),
    [donations]
  );

  const cityOptions = useMemo(() => {
    return Array.from(new Set(donations.map((item) => item.city).filter(Boolean))).sort();
  }, [donations]);

  const cityCount = useMemo(() => {
    return new Set(donationsWithCoords.map((item) => item.city).filter(Boolean)).size;
  }, [donationsWithCoords]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ status: "AVAILABLE" });

        if (search) params.set("search", search);
        if (category !== "ALL") params.set("category", category);
        if (city !== "ALL") params.set("city", city);
        if (useNearby && userCoords) {
          params.set("lat", String(userCoords.lat));
          params.set("lng", String(userCoords.lng));
          params.set("radius", String(radiusKm));
        }

        const res = await fetch(`/api/donations?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch donations");

        const data = (await res.json()) as Donation[];
        setDonations(data);
      } catch (error) {
        console.error("Donations fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchDonations();
  }, [search, category, city, useNearby, userCoords, radiusKm]);

  const enableNearby = () => {
    if (userCoords) {
      setUseNearby(true);
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });
        setUseNearby(true);
        setLocating(false);

        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 11, duration: 800 });
        }
      },
      () => {
        setLocating(false);
        toast.error("Could not access your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const requestPickup = async (donationId: string) => {
    try {
      setRequestingId(donationId);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          donationId,
          message: "Request raised from Find Food map.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      toast.success("Pickup request sent.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to send pickup request.");
    } finally {
      setRequestingId(null);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl.accessToken || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: INDIA_CENTER,
      zoom: 4,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => setMapReady(true));

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainer.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!donationsWithCoords.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const donation of donationsWithCoords) {
      const lng = donation.longitude as number;
      const lat = donation.latitude as number;

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(
        `<div style="font-family:inherit;padding:8px;min-width:140px;">
          <p style="margin:0 0 4px;font-weight:900;font-size:12px;text-transform:uppercase;">${donation.title}</p>
          <p style="margin:0;font-size:10px;color:#64748b;font-weight:700;">${donation.city}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: "#ea580c" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => setSelectedId(donation.id));
      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    }

    map.fitBounds(bounds, { padding: 50, maxZoom: 12, duration: 700 });
  }, [donationsWithCoords, mapReady]);

  const goToDonation = (id: string, lng: number | null, lat: number | null) => {
    setSelectedId(id);
    if (mapRef.current && typeof lng === "number" && typeof lat === "number") {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 13, duration: 700 });
    }
    router.push(`/ngo/donations/${id}`);
  };

  if (!mapboxgl.accessToken) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-3xl mx-auto rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-black text-red-700 uppercase tracking-wider">Mapbox Token Missing</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-4 sm:space-y-6 flex flex-col italic">
      <div className="rounded-3xl sm:rounded-[3rem] bg-white border border-slate-100 p-5 sm:p-8 shadow-xl shadow-slate-200/20">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-slate-950 underline decoration-orange-600/10 underline-offset-8">Find Food</h1>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Live mission sources detected in sector.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl flex-1 sm:flex-initial">
                <button 
                   onClick={() => setViewMode("map")}
                   className={cn("flex-1 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all", viewMode === "map" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                   <MapIcon className="w-4 h-4" /> <span className="hidden xs:inline">Map</span>
                </button>
                <button 
                   onClick={() => setViewMode("list")}
                   className={cn("flex-1 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all", viewMode === "list" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                   <List className="w-4 h-4" /> <span className="hidden xs:inline">List</span>
                </button>
             </div>
             <DashboardRefreshButton />
          </div>
        </div>

        <div className={cn("mt-6 space-y-4 transition-all duration-300", !showFilters && "mb-2")}>
           <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search mission sources..."
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/50 pl-11 pr-10 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 focus:border-orange-200 focus:bg-white transition-all placeholder:text-slate-300 placeholder:italic"
                />
              </div>
              <button 
                 onClick={() => setShowFilters(!showFilters)}
                 className={cn("px-4 rounded-xl border flex items-center justify-center transition-all", showFilters ? "bg-slate-950 border-slate-950 text-white" : "bg-white border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-600")}
              >
                 <Filter className="w-4 h-4" />
              </button>
           </div>

           {showFilters && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                 <div className="flex flex-wrap gap-2">
                    {FOOD_CATEGORIES.map((option) => (
                      <button
                        key={option}
                        onClick={() => setCategory(option)}
                        className={cn("rounded-xl px-4 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border transition-all", category === option ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100" : "bg-white text-slate-400 border-slate-100 hover:border-orange-200")}
                      >
                        {option.replaceAll("_", " ")}
                      </button>
                    ))}
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-1 min-w-[140px] rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-orange-200 transition-all"
                    >
                      <option value="ALL">All Cities</option>
                      {cityOptions.map((cityName) => (
                        <option key={cityName} value={cityName}>{cityName}</option>
                      ))}
                    </select>
                    <button
                      onClick={enableNearby}
                      disabled={locating}
                      className="flex-1 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-orange-200 hover:text-orange-600 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                    >
                      {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      Near My Ops Hub
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 sm:gap-8 h-full min-h-0">
        <div className={cn("relative rounded-3xl sm:rounded-[3.5rem] overflow-hidden border border-slate-100 bg-white shadow-2xl shadow-slate-200/30 transition-all duration-500", viewMode === "list" ? "hidden xl:block" : "block min-h-[50vh] sm:min-h-[70vh]")}>
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-md">
              <Loader2 className="w-10 h-10 text-orange-600 animate-spin" strokeWidth={3} />
            </div>
          )}
          <div ref={mapContainer} className="h-full w-full" />
          <div className="absolute top-4 left-4 z-10">
             <div className="bg-slate-950/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Sensor Grid
             </div>
          </div>
        </div>

        <aside className={cn("rounded-3xl sm:rounded-[3.5rem] border border-slate-100 bg-white p-5 sm:p-8 overflow-y-auto shadow-2xl shadow-slate-200/30 transition-all duration-500 xl:block xl:h-[70vh]", viewMode === "map" ? "hidden xl:block" : "block min-h-[50vh]")}>
          <div className="flex items-center justify-between mb-6 px-2 border-l-4 border-slate-950">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 underline decoration-orange-600/20 underline-offset-4">Active Potential</h2>
            <span className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-black">{donationsWithCoords.length}</span>
          </div>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600" strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing Intelligence...</p>
            </div>
          )}

          {!loading && donationsWithCoords.length === 0 && (
             <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                   <Package className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 max-w-xs mx-auto italic">No mission sources detected in sector.</p>
             </div>
          )}

          <div className="space-y-4">
            {donationsWithCoords.map((item) => (
              <div
                key={item.id}
                className={cn("w-full text-left rounded-2xl sm:rounded-[2rem] border p-4 sm:p-6 transition-all duration-500 hover:shadow-xl hover:shadow-orange-50/50 group cursor-pointer", selectedId === item.id ? "border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-100" : "border-slate-100 bg-white hover:border-orange-200 shadow-sm")}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg font-black text-slate-950 group-hover:text-orange-600 transition-colors uppercase italic tracking-tighter line-clamp-2">{item.title}</p>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0", selectedId === item.id ? "bg-orange-600 text-white" : "bg-slate-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white")}>
                     <MapPin className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/50">
                   <p className="text-[9px] font-bold text-slate-400 line-clamp-1 uppercase tracking-wider ml-1">{item.pickupLocation}</p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-tight text-slate-400">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-orange-600" /> {item.quantity} kg</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-600" /> {formatDistanceToNowStrict(new Date(item.expiryTime), { addSuffix: true })}</span>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); goToDonation(item.id, item.longitude, item.latitude); }}
                    className="flex-1 py-3 px-3 rounded-xl bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-md"
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); requestPickup(item.id); }}
                    disabled={requestingId === item.id}
                    className="flex-1 py-3 px-3 rounded-xl border border-slate-900 text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {requestingId === item.id ? "..." : "Deploy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
