"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NgoDonationsIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /ngo/donations to /ngo/history for better mission log organization
    router.replace("/ngo/history");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-orange-600 animate-spin" strokeWidth={3} />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        Rerouting to Mission Archive...
      </p>
    </div>
  );
}
