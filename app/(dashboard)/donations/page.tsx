"use client";

import DonationsMapView from "@/components/donations/donations-map-view";

export default function DonationsPage() {
  return (
    <div className="min-h-screen bg-white p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <DonationsMapView />
      </div>
    </div>
  );
}
