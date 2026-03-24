"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, MapPin, Package, Clock, ArrowLeft, Search, X, Navigation } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";

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

  const donationsWithCoords = useMemo(
    () => donations.filter((d) => typeof d.latitude === "number" && typeof d.longitude === "number"),
    [donations]
  );

  const cityOptions = useMemo(() => {
    return Array.from(new Set(donations.map((item) => item.city).filter(Boolean))).sort();
  }, [donations]);

  const urgentCount = useMemo(() => {
    return donationsWithCoords.filter((item) => item.isUrgent).length;
  }, [donationsWithCoords]);

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

        if (search) {
          params.set("search", search);
        }
        if (category !== "ALL") {
          params.set("category", category);
        }
        if (city !== "ALL") {
          params.set("city", city);
        }
        if (useNearby && userCoords) {
          params.set("lat", String(userCoords.lat));
          params.set("lng", String(userCoords.lng));
          params.set("radius", String(radiusKm));
        }

        const res = await fetch(`/api/donations?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch donations");
        }

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
        toast.error("Could not access your location. Please allow location permission.");
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
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      toast.success("Pickup request sent.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to send pickup request.");
    } finally {
      setRequestingId(null);
    }
  };

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

    if (!donationsWithCoords.length) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    for (const donation of donationsWithCoords) {
      const lng = donation.longitude as number;
      const lat = donation.latitude as number;

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(
        `<div style="font-family:system-ui,sans-serif;padding:4px 2px;min-width:190px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:13px;color:#0f172a;">${donation.title}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#475569;">${donation.pickupLocation}, ${donation.city}</p>
          <p style="margin:0;font-size:11px;color:#64748b;">Qty: ${donation.quantity} | ${donation.category}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: "#ea580c" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedId(donation.id);
      });

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    }

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 12,
      duration: 700,
    });
  }, [donationsWithCoords, mapReady]);

  const goToDonation = (id: string, lng: number | null, lat: number | null) => {
    setSelectedId(id);

    if (mapRef.current && typeof lng === "number" && typeof lat === "number") {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 13,
        duration: 700,
      });
    }

    router.push(`/ngo/donations/${id}`);
  };

  if (!mapboxgl.accessToken) {
    return (
      <div className="min-h-screen bg-white p-6 lg:p-10">
        <div className="max-w-3xl mx-auto rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-black text-red-700 uppercase tracking-wider">Mapbox Token Missing</h1>
          <p className="mt-3 text-sm font-semibold text-red-600">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file to enable the donations map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-8 italic">
      <div className="rounded-[3rem] bg-white border border-slate-100 p-8 shadow-xl shadow-slate-200/20">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-950 underline decoration-orange-600/10 underline-offset-8">Find Food</h1>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Live donation map with pin drops for available food pickups.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <DashboardRefreshButton />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, location, or category..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-12 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 focus:border-orange-200 focus:bg-white transition-all"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="rounded-xl bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2">Pins {donationsWithCoords.length}</span>
            <span className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2">Cities {cityCount}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="flex flex-wrap gap-2">
            {FOOD_CATEGORIES.map((option) => (
              <button
                key={option}
                onClick={() => setCategory(option)}
                className={`rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-all ${
                  category === option
                    ? "bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-200"
                    : "bg-white text-slate-400 border-slate-100 hover:border-orange-200 hover:text-orange-600"
                }`}
              >
                {option.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-50 cursor-pointer"
            >
              <option value="ALL">All Cities</option>
              {cityOptions.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>

            <button
              onClick={enableNearby}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-orange-200 hover:text-orange-600 disabled:opacity-50 transition-all font-black"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin text-orange-600" /> : <Navigation className="w-4 h-4 text-orange-600" />}
              Near Me
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_450px] gap-8">
        <div className="relative min-h-[60vh] lg:min-h-[75vh] rounded-[3.5rem] overflow-hidden border border-slate-100 bg-white shadow-2xl shadow-slate-200/30">
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-md">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
            </div>
          )}
          <div ref={mapContainer} className="h-full w-full" />
        </div>

        <aside className="rounded-[3.5rem] border border-slate-100 bg-white p-8 h-[60vh] lg:h-[75vh] overflow-y-auto shadow-2xl shadow-slate-200/30">
          <div className="flex items-center justify-between mb-8 px-2 border-l-4 border-slate-950">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-950">Active Sensors</h2>
            <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-black">{donationsWithCoords.length}</span>
          </div>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600" strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Pinging Hub...</p>
            </div>
          )}

          {!loading && donationsWithCoords.length === 0 && (
             <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                   <Package className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 max-w-xs mx-auto">No matching mission sources detected in this sector.</p>
             </div>
          )}

          <div className="space-y-4">
            {donationsWithCoords.map((item) => (
              <div
                key={item.id}
                className={`w-full text-left rounded-[2rem] border p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-50/50 group ${
                  selectedId === item.id
                    ? "border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-100"
                    : "border-slate-100 bg-white hover:border-orange-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xl font-black text-slate-950 group-hover:text-orange-600 transition-colors uppercase italic tracking-tighter line-clamp-2">{item.title}</p>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                     <MapPin className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 group-hover:border-orange-200/20 transition-all">
                   <p className="text-[10px] font-bold text-slate-400 line-clamp-1 uppercase tracking-widest ml-1">{item.pickupLocation}, {item.city}</p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    {item.quantity} Servings
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    {formatDistanceToNowStrict(new Date(item.expiryTime), { addSuffix: true })}
                  </span>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => goToDonation(item.id, item.longitude, item.latitude)}
                    className="flex-1 py-4 px-3 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Brief Intelligence
                  </button>
                  <button
                    onClick={() => requestPickup(item.id)}
                    disabled={requestingId === item.id}
                    className="flex-1 py-4 px-3 rounded-2xl border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {requestingId === item.id ? "Deploying..." : "Quick Deploy"}
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
