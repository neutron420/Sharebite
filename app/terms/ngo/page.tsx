"use client";

import React from "react";
import TermsTemplate from "@/components/ui/terms-template";
import { Building2, Utensils, Shield, Scale, ScrollText, CheckCircle2 } from "lucide-react";

export default function NGOTermsPage() {
  const sections = [
    {
      title: "1. NGO Accountability",
      icon: <Building2 className="w-5 h-5" />,
      content: [
        "NGOs represent their organization's commitment to receiving and safely distributing food to those in need.",
        "You must maintain a valid operating certificate and provide proof of registration when requested by the platform admin.",
        "The NGO is responsible for the final safety check before distributing food received from a Donor via ShareBite.",
      ],
    },
    {
      title: "2. Receiving and Distribution",
      icon: <Utensils className="w-5 h-5" />,
      content: [
        "Food received through the platform is meant for no-cost distribution to designated beneficiaries only.",
        "NGOs must not sell, trade, or otherwise monetize the items received through ShareBite.",
        "Distribution must be handled professionally, ensuring that food is handled in a manner that maintains its safety and quality.",
      ],
    },
    {
      title: "3. Reporting & Compliance",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "NGOs agree to provide feedback on the donations they receive, helping us improve the overall quality and reliability of the platform.",
        "Any issues with donors or food quality must be reported immediately using the 'Report' feature within the NGO Dashboard.",
        "Failure to report unsafe donations or recurring issues with food storage may lead to temporary suspension of the account.",
      ],
    },
    {
      title: "4. Professional Conduct",
      icon: <Scale className="w-5 h-5" />,
      content: [
        "NGOs are expected to interact respectfully with Donors, Riders, and ShareBite administrators at all times.",
        "Repeat 'No-shows' during pickup windows or failure to communicate with Riders may result in penalties on the NGO's account.",
      ],
    },
  ];

  return (
    <TermsTemplate
      role="NGO"
      roleIcon={<Building2 className="w-8 h-8 text-blue-600" />}
      lastUpdated="March 2026"
      sections={sections}
      accentColor="blue"
    />
  );
}
