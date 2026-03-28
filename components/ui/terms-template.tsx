"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, ChevronLeft, ScrollText, CheckCircle2, Lock, Scale, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TermsSection {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

interface TermsTemplateProps {
  role: string;
  roleIcon: React.ReactNode;
  lastUpdated: string;
  sections: TermsSection[];
  accentColor?: string;
}

export default function TermsTemplate({
  role,
  roleIcon,
  lastUpdated,
  sections,
  accentColor = "orange",
}: TermsTemplateProps) {
  const router = useRouter();


  const colorMap: Record<string, { from: string; to: string; text: string; bg: string; border: string }> = {
    orange: {
      from: "from-orange-500",
      to: "to-amber-600",
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    blue: {
      from: "from-blue-500",
      to: "to-indigo-600",
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    emerald: {
      from: "from-emerald-500",
      to: "to-teal-600",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    purple: {
      from: "from-purple-500",
      to: "to-violet-600",
      text: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  };

  const colors = colorMap[accentColor] || colorMap.orange;

  const handleBack = () => {
    // If there's no history (e.g. opened in new tab), go to the appropriate register page
    if (window.history.length <= 1) {
      const fallback = role.toLowerCase() === "admin" ? "/admin/register" : "/register";
      router.push(fallback);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 font-bold transition-all hover:gap-2 flex items-center gap-1 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to Registration Form
          </Button>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 mb-10 relative overflow-hidden text-center"
        >
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${colors.from} ${colors.to} opacity-5 blur-[100px] -mr-32 -mt-32`} />
          <div className={`absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br ${colors.from} ${colors.to} opacity-5 blur-[100px] -ml-32 -mb-32`} />

          <div className={`inline-flex items-center justify-center p-4 rounded-2xl ${colors.bg} mb-6 shadow-sm`}>
            {roleIcon}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
            Terms & Conditions
            <span className={`block text-xl md:text-2xl mt-1 bg-clip-text text-transparent bg-gradient-to-r ${colors.from} ${colors.to}`}>
              {role} Agreement
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <Shield className="w-4 h-4" />
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.text}`}>
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center pb-12"
        >
          <div className="h-px w-24 bg-gray-200 mx-auto mb-8" />
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            By using ShareBite as a {role.toLowerCase()}, you acknowledge that you have read, understood, and agreed to be bound by these terms.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <Link href="#" className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors tracking-tighter">Privacy Policy</Link>
            <Link href="#" className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors tracking-tighter">Cookie Policy</Link>
            <Link href="#" className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors tracking-tighter">Help Center</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
