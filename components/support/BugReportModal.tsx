"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, Send, AlertTriangle, CheckCircle2, Loader2, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BsCpu,
  BsPalette,
  BsLightningCharge,
  BsShieldLock,
  BsQuestionCircle
} from "react-icons/bs";

import { usePathname } from "next/navigation";

export default function BugReportModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    type: "TECHNICAL",
    description: "",
    location: "",
  });

  React.useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Auth check failed in BugReportModal");
        setUserRole(null);
      } finally {
        setIsLoaded(true);
      }
    }
    checkUser();
  }, [pathname]);

  const allowedRoles = ["DONOR", "NGO", "RIDER"];
  const shouldShowButton = isLoaded && userRole && allowedRoles.includes(userRole);

  if (!shouldShowButton) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) {
      toast.error("Please describe the bug.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit report");

      toast.success("Bug reported! Our team is on it.");
      setFormData({ type: "TECHNICAL", description: "", location: "" });
      setIsOpen(false);
    } catch (error) {
      toast.error("Could not send report. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button Stacked nicely side AI chat */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[11.5rem] right-6 z-50 h-10 w-10 sm:h-12 sm:w-12 sm:bottom-[78px] rounded-full bg-slate-950 text-white shadow-xl flex items-center justify-center border-2 border-white transition-all hover:bg-red-500 group"
      >
        <Bug className="h-5 w-5 group-hover:animate-bounce" />
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Report Issue
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-50"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white relative">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Bug className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Report a Defect</h2>
                </div>
                <p className="text-red-50/80 text-sm ml-13">Help us keep ShareBite flawless and secure</p>
                
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Bug Classification</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-red-200">
                      <SelectValue placeholder="Select bug type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICAL" className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                             <BsCpu className="h-3.5 w-3.5" />
                          </div>
                          <span>Technical / API Error</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="UI_UX" className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
                             <BsPalette className="h-3.5 w-3.5" />
                          </div>
                          <span>Interface / Design Issue</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="PERFORMANCE" className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                             <BsLightningCharge className="h-3.5 w-3.5" />
                          </div>
                          <span>Performance / Lag</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SECURITY" className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                             <BsShieldLock className="h-3.5 w-3.5" />
                          </div>
                          <span>Security Vulnerability</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="OTHER" className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-gray-50 text-gray-600">
                             <BsQuestionCircle className="h-3.5 w-3.5" />
                          </div>
                          <span>Other Issues</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Incident Location</Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. Dashboard, NGO List, Profile Page"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="h-11 bg-gray-50 border-gray-100 pl-10 rounded-xl focus:ring-red-200"
                    />
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Detailed Description</Label>
                  <textarea
                    placeholder="Describe exactly what happened and how to reproduce it..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 transition-all font-medium placeholder:text-gray-400"
                  />
                </div>

                {/* Info Card */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                  <div className="mt-0.5">
                    <Info className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-[11px] text-blue-600/80 leading-relaxed font-medium">
                    Your report includes metadata like your current role and timestamp to help us debug faster.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-red-100 group transition-all"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting to Ops...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span>Submit Bug Report</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
