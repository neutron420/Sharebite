"use client";

import React from "react";
import TermsTemplate from "@/components/ui/terms-template";
import { Heart, Utensils, Shield, Scale, ScrollText, CheckCircle2 } from "lucide-react";

export default function DonorTermsPage() {
  const sections = [
    {
      title: "1. Food Quality & Safety",
      icon: <Utensils className="w-5 h-5" />,
      content: [
        "As a Donor, you represent and warrant that the food being donated is fit for human consumption and safe for distribution at the time of donation.",
        "You agree to provide accurate information regarding the food's condition, storage requirements, and expiry date. ShareBite is not liable for outcomes arising from inaccurate listings.",
        "Food must be stored at appropriate temperatures until collected by a Rider or NGO. Donating expired or unsafe food is grounds for immediate account suspension.",
      ],
    },
    {
      title: "2. Liability & Responsibility",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "In accordance with modern food donation protections, Donors are largely shielded from liability for food donated in good faith, provided that gross negligence is not involved.",
        "The Donor agrees that ShareBite acts only as a facilitator and platform connecting multiple parties, and does not itself handle, store, or consume the donated items.",
        "Donors are responsible for ensuring that they have the legal right to donate the surplus food from their establishment or event.",
      ],
    },
    {
      title: "3. Commitment to Honesty",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: [
        "Donors agree not to use the platform for the disposal of hazardous waste, non-food items, or items specifically excluded by ShareBite's guidelines.",
        "Accurate quantities and pickup windows are required to ensure efficient operations for NGOs and Riders. Repeated 'No-shows' or cancellations may result in penalties.",
      ],
    },
    {
      title: "4. Ethical Guidelines",
      icon: <Scale className="w-5 h-5" />,
      content: [
        "Donors shall not solicit payments or favors in exchange for donated food. The mission of ShareBite is purely philanthropic and aimed at waste reduction.",
        "Community respect and professional conduct are expected in all interactions with Riders and NGO representatives.",
      ],
    },
  ];

  return (
    <TermsTemplate
      role="Donor"
      roleIcon={<Heart className="w-8 h-8 text-orange-600" />}
      lastUpdated="March 2026"
      sections={sections}
      accentColor="orange"
    />
  );
}
