"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Star,
  Search,
  RefreshCw,
  XCircle,
  User,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string; email: string; role: string };
  reviewee: { id: string; name: string; email: string; role: string };
  donation: { id: string; title: string };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const itemsPerPage = 10;

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      setReviews(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Filter reviews
  const filtered = reviews.filter((r) => {
    const matchesSearch = 
      r.reviewer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.reviewee.name.toLowerCase().includes(search.toLowerCase()) ||
      r.donation.title.toLowerCase().includes(search.toLowerCase());
    const matchesRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";
  const stats = {
    total: reviews.length,
    avgRating,
    fiveStars: reviews.filter((r) => r.rating === 5).length,
    oneStars: reviews.filter((r) => r.rating === 1).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading reviews...</p>
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
          <button onClick={fetchReviews} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
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
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor user reviews and ratings</p>
        </div>
        <button onClick={fetchReviews} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Average Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-yellow-500">{stats.avgRating}</p>
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">5-Star Reviews</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.fiveStars}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">1-Star Reviews</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.oneStars}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reviewer, reviewee, or donation..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginated.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <StarRating rating={r.rating} />
              <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                {r.reviewer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{r.reviewer.name}</p>
                <p className="text-xs text-gray-500">reviewed {r.reviewee.name}</p>
              </div>
            </div>

            {r.comment && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{r.comment}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Package className="h-3.5 w-3.5" />
              <span className="truncate">{r.donation.title}</span>
            </div>

            <button
              onClick={() => setSelectedReview(r)}
              className="w-full mt-4 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              View Details
            </button>
          </div>
        ))}
        {paginated.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReview(null)}>
          <div className="absolute inset-0 bg-gray-900/10" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Review Details</h2>
              <button onClick={() => setSelectedReview(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <StarRating rating={selectedReview.rating} />
                <span className="text-sm text-gray-500">{formatDate(selectedReview.createdAt)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs text-orange-600 uppercase font-medium">Reviewer</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedReview.reviewer.name}</p>
                  <p className="text-xs text-gray-500">{selectedReview.reviewer.email}</p>
                  <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">{selectedReview.reviewer.role}</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 uppercase font-medium">Reviewee</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedReview.reviewee.name}</p>
                  <p className="text-xs text-gray-500">{selectedReview.reviewee.email}</p>
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{selectedReview.reviewee.role}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Donation</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedReview.donation.title}</p>
              </div>

              {selectedReview.comment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 uppercase">Comment</p>
                  </div>
                  <p className="text-sm text-gray-700">{selectedReview.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
