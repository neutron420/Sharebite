"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Bike,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  ReceiptText,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; city: string | null };
  requests: Array<{
    id: string;
    status: string;
    step: number;
    ngoId: string;
    riderId: string | null;
    ngo: { id: string; name: string; email: string; city: string | null };
    rider: { id: string; name: string; email: string; city: string | null } | null;
    donation: { id: string; title: string; category: string; city: string };
  }>;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-600", icon: Clock },
  SUCCESS: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle2 },
  FAILED: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function shortId(value: string) {
  if (!value) return "N/A";
  return value.length > 14 ? `${value.slice(0, 7)}...${value.slice(-5)}` : value;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const itemsPerPage = 10;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/payments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = payments.filter((payment) => {
    const request = payment.requests[0];
    const riderName = request?.rider?.name || "";
    const donationTitle = request?.donation?.title || "";
    const ngoName = payment.user?.name || request?.ngo?.name || "";

    const query = search.toLowerCase();
    const matchesSearch =
      payment.razorpayOrderId.toLowerCase().includes(query) ||
      (payment.razorpayPaymentId || "").toLowerCase().includes(query) ||
      ngoName.toLowerCase().includes(query) ||
      riderName.toLowerCase().includes(query) ||
      donationTitle.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: payments.length,
    success: payments.filter((p) => p.status === "SUCCESS").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    totalAmount: payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4 border border-gray-200">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchPayments}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track NGO to rider payment records and settlement details
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.success}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Settled Value</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatInr(stats.totalAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order id, payment id, NGO, rider, donation..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">NGO</th>
                <th className="px-6 py-4">Rider</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((payment) => {
                const request = payment.requests[0];
                const ngo = payment.user || request?.ngo;
                const rider = request?.rider;
                const statusStyle = STATUS_STYLES[payment.status] || STATUS_STYLES.PENDING;
                const StatusIcon = statusStyle.icon;

                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 font-mono">{shortId(payment.razorpayOrderId)}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {payment.razorpayPaymentId ? shortId(payment.razorpayPaymentId) : "Payment ID pending"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-900">{ngo?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500">{ngo?.city || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-900">{rider?.name || "Unassigned"}</p>
                          <p className="text-xs text-gray-500">{rider?.city || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{formatInr(payment.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(payment.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 px-3">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPayment(null)}>
          <div className="absolute inset-0 bg-transparent" />
          <div
            className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/50 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-orange-600 uppercase font-medium">Settlement Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatInr(selectedPayment.amount)}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedPayment.currency}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Order ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 font-mono break-all">{selectedPayment.razorpayOrderId}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Payment ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 font-mono break-all">
                    {selectedPayment.razorpayPaymentId || "Not generated yet"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Created At</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(selectedPayment.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${STATUS_STYLES[selectedPayment.status]?.bg || STATUS_STYLES.PENDING.bg} ${STATUS_STYLES[selectedPayment.status]?.text || STATUS_STYLES.PENDING.text}`}
                  >
                    {selectedPayment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-600 uppercase font-medium">NGO (Payer)</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedPayment.user.name}</p>
                  <p className="text-xs text-gray-500">{selectedPayment.user.email}</p>
                  <p className="text-xs text-gray-500">{selectedPayment.user.city || "N/A"}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bike className="h-4 w-4 text-green-700" />
                    <p className="text-xs text-green-700 uppercase font-medium">Rider (Receiver)</p>
                  </div>
                  {selectedPayment.requests[0]?.rider ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{selectedPayment.requests[0].rider?.name}</p>
                      <p className="text-xs text-gray-500">{selectedPayment.requests[0].rider?.email}</p>
                      <p className="text-xs text-gray-500">{selectedPayment.requests[0].rider?.city || "N/A"}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">No rider linked</p>
                  )}
                </div>
              </div>

              {selectedPayment.requests[0] && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-gray-700" />
                    <p className="text-xs text-gray-500 uppercase font-medium">Request Context</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Request ID</p>
                      <p className="font-medium text-gray-900 font-mono break-all">{selectedPayment.requests[0].id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Request Status</p>
                      <p className="font-medium text-gray-900">{selectedPayment.requests[0].status}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 uppercase">Donation</p>
                      <p className="font-medium text-gray-900">{selectedPayment.requests[0].donation.title}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-slate-600" />
                  <p className="text-xs text-slate-600 uppercase font-medium">Audit Identifiers</p>
                </div>
                <div className="mt-2 text-xs text-slate-600 space-y-1 font-mono break-all">
                  <p>payment_id: {selectedPayment.id}</p>
                  <p>ngo_user_id: {selectedPayment.userId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
