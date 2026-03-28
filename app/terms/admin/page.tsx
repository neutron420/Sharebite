"use client";

import React from "react";
import TermsTemplate from "@/components/ui/terms-template";
import { ShieldAlert, Shield, Scale, ScrollText, CheckCircle2 } from "lucide-react";

export default function AdminTermsPage() {
  const sections = [
    {
      title: "1. Platform Governance & Oversight",
      icon: <ShieldAlert className="w-5 h-5" />,
      content: [
        "As an Admin, you are granted high-level access to the ShareBite platform for the purpose of maintaining its integrity, security, and operational efficiency.",
        "You agree to use your administrative privileges solely for legitimate business purposes and in accordance with company policies.",
        "Unauthorized access or use of administrative tools for personal gain or to harm the platform or its users is strictly prohibited.",
      ],
    },
    {
      title: "2. Data Privacy & Confidentiality",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "Admins have access to sensitive user data and must handle it with the utmost care and confidentiality.",
        "You agree not to disclose, share, or misuse any user information that you come across during your administrative duties.",
        "Compliance with data protection laws and company data privacy policies is a mandatory requirement for all administrators.",
      ],
    },
    {
      title: "3. Compliance & Ethics",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: [
        "Admins are expected to act with integrity and in a professional manner in all interactions with users and other administrators.",
        "You must follow all platform guidelines and company policies regarding the management of donations, users, and NGOs.",
        "Any potential conflict of interest should be reported immediately to the relevant parties within the organization.",
      ],
    },
  ];

  return (
    <TermsTemplate
      role="Admin"
      roleIcon={<ShieldAlert className="w-8 h-8 text-purple-600" />}
      lastUpdated="March 2026"
      sections={sections}
      accentColor="purple"
    />
  );
}
