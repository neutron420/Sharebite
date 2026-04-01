"use client";

import { Suspense } from "react";
import ShareBiteLogin from "@/components/ui/sharebite-login";

export default function CommunityLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-orange-50 flex items-center justify-center p-4"></div>}>
      <ShareBiteLogin showRoleSelector={false} defaultRole="COMMUNITY" registerUrl="/community/signup" />
    </Suspense>
  );
}
