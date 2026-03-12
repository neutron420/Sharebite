"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import {
  Map as MapIcon,
  RefreshCw,
  XCircle,
  Package,
  Building2,
  Heart,
  MapPin,
  Layers,
  X,
  Eye,
  EyeOff,
} from "lucide-react";


// Mapbox token from environment variable
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Donation {
  id: string;
  title: string;
  category: string;
  status: string;
  city: string;
  state: string | null;
  district: string | null;
  pincode: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  quantity: number;
  createdAt: string;
  donor: { name: string };
}

interface NGO {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  district: string | null;
  pincode: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  isVerified: boolean;
  _count: { requests: number };
}

interface Donor {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  district: string | null;
  pincode: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  _count: { donations: number };
}

interface CityStats {
  city: string;
  _count: { id: number };
}

interface StateStats {
  state: string | null;
  _count: { id: number };
}

interface MapData {
  donations: Donation[];
  ngos: NGO[];
  donors: Donor[];
  cityStats: CityStats[];
  stateStats: StateStats[];
}

function formatCategory(c: string) {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const mapboxglRef = useRef<typeof import("mapbox-gl") | null>(null);

  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [showDonations, setShowDonations] = useState(true);
  const [showNGOs, setShowNGOs] = useState(true);
  const [showDonors, setShowDonors] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Donation | NGO | Donor | null>(null);
  const [selectedType, setSelectedType] = useState<"donation" | "ngo" | "donor" | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/map", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch map data");
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Initialize map with dynamic import
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = await import("mapbox-gl");
        mapboxglRef.current = mapboxgl;
        mapboxgl.default.accessToken = MAPBOX_TOKEN;

        map.current = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [78.9629, 20.5937], // Center of India
          zoom: 4.5,
        });

        map.current.addControl(new mapboxgl.default.NavigationControl(), "top-right");
        map.current.addControl(new mapboxgl.default.FullscreenControl(), "top-right");

        map.current.on("load", () => {
          setMapLoaded(true);
          setMapReady(true);
        });
      } catch (err) {
        console.error("Map init error:", err);
        setError("Failed to load map");
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when data or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded || !data || !mapboxglRef.current) return;

    const mapboxgl = mapboxglRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add donation markers (RED)
    if (showDonations) {
      const filteredDonations = statusFilter === "all" 
        ? data.donations 
        : data.donations.filter((d) => d.status === statusFilter);

      filteredDonations.forEach((donation) => {
        const el = document.createElement("div");
        el.className = "marker-donation";
        el.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg style="transform: rotate(45deg); width: 14px; height: 14px; color: white;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z"/>
            </svg>
          </div>
        `;

        el.addEventListener("click", () => {
          setSelectedItem(donation);
          setSelectedType("donation");
          map.current?.flyTo({ center: [donation.longitude, donation.latitude], zoom: 14 });
        });

        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([donation.longitude, donation.latitude])
          .addTo(map.current!);
        
        markersRef.current.push(marker);
      });
    }

    // Add NGO markers (GREEN)
    if (showNGOs) {
      data.ngos.forEach((ngo) => {
        const el = document.createElement("div");
        el.className = "marker-ngo";
        el.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg style="transform: rotate(45deg); width: 14px; height: 14px; color: white;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;

        el.addEventListener("click", () => {
          setSelectedItem(ngo);
          setSelectedType("ngo");
          map.current?.flyTo({ center: [ngo.longitude, ngo.latitude], zoom: 14 });
        });

        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([ngo.longitude, ngo.latitude])
          .addTo(map.current!);
        
        markersRef.current.push(marker);
      });
    }

    // Add Donor markers (ORANGE)
    if (showDonors) {
      data.donors.forEach((donor) => {
        const el = document.createElement("div");
        el.className = "marker-donor";
        el.innerHTML = `
          <div style="
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg style="transform: rotate(45deg); width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        `;

        el.addEventListener("click", () => {
          setSelectedItem(donor);
          setSelectedType("donor");
          map.current?.flyTo({ center: [donor.longitude, donor.latitude], zoom: 14 });
        });

        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([donor.longitude, donor.latitude])
          .addTo(map.current!);
        
        markersRef.current.push(marker);
      });
    }
  }, [data, mapLoaded, showDonations, showNGOs, showDonors, statusFilter]);

  // Don't block render - let map container mount

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4 border border-gray-200">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="text-gray-500">{error}</p>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Map</h1>
          <p className="text-gray-500 text-sm mt-1">View donations and NGOs across all locations</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data?.donations.length || 0}</p>
              <p className="text-sm text-gray-500">Donations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{data?.ngos.length || 0}</p>
              <p className="text-sm text-gray-500">NGOs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Heart className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{data?.donors.length || 0}</p>
              <p className="text-sm text-gray-500">Donors</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{data?.cityStats.length || 0}</p>
              <p className="text-sm text-gray-500">Cities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "600px" }}>
        {/* Map */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {mapReady && (
          <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Layers className="h-4 w-4" />
              Layers
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setShowDonations(!showDonations)}
                  className={`p-1.5 rounded-lg ${showDonations ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {showDonations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-700">Donations</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setShowNGOs(!showNGOs)}
                  className={`p-1.5 rounded-lg ${showNGOs ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {showNGOs ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">NGOs</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setShowDonors(!showDonors)}
                  className={`p-1.5 rounded-lg ${showDonors ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {showDonors ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-700">Donors</span>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="COLLECTED">Collected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
        )}

        {/* Selected Item Panel */}
        {selectedItem && (
          <div className="absolute bottom-4 left-4 right-4 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-md">
            <button
              onClick={() => { setSelectedItem(null); setSelectedType(null); }}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>

            {selectedType === "donation" && (
              <div className="flex gap-4">
                {(selectedItem as Donation).imageUrl && (
                  <img
                    src={(selectedItem as Donation).imageUrl!}
                    alt={(selectedItem as Donation).title}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-red-600">Donation</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{(selectedItem as Donation).title}</h3>
                  <p className="text-sm text-gray-500">by {(selectedItem as Donation).donor.name}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">City:</span><span className="ml-1 text-gray-700">{(selectedItem as Donation).city}</span></div>
                    <div><span className="text-gray-400">State:</span><span className="ml-1 text-gray-700">{(selectedItem as Donation).state || "N/A"}</span></div>
                    <div><span className="text-gray-400">District:</span><span className="ml-1 text-gray-700">{(selectedItem as Donation).district || "N/A"}</span></div>
                    <div><span className="text-gray-400">Pincode:</span><span className="ml-1 text-gray-700">{(selectedItem as Donation).pincode || "N/A"}</span></div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${(selectedItem as Donation).status === "AVAILABLE" ? "bg-blue-50 text-blue-600" : (selectedItem as Donation).status === "COLLECTED" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                      {(selectedItem as Donation).status}
                    </span>
                    <span className="text-xs text-gray-500">{formatCategory((selectedItem as Donation).category)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedType === "ngo" && (
              <div className="flex gap-4">
                {(selectedItem as NGO).imageUrl ? (
                  <img src={(selectedItem as NGO).imageUrl!} alt={(selectedItem as NGO).name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {(selectedItem as NGO).name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-600">NGO Partner</span>
                    {(selectedItem as NGO).isVerified && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Verified</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900">{(selectedItem as NGO).name}</h3>
                  <p className="text-sm text-gray-500">{(selectedItem as NGO)._count.requests} pickup requests</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">City:</span><span className="ml-1 text-gray-700">{(selectedItem as NGO).city || "N/A"}</span></div>
                    <div><span className="text-gray-400">State:</span><span className="ml-1 text-gray-700">{(selectedItem as NGO).state || "N/A"}</span></div>
                    <div><span className="text-gray-400">District:</span><span className="ml-1 text-gray-700">{(selectedItem as NGO).district || "N/A"}</span></div>
                    <div><span className="text-gray-400">Pincode:</span><span className="ml-1 text-gray-700">{(selectedItem as NGO).pincode || "N/A"}</span></div>
                  </div>
                </div>
              </div>
            )}

            {selectedType === "donor" && (
              <div className="flex gap-4">
                {(selectedItem as Donor).imageUrl ? (
                  <img src={(selectedItem as Donor).imageUrl!} alt={(selectedItem as Donor).name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {(selectedItem as Donor).name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-orange-600">Donor</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{(selectedItem as Donor).name}</h3>
                  <p className="text-sm text-gray-500">{(selectedItem as Donor)._count.donations} donations</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">City:</span><span className="ml-1 text-gray-700">{(selectedItem as Donor).city || "N/A"}</span></div>
                    <div><span className="text-gray-400">State:</span><span className="ml-1 text-gray-700">{(selectedItem as Donor).state || "N/A"}</span></div>
                    <div><span className="text-gray-400">District:</span><span className="ml-1 text-gray-700">{(selectedItem as Donor).district || "N/A"}</span></div>
                    <div><span className="text-gray-400">Pincode:</span><span className="ml-1 text-gray-700">{(selectedItem as Donor).pincode || "N/A"}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Donations by City</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data?.cityStats.sort((a, b) => b._count.id - a._count.id).slice(0, 10).map((stat) => (
              <div key={stat.city} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{stat.city}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(stat._count.id / Math.max(...(data?.cityStats.map(s => s._count.id) || [1]))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{stat._count.id}</span>
                </div>
              </div>
            ))}
            {(!data?.cityStats || data.cityStats.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No data available</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Donations by State</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data?.stateStats.filter((s) => s.state).sort((a, b) => b._count.id - a._count.id).slice(0, 10).map((stat) => (
              <div key={stat.state} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{stat.state}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stat._count.id / Math.max(...(data?.stateStats.filter(s => s.state).map(s => s._count.id) || [1]))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{stat._count.id}</span>
                </div>
              </div>
            ))}
            {(!data?.stateStats || data.stateStats.filter(s => s.state).length === 0) && <p className="text-sm text-gray-400 text-center py-4">No data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
