"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LogOut, ShieldCheck, UserRound } from "lucide-react";

interface GroundAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function GroundAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<GroundAdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthPage =
    pathname?.includes("/ground-admin/login") ||
    pathname?.includes("/ground-admin/register") ||
    pathname?.includes("/ground-admin/forgot-password");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        if (!isAuthPage) router.push("/ground-admin/login");
        return;
      }

      const data = await res.json();
      if (data.role !== "GROUND_ADMIN") {
        router.push("/ground-admin/login");
        return;
      }

      setUser(data);
    } catch {
      if (!isAuthPage) router.push("/ground-admin/login");
    } finally {
      setLoading(false);
    }
  }, [isAuthPage, router]);

  useEffect(() => {
    if (!isAuthPage) {
      void fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser, isAuthPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "GROUND_ADMIN" }),
    });
    router.push("/ground-admin/login");
  };

  if (isAuthPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading ground admin workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Ground Admin</p>
              <p className="text-xs text-gray-500">Field Verification Desk</p>
            </div>
          </div>
        </div>

        <nav className="px-3 py-4">
          <Link
            href="/ground-admin"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-700"
          >
            <ClipboardList className="h-4 w-4" /> Assignments
          </Link>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="mb-3 px-1">
            <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-gray-400" /> {user?.name || "Ground Admin"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "-"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}
