"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent-v5");
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent-v5", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent-v5", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -200, opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -200, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="fixed bottom-6 left-6 z-[100] w-full max-w-sm"
        >
          <Card size="sm" className="bg-white shadow-2xl border-slate-100 hover:shadow-orange-100 transition-all duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">Cookie Policy</CardTitle>
              <CardDescription className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">
                Privacy First Engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 leading-relaxed">
                We use cookies to optimize your food-saving missions and enhance our cognitive vertical logistics. Do you accept our standard policy?
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
              <Button 
                onClick={handleAccept}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-widest py-5 rounded-xl shadow-lg shadow-orange-100"
              >
                Accept All
              </Button>
              <button
                onClick={handleDecline}
                className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Essential Only
              </button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
