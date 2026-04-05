"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

interface VerificationItem {
  ngoId: string;
  name: string;
  email: string;
  city: string | null;
  status: string;
  fieldVisitCity: string | null;
  fieldOfficerId: string | null;
  fieldOfficerName: string | null;
  fieldVisitScheduledAt: string | null;
  address: string | null;
  phoneNumber: string | null;
}

interface ActorInfo {
  id: string;
  name: string;
  email: string;
  city: string | null;
}

interface ApiResponse {
  items: VerificationItem[];
  actor: ActorInfo;
}

export default function GroundAdminDashboardPage() {
  const { addListener, isConnected } = useSocket();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [actor, setActor] = useState<ActorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VerificationItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [officeExists, setOfficeExists] = useState(true);
  const [keyPersonConfirmed, setKeyPersonConfirmed] = useState(true);
  const [fieldNotes, setFieldNotes] = useState("");
  const [checkInLatitude, setCheckInLatitude] = useState("");
  const [checkInLongitude, setCheckInLongitude] = useState("");
  const [checkOutLatitude, setCheckOutLatitude] = useState("");
  const [checkOutLongitude, setCheckOutLongitude] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("scope", "field");
      params.set("limit", "100");
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/ngo-verifications?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        const message =
          errorPayload?.error ||
          errorPayload?.message ||
          `Failed to load field verification assignments (${res.status})`;
        throw new Error(message);
      }

      const data = (await res.json()) as ApiResponse;
      setItems(data.items || []);
      setActor(data.actor || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const unsubscribe = addListener("NGO_VERIFICATION_UPDATED", () => {
      void fetchItems();
    });

    return () => unsubscribe();
  }, [addListener, fetchItems]);

  const openReportModal = (item: VerificationItem) => {
    setSelected(item);
    setOfficeExists(true);
    setKeyPersonConfirmed(true);
    setFieldNotes("");
    setCheckInLatitude("");
    setCheckInLongitude("");
    setCheckOutLatitude("");
    setCheckOutLongitude("");
    setEvidenceUrls("");
  };

  const submitFieldReport = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);

      const evidencePhotoUrls = evidenceUrls
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/ngo-verifications/${selected.ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "SUBMIT_FIELD_REPORT",
          officeExists,
          keyPersonConfirmed,
          fieldChecklist: {
            officeExists,
            keyPersonConfirmed,
            locationMatched: !!selected.fieldVisitCity,
          },
          fieldNotes,
          fieldEvidencePhotoUrls: evidencePhotoUrls,
          fieldCheckInAt: new Date().toISOString(),
          fieldCheckOutAt: new Date().toISOString(),
          fieldCheckInLatitude: checkInLatitude,
          fieldCheckInLongitude: checkInLongitude,
          fieldCheckOutLatitude: checkOutLatitude,
          fieldCheckOutLongitude: checkOutLongitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit field report");
      }

      await fetchItems();
      setSelected(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit field report");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Loading field assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center space-y-4">
          <XCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-gray-700 font-semibold">{error}</p>
          <button
            onClick={() => void fetchItems()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ground Verification Desk</h1>
          <p className="text-sm text-gray-500 mt-1">
            City-wise on-ground verification assignments for field officers.
          </p>
          <p className={`text-xs mt-2 inline-flex items-center gap-2 ${isConnected ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-300"}`} />
            {isConnected ? "Live sync enabled" : "Live sync reconnecting"}
          </p>
        </div>
        <button
          onClick={() => void fetchItems()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          Officer: <span className="font-semibold text-gray-900">{actor?.name || "-"}</span>
          <span className="text-gray-400">|</span>
          City: <span className="font-semibold text-gray-900">{actor?.city || "Not set"}</span>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by NGO name, email, city"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.ngoId} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.email}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-orange-50 text-orange-700 font-bold">
                Field Visit Scheduled
              </span>
            </div>
            <p className="text-xs text-gray-600 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {item.fieldVisitCity || item.city || "No city"}
            </p>
            <p className="text-xs text-gray-500">Officer: {item.fieldOfficerName || "Not assigned"}</p>
            <p className="text-xs text-gray-500">Visit: {item.fieldVisitScheduledAt ? new Date(item.fieldVisitScheduledAt).toLocaleString() : "Not scheduled"}</p>

            <button
              onClick={() => openReportModal(item)}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Submit Field Report
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 text-center">
            <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No pending field verification assignments.</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-transparent" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Submit Field Report</h2>
                <p className="text-xs text-gray-500">{selected.name} ({selected.email})</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={officeExists} onChange={(e) => setOfficeExists(e.target.checked)} />
                  Office Exists
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={keyPersonConfirmed} onChange={(e) => setKeyPersonConfirmed(e.target.checked)} />
                  Key Person Confirmed
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  placeholder="Check-in latitude"
                  value={checkInLatitude}
                  onChange={(e) => setCheckInLatitude(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
                <input
                  placeholder="Check-in longitude"
                  value={checkInLongitude}
                  onChange={(e) => setCheckInLongitude(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
                <input
                  placeholder="Check-out latitude"
                  value={checkOutLatitude}
                  onChange={(e) => setCheckOutLatitude(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
                <input
                  placeholder="Check-out longitude"
                  value={checkOutLongitude}
                  onChange={(e) => setCheckOutLongitude(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>

              <label className="block">
                <span className="text-[11px] text-gray-500 uppercase">Evidence Image URLs (one per line)</span>
                <textarea
                  value={evidenceUrls}
                  onChange={(e) => setEvidenceUrls(e.target.value)}
                  className="mt-1 w-full min-h-[84px] px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </label>

              <label className="block">
                <span className="text-[11px] text-gray-500 uppercase">Field Notes</span>
                <textarea
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  className="mt-1 w-full min-h-[84px] px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </label>

              <button
                disabled={actionLoading}
                onClick={submitFieldReport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Submit Field Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
