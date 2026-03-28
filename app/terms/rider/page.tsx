"use client";

import React from "react";
import TermsTemplate from "@/components/ui/terms-template";
import { Truck, Utensils, Shield, Scale, ScrollText, CheckCircle2 } from "lucide-react";

export default function RiderTermsPage() {
  const sections = [
    {
      title: "1. Reliable Delivery",
      icon: <Truck className="w-5 h-5" />,
      content: [
        "As a Rider, you agree to complete all accepted missions efficiently and reliably.",
        "Riders must ensure that food is transported in a manner that maintains its safety and quality, as per the guidelines provided by the Donor and NGO.",
        "Riders should handle food items with care and ensure they are delivered in the same condition as they were received.",
      ],
    },
    {
      title: "2. Communication & Safety",
      icon: <Truck className="w-5 h-5" />,
      content: [
        "Riders are expected to communicate clearly with Donors and NGOs regarding pickup and delivery times.",
        "Any delays or issues with the delivery should be reported promptly to the relevant parties through the platform.",
        "Riders are responsible for their own safety while on the platform and should follow all local traffic laws and regulations.",
      ],
    },
    {
      title: "3. Professionalism & Feedback",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: [
        "Riders should maintain a professional attitude in all interactions with Donors, NGOs, and ShareBite administrators.",
        "Riders are encouraged to provide feedback on their experiences with Donors and NGOs to help us improve the platform.",
        "Recurring issues or complaints from Donors and NGOs may result in the rider's account being suspended.",
      ],
    },
    {
      title: "4. Code of Conduct",
      icon: <Scale className="w-5 h-5" />,
      content: [
        "Riders must not solicit payments or favors from Donors or NGOs in exchange for the delivery of food.",
        "Riders should follow all guidelines and instructions provided by ShareBite regarding the collection and delivery of donations.",
      ],
    },
  ];

  return (
    <TermsTemplate
      role="Rider"
      roleIcon={<Truck className="w-8 h-8 text-emerald-600" />}
      lastUpdated="March 2026"
      sections={sections}
      accentColor="emerald"
    />
  );
}
