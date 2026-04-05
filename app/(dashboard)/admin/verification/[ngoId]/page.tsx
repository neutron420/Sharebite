"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

type VerificationStatus =
  | "PENDING"
  | "ONLINE_VERIFIED"
  | "FIELD_VISIT_SCHEDULED"
  | "FIELD_VERIFIED"
  | "FULLY_VERIFIED"
  | "REJECTED";

interface VerificationItem {
  ngoId: string;
  name: string;
  email: string;
  city: string | null;
  address: string | null;
  phoneNumber: string | null;
  createdAt: string;
  isVerified: boolean;
  status: VerificationStatus;
  onlineVerified: boolean;
  groundVerified: boolean;
  lastVerifiedAt: string | null;
  nextReverificationAt: string | null;
  registrationCertUrl: string | null;
  panTanUrl: string | null;
  bankProofUrl: string | null;
  addressProofUrl: string | null;
  contactPersonIdUrl: string | null;
  onlineReviewNote: string | null;
  fieldVisitCity: string | null;
  fieldOfficerId: string | null;
  fieldOfficerName: string | null;
  fieldVisitScheduledAt: string | null;
  rejectionReason: string | null;
}

interface FieldOfficer {
  id: string;
  name: string;
  email: string;
  city: string | null;
}

interface DetailResponse {
  item: VerificationItem;
  fieldOfficers: FieldOfficer[];
}

const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Pending",
  ONLINE_VERIFIED: "Online Verified",
  FIELD_VISIT_SCHEDULED: "Field Visit Scheduled",
  FIELD_VERIFIED: "Field Verified",
  FULLY_VERIFIED: "Fully Verified",
  REJECTED: "Rejected",
};

