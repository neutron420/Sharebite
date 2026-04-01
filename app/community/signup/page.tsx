"use client";

import { Suspense } from "react";
import CommunityRegister from "@/components/ui/community-register";

export default function CommunitySignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-orange-50 flex items-center justify-center p-4"></div>}>
      <CommunityRegister />
    </Suspense>
  );
}
