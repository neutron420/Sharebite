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
  ChevronRight,
  Info,
  Search,
} from "lucide-react";
import {
  Drawer,
  Paper,
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
  Fade,
} from "@mui/material";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";


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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Stats for the selected item's charts
  const [itemStats, setItemStats] = useState<any[]>([]);

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
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg style="transform: rotate(45deg); width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
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
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg style="transform: rotate(45deg); width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
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
      <Box className="flex items-center justify-center h-96">
        <Paper className="rounded-3xl shadow-2xl p-8 max-w-md text-center space-y-4 border border-gray-100 bg-white/80 backdrop-blur-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <Typography variant="h6" className="font-bold text-gray-900">Map Error</Typography>
          <Typography className="text-gray-500">{error}</Typography>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all font-semibold shadow-lg shadow-orange-200">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </Paper>
      </Box>
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
      <div className="relative bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: "650px" }}>
        {/* Map */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
            <Stack alignItems="center" spacing={2}>
              <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              <Typography variant="body2" className="text-gray-500 font-medium">Syncing Satellite Data...</Typography>
            </Stack>
          </div>
        )}

        {/* Premium Control Panel (MUI Paper with Glassmorphism) */}
        {mapReady && (
          <Fade in={mapReady}>
            <Paper 
              elevation={0}
              className="absolute top-4 right-16 z-10 w-56 rounded-xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-2xl p-3.5 space-y-3.5"
            >
              {/* Location Search */}
              <Box className="relative mb-2">
                <input
                  type="text"
                  placeholder="Fly to location..."
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const query = (e.currentTarget as HTMLInputElement).value;
                      if (!query) return;
                      try {
                        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
                        const data = await res.json();
                        if (data.features && data.features.length > 0) {
                          const [lng, lat] = data.features[0].center;
                          map.current?.flyTo({ center: [lng, lat], zoom: 12 });
                        }
                      } catch (err) { console.error("Search error", err); }
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 text-[11px] border border-white/60 rounded-lg bg-white/80 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              </Box>

              <Stack direction="row" alignItems="center" spacing={1} className="mb-1">
                <Box className="bg-orange-100 p-1 rounded-md">
                  <Layers className="h-3.5 w-3.5 text-orange-600" />
                </Box>
                <Typography className="text-[11px] font-bold text-gray-800 uppercase tracking-tighter">Visual Layers</Typography>
              </Stack>

              <Stack spacing={1.5}>
                <Box className="flex items-center justify-between p-1.5 rounded-lg bg-white/40 border border-white/50">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                    <Typography className="text-[11px] font-semibold text-gray-600">Donations</Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => setShowDonations(!showDonations)}
                    className={showDonations ? "text-orange-500" : "text-gray-300"}
                    sx={{ p: 0.5 }}
                  >
                    {showDonations ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </IconButton>
                </Box>

                <Box className="flex items-center justify-between p-1.5 rounded-lg bg-white/40 border border-white/50">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                    <Typography className="text-[11px] font-semibold text-gray-600">NGOs</Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => setShowNGOs(!showNGOs)}
                    className={showNGOs ? "text-green-500" : "text-gray-300"}
                    sx={{ p: 0.5 }}
                  >
                    {showNGOs ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </IconButton>
                </Box>

                <Box className="flex items-center justify-between p-1.5 rounded-lg bg-white/40 border border-white/50">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                    <Typography className="text-[11px] font-semibold text-gray-600">Donors</Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => setShowDonors(!showDonors)}
                    className={showDonors ? "text-orange-500" : "text-gray-300"}
                    sx={{ p: 0.5 }}
                  >
                    {showDonors ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </IconButton>
                </Box>
              </Stack>

              <Divider className="opacity-50" />

              <Box>
                <Typography className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 px-1">Global Filter</Typography>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-[10px] border border-white/60 rounded-lg bg-white/80 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="all">All Operations</option>
                  <option value="AVAILABLE">Available Now</option>
                  <option value="REQUESTED">In Negotiation</option>
                  <option value="APPROVED">En Route</option>
                  <option value="COLLECTED">Success Only</option>
                </select>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Cinematic Sidebar (MUI Drawer) */}
        <Drawer
          anchor="right"
          open={!!selectedItem}
          onClose={() => { setSelectedItem(null); setSelectedType(null); }}
          PaperProps={{
            sx: { 
              width: { xs: '100%', sm: 360 }, 
              borderLeft: 'none', 
              background: 'rgba(255,255,255,0.9)', 
              backdropFilter: 'blur(20px)',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
            }
          }}
        >
          {selectedItem && (
            <Box className="h-full flex flex-col p-8">
              <Stack direction="row" alignItems="center" justifyContent="space-between" className="mb-8">
                <Box className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedType === 'donation' ? 'bg-red-100 text-red-600' : 
                  selectedType === 'ngo' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {selectedType} Overview
                </Box>
                <IconButton onClick={() => { setSelectedItem(null); setSelectedType(null); }} className="hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </IconButton>
              </Stack>

              {/* Header Info */}
              <Stack spacing={3} className="mb-8">
                <Box className="relative">
                  {((selectedItem as any).imageUrl) ? (
                    <img 
                      src={(selectedItem as any).imageUrl} 
                      className="w-full h-48 rounded-3xl object-cover shadow-xl border-4 border-white"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute -bottom-4 right-6 bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                     <Info className="h-5 w-5 text-orange-500" />
                  </div>
                </Box>

                <Box>
                  <Typography variant="h5" className="font-bold text-gray-900 leading-tight">
                    {(selectedItem as any).name || (selectedItem as any).title}
                  </Typography>
                  <Typography className="text-gray-500 mt-1 flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5" /> {(selectedItem as any).city || "Local Area"}
                  </Typography>
                </Box>
              </Stack>

              <Divider className="mb-6" />

              {/* Dynamic Insights Section */}
              <Box className="mb-8">
                <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location Insight</Typography>
                <Box className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 h-64">
                   {/* This is where a chart would go - using a placeholder radar for premium feel */}
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Speed', A: 120, fullMark: 150 },
                        { subject: 'Reliability', A: 98, fullMark: 150 },
                        { subject: 'Safety', A: 86, fullMark: 150 },
                        { subject: 'Quantity', A: 99, fullMark: 150 },
                        { subject: 'Urgency', A: 85, fullMark: 150 },
                      ]}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <Radar name="Ability" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                      </RadarChart>
                   </ResponsiveContainer>
                </Box>
              </Box>

              <Stack spacing={2}>
                 <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metadata</Typography>
                 <Box className="grid grid-cols-2 gap-4">
                    <Box className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                       <Typography className="text-[10px] text-gray-400 uppercase font-bold">Registration</Typography>
                       <Typography className="text-sm font-bold text-gray-700">Verified</Typography>
                    </Box>
                    <Box className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                       <Typography className="text-[10px] text-gray-400 uppercase font-bold">Total Operations</Typography>
                       <Typography className="text-sm font-bold text-gray-700">142</Typography>
                    </Box>
                 </Box>
              </Stack>

              <Box className="mt-auto pt-6">
                <button 
                  onClick={() => { setSelectedItem(null); setSelectedType(null); }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200"
                >
                  Close Insights
                </button>
              </Box>
            </Box>
          )}
        </Drawer>
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
