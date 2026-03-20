"use client";

import { Suspense } from "react";
import ShareBiteLogin from "@/components/ui/sharebite-login";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"></div>}>
      <ShareBiteLogin showRoleSelector={true} defaultRole="DONOR" />
    </Suspense>
  );
}
