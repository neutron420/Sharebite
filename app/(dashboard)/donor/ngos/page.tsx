"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowLeft, Building2, Clock, Loader2, MapPin, Search, X } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Donation = {
  id: string;
  title: string;
  city: string;
  category: string;
  requests: PickupRequest[];
};

type PickupRequest = {
  id: string;
  status: string;
  updatedAt: string;
  ngo: {
    id: string;
    name: string;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

type NgoMapItem = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  requestCount: number;
  latestStatus: string;
  latestUpdatedAt: string;
  categories: string[];
  donationIds: string[];
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
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof FOOD_CATEGORIES)[number]>("ALL");
  const [city, setCity] = useState("ALL");

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
    if (!donorId) {
      return;
    }

    const fetchDonations = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ donorId });

        if (search) {
          params.set("search", search);
        }
        if (category !== "ALL") {
          params.set("category", category);
        }
        if (city !== "ALL") {
          params.set("city", city);
        }

        const res = await fetch(`/api/donations?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch donor NGO network");
        }

        const data = (await res.json()) as Donation[];
        setDonations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Donor NGO map fetch error:", error);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchDonations();
  }, [donorId, search, category, city]);

  const cityOptions = useMemo(() => {
    return Array.from(new Set(donations.map((d) => d.city).filter(Boolean))).sort();
  }, [donations]);

  const ngoMapItems = useMemo(() => {
    const byNgo = new Map<string, NgoMapItem>();

    for (const donation of donations) {
      for (const req of donation.requests || []) {
        const ngo = req.ngo;
        if (!ngo || typeof ngo.latitude !== "number" || typeof ngo.longitude !== "number") {
          continue;
        }

        const existing = byNgo.get(ngo.id);
        if (!existing) {
          byNgo.set(ngo.id, {
            id: ngo.id,
            name: ngo.name,
            city: ngo.city || "Unknown",
            latitude: ngo.latitude,
            longitude: ngo.longitude,
            requestCount: 1,
            latestStatus: req.status,
            latestUpdatedAt: req.updatedAt,
            categories: [donation.category],
            donationIds: [donation.id],
          });
          continue;
        }

        existing.requestCount += 1;
        if (!existing.categories.includes(donation.category)) {
          existing.categories.push(donation.category);
        }
        if (!existing.donationIds.includes(donation.id)) {
          existing.donationIds.push(donation.id);
        }
        if (new Date(req.updatedAt).getTime() > new Date(existing.latestUpdatedAt).getTime()) {
          existing.latestUpdatedAt = req.updatedAt;
          existing.latestStatus = req.status;
        }
      }
    }

    return Array.from(byNgo.values()).sort((a, b) => b.requestCount - a.requestCount);
  }, [donations]);

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
        `<div style="font-family:system-ui,sans-serif;padding:4px 2px;min-width:190px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:13px;color:#0f172a;">${ngo.name}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#475569;">${ngo.city}</p>
          <p style="margin:0;font-size:11px;color:#64748b;">Requests: ${ngo.requestCount} | ${ngo.latestStatus}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: "#ea580c" })
        .setLngLat([ngo.longitude, ngo.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedNgoId(ngo.id);
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
    <div className="min-h-screen bg-[#FCFCFD] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 rounded-3xl bg-white border border-slate-200 p-6">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/donor");
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="mt-3 text-2xl lg:text-3xl font-black tracking-tight uppercase italic">NGO Network Map</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">Map of NGOs who requested pickups from your donations.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by donation title"
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

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 items-center">
          <div className="flex flex-wrap gap-2">
            {FOOD_CATEGORIES.map((option) => (
              <button
                key={option}
                onClick={() => setCategory(option)}
                className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider border transition-colors ${
                  category === option
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                }`}
              >
                {option.replaceAll("_", " ")}
              </button>
            ))}
          </div>

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
            {ngoMapItems.map((ngo) => (
              <div
                key={ngo.id}
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
                      <MapPin className="w-3.5 h-3.5" />
                      {ngo.requestCount} requests
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNowStrict(new Date(ngo.latestUpdatedAt), { addSuffix: true })}
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
                    onClick={() => router.push(`/donor/donations/${ngo.donationIds[0]}`)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-orange-400 hover:text-orange-700 transition-colors"
                  >
                    View Request
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
