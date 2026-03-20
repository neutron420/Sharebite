"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, MapPin, Package, Clock, ArrowLeft, Search, X, Navigation } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";

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

export default function DonationsMapPage() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    if (!donationsWithCoords.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [donationsWithCoords, selectedId]);

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
    <div className="min-h-screen bg-[#FCFCFD] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 rounded-3xl bg-white border border-slate-200 p-6">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/ngo");
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight uppercase ">Find Food</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          Live donation map with pin drops for available food pickups.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, city, location, or category"
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
            <span className="rounded-xl bg-orange-50 text-orange-700 px-3 py-2">Pins {donationsWithCoords.length}</span>
            <span className="rounded-xl bg-slate-100 px-3 py-2">Cities {cityCount}</span>
            <span className="rounded-xl bg-red-50 text-red-700 px-3 py-2">Urgent {urgentCount}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3 items-center">
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

          <div className="flex items-center gap-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700"
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:border-orange-300 disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              Near Me
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
            <button
              onClick={() => setUseNearby((prev) => !prev)}
              className={`rounded-xl px-3 py-2 border ${
                useNearby
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {useNearby ? "Nearby On" : "Nearby Off"}
            </button>
            <span>{radiusKm} km</span>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-28 accent-orange-600"
              disabled={!useNearby}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_420px] gap-6">
        <div className="relative min-h-[55vh] lg:min-h-[74vh] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          )}
          <div ref={mapContainer} className="h-full w-full" />
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5 h-[55vh] lg:h-[74vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">Available Pins</h2>
            <span className="text-xs font-black text-orange-600">{donationsWithCoords.length}</span>
          </div>

          {loading && (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-orange-600" />
            </div>
          )}

          {!loading && donationsWithCoords.length === 0 && (
            <p className="p-4 text-sm font-bold text-slate-500">No matching donations for this search.</p>
          )}

          <div className="space-y-3">
            {donationsWithCoords.map((item) => (
              <div
                key={item.id}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  selectedId === item.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-slate-900 line-clamp-2">{item.title}</p>
                  <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                </div>

                <p className="mt-2 text-xs font-bold text-slate-500 line-clamp-1">{item.pickupLocation}, {item.city}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {item.quantity}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNowStrict(new Date(item.expiryTime), { addSuffix: true })}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => goToDonation(item.id, item.longitude, item.latitude)}
                    className="flex-1 rounded-xl bg-slate-900 text-white px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-orange-600 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => requestPickup(item.id)}
                    disabled={requestingId === item.id}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-orange-400 hover:text-orange-700 transition-colors disabled:opacity-50"
                  >
                    {requestingId === item.id ? "Requesting..." : "Quick Request"}
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