const STATUS_STYLES: Record<VerificationStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ONLINE_VERIFIED: "bg-blue-50 text-blue-700",
  FIELD_VISIT_SCHEDULED: "bg-orange-50 text-orange-700",
  FIELD_VERIFIED: "bg-emerald-50 text-emerald-700",
  FULLY_VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function NgoVerificationDetailPage() {
  const { addListener, isConnected } = useSocket();
  const params = useParams();
  const ngoId = typeof params.ngoId === "string" ? params.ngoId : "";

  const [item, setItem] = useState<VerificationItem | null>(null);
  const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [docForm, setDocForm] = useState({
    registrationCertUrl: "",
    panTanUrl: "",
    bankProofUrl: "",
    addressProofUrl: "",
    contactPersonIdUrl: "",
    onlineReviewNote: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    fieldOfficerId: "",
    fieldVisitCity: "",
    fieldVisitScheduledAt: "",
  });

  const [finalReviewNote, setFinalReviewNote] = useState("");
  const [reverifyInMonths, setReverifyInMonths] = useState("6");
  const [rejectionReason, setRejectionReason] = useState("");

  const hydrateForms = useCallback((nextItem: VerificationItem) => {
    setDocForm({
      registrationCertUrl: nextItem.registrationCertUrl || "",
      panTanUrl: nextItem.panTanUrl || "",
      bankProofUrl: nextItem.bankProofUrl || "",
      addressProofUrl: nextItem.addressProofUrl || "",
      contactPersonIdUrl: nextItem.contactPersonIdUrl || "",
      onlineReviewNote: nextItem.onlineReviewNote || "",
    });

    setScheduleForm({
      fieldOfficerId: nextItem.fieldOfficerId || "",
      fieldVisitCity: nextItem.fieldVisitCity || nextItem.city || "",
      fieldVisitScheduledAt: toDateTimeInputValue(nextItem.fieldVisitScheduledAt),
    });

    setFinalReviewNote("");
    setReverifyInMonths("6");
    setRejectionReason(nextItem.rejectionReason || "");
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!ngoId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/ngo-verifications/${ngoId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to load NGO verification details");
      }

      const data = (await res.json()) as DetailResponse;
      setItem(data.item);
      setFieldOfficers(data.fieldOfficers || []);
      hydrateForms(data.item);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [ngoId, hydrateForms]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const unsubscribe = addListener("NGO_VERIFICATION_UPDATED", () => {
      void fetchDetail();
    });

    return () => unsubscribe();
  }, [addListener, fetchDetail]);

  const canScheduleFieldVisit = useMemo(() => {
    if (!item) return false;
    return item.status === "ONLINE_VERIFIED";
  }, [item]);

  const isWorkflowLockedForGroundStep = useMemo(() => {
    if (!item) return true;
    return (
      item.status === "FIELD_VISIT_SCHEDULED" ||
      item.status === "FIELD_VERIFIED" ||
      item.status === "FULLY_VERIFIED"
    );
  }, [item]);

  const isOnlineStepLocked = useMemo(() => {
    if (!item) return true;
    return isWorkflowLockedForGroundStep;
  }, [item, isWorkflowLockedForGroundStep]);

  const scheduleDisableReason = useMemo(() => {
    if (!item) return "NGO details are still loading.";
    if (isWorkflowLockedForGroundStep) {
      if (item.status === "FIELD_VISIT_SCHEDULED") {
        return "Field assignment is locked. Ground Admin verification is pending.";
      }
      if (item.status === "FIELD_VERIFIED") {
        return "Ground verification completed. Proceed to final approval.";
      }
      if (item.status === "FULLY_VERIFIED") {
        return "This NGO is already fully verified and locked.";
      }
    }

    if (!canScheduleFieldVisit) {
      if (item.status === "PENDING") {
        return "Complete Online Verification first, then assign Ground Admin.";
      }
      if (item.status === "REJECTED") {
        return "Rejected NGOs cannot be scheduled for field verification.";
      }
      return "Field scheduling is not allowed in the current status.";
    }

    if (fieldOfficers.length === 0) {
      return "No Ground Admin accounts are available yet.";
    }
    return "";
  }, [item, canScheduleFieldVisit, fieldOfficers.length, isWorkflowLockedForGroundStep]);

  const runAction = async (action: string, payload: Record<string, unknown>) => {
    if (!item) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/ngo-verifications/${item.ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, ...payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Action failed");
      }

      await fetchDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Loading workflow details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link href="/admin/verification" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Verification Queue
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center space-y-4">
          <XCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-gray-700 font-semibold">{error || "NGO not found"}</p>
          <button
            onClick={() => void fetchDetail()}
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
      <div className="flex flex-col gap-3">
        <Link href="/admin/verification" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Verification Queue
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500">{item.email}</p>
            <p className={`text-xs mt-2 inline-flex items-center gap-2 ${isConnected ? "text-emerald-600" : "text-gray-400"}`}>
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-300"}`} />
              {isConnected ? "Live sync enabled" : "Live sync reconnecting"}
            </p>
          </div>

          <button
            onClick={() => void fetchDetail()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_STYLES[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
          Online: {item.onlineVerified ? "Yes" : "No"}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
          Ground: {item.groundVerified ? "Yes" : "No"}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase">Phone</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{item.phoneNumber || "Not provided"}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase">Address</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{item.address || "Not provided"}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase">Timeline</p>
          <p className="text-xs text-gray-700 mt-1 inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(item.createdAt)}
          </p>
          <p className="text-xs text-gray-700 mt-1 inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Last verified {formatDate(item.lastVerifiedAt)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Online Document Check</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            ["Registration Certificate", "registrationCertUrl"],
            ["PAN/TAN", "panTanUrl"],
            ["Bank Details Proof", "bankProofUrl"],
            ["Address Proof", "addressProofUrl"],
            ["Contact Person ID", "contactPersonIdUrl"],
          ].map(([label, key]) => (
            <label key={key} className="block">
              <span className="text-[11px] text-gray-500 uppercase">{label}</span>
              <div className="mt-1 flex gap-2">
                <input
                  value={docForm[key as keyof typeof docForm]}
                  onChange={(e) =>
                    setDocForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  disabled={isOnlineStepLocked || actionLoading}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
                {!!docForm[key as keyof typeof docForm] && (
                  <a
                    href={docForm[key as keyof typeof docForm]}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                  </a>
                )}
              </div>
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-[11px] text-gray-500 uppercase">Online Review Note</span>
          <textarea
            value={docForm.onlineReviewNote}
            onChange={(e) => setDocForm((prev) => ({ ...prev, onlineReviewNote: e.target.value }))}
            disabled={isOnlineStepLocked || actionLoading}
            className="mt-1 w-full min-h-[72px] px-3 py-2 text-xs border border-gray-200 rounded-lg"
          />
        </label>

        {isOnlineStepLocked ? (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Online verification inputs are locked after field assignment. Continue with Ground Admin field verification.
          </p>
        ) : null}

        <button
          disabled={actionLoading || isOnlineStepLocked}
          onClick={() =>
            runAction("ONLINE_VERIFY", {
              registrationCertUrl: docForm.registrationCertUrl,
              panTanUrl: docForm.panTanUrl,
              bankProofUrl: docForm.bankProofUrl,
              addressProofUrl: docForm.addressProofUrl,
              contactPersonIdUrl: docForm.contactPersonIdUrl,
              onlineReviewNote: docForm.onlineReviewNote,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <FileText className="h-3.5 w-3.5" /> Mark Online Verified
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Schedule Field Verification (Ground Admin Only)</h3>

        {fieldOfficers.length === 0 ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            No Ground Admin available yet. Ask the field officer to register/login from the dedicated Ground Admin portal.
          </p>
        ) : null}

        <div className="grid md:grid-cols-3 gap-3">
          <label className="block md:col-span-1">
            <span className="text-[11px] text-gray-500 uppercase">Ground Admin</span>
            <select
              value={scheduleForm.fieldOfficerId}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, fieldOfficerId: e.target.value }))}
              disabled={!!scheduleDisableReason || actionLoading}
              className="mt-1 w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
            >
              <option value="">Select Ground Admin</option>
              {fieldOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} ({officer.city || "No city"})
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-1">
            <span className="text-[11px] text-gray-500 uppercase">Visit City</span>
            <input
              value={scheduleForm.fieldVisitCity}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, fieldVisitCity: e.target.value }))}
              disabled={!!scheduleDisableReason || actionLoading}
              className="mt-1 w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="text-[11px] text-gray-500 uppercase">Visit Date/Time</span>
            <input
              type="datetime-local"
              value={scheduleForm.fieldVisitScheduledAt}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, fieldVisitScheduledAt: e.target.value }))}
              disabled={!!scheduleDisableReason || actionLoading}
              className="mt-1 w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </label>
        </div>

        <button
          disabled={actionLoading || !!scheduleDisableReason}
          onClick={() => {
            if (!scheduleForm.fieldOfficerId) {
              alert("Please select a Ground Admin before assigning.");
              return;
            }

            if (!scheduleForm.fieldVisitCity.trim()) {
              alert("Please provide the field visit city.");
              return;
            }

            runAction("SCHEDULE_FIELD_VISIT", {
              fieldOfficerId: scheduleForm.fieldOfficerId,
              fieldVisitCity: scheduleForm.fieldVisitCity,
              fieldVisitScheduledAt: scheduleForm.fieldVisitScheduledAt
                ? new Date(scheduleForm.fieldVisitScheduledAt).toISOString()
                : null,
            });
          }}
          title={scheduleDisableReason || "Assign Ground Admin"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
        >
          <UserRound className="h-3.5 w-3.5" />
          Assign Ground Admin
        </button>

        {scheduleDisableReason ? (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {scheduleDisableReason}
          </p>
        ) : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Final Approval</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] text-gray-500 uppercase">Final Review Note</span>
            <textarea
              value={finalReviewNote}
              onChange={(e) => setFinalReviewNote(e.target.value)}
              className="mt-1 w-full min-h-[72px] px-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-gray-500 uppercase">Re-verify In Months (6-12)</span>
            <input
              type="number"
              min={6}
              max={12}
              value={reverifyInMonths}
              onChange={(e) => setReverifyInMonths(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </label>
        </div>

        <button
          disabled={actionLoading}
          onClick={() =>
            runAction("FINAL_APPROVE", {
              finalReviewNote,
              reverifyInMonths: Number(reverifyInMonths),
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          <UserCheck className="h-3.5 w-3.5" /> Mark Fully Verified
        </button>
      </div>

      <div className="bg-white border border-red-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-red-700">Reject / Needs Recheck</h3>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Reason for rejection or recheck"
          className="w-full min-h-[72px] px-3 py-2 text-xs border border-red-200 rounded-lg"
        />
        <div className="flex flex-wrap gap-2">
          <button
            disabled={actionLoading}
            onClick={() => runAction("REJECT", { rejectionReason, needsRecheck: true })}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Needs Recheck
          </button>
          <button
            disabled={actionLoading}
            onClick={() => runAction("REJECT", { rejectionReason, needsRecheck: false })}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2">
        <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> City: {item.city || "Not set"}</p>
        <p>Assigned Ground Admin: {item.fieldOfficerName || "Unassigned"}</p>
        <p>Field Visit: {item.fieldVisitScheduledAt ? new Date(item.fieldVisitScheduledAt).toLocaleString() : "Not scheduled"}</p>
      </div>
    </div>
  );
}
