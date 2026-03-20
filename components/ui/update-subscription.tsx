"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  ArrowRight, 
  X, 
  Mail, 
  BrainCircuit, 
  Rocket, 
  Zap,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UpdateSubscription() {
  const [isShown, setIsShown] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("updates-dismissed-v2");
    if (!dismissed) {
      const timer = setTimeout(() => setIsShown(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubscribed(true);
    toast.success("Intelligence Link Active!", {
      description: `Updates dispatched to ${email}`,
    });
    
    setTimeout(() => {
      setIsShown(false);
      localStorage.setItem("mission-updates-active-v2", "true");
    }, 3000);
  };

  const handleDismiss = () => {
    setIsShown(false);
    sessionStorage.setItem("updates-dismissed-v2", "true");
  };

  const detailVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: "0.75rem",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <AnimatePresence>
      {isShown && (
        <motion.div
          initial={{ x: -400, opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -400, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="fixed bottom-6 left-6 z-[95] w-[calc(100vw-3rem)] md:w-96"
        >
          <Card className="overflow-hidden rounded-[2.5rem] border-orange-100/50 bg-white shadow-[0_40px_80px_-20px_rgba(234,88,12,0.15)] relative group">
            
            {/* Mission Image Header (Card Style - White Version) */}
            <div className="relative h-24 w-full overflow-hidden bg-gradient-to-r from-orange-400 to-amber-500">
               <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?q=80&w=1713&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
               
               <div className="absolute top-4 left-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                     <Zap size={10} className="animate-pulse" />
                     Pulse Active
                  </div>
               </div>
               
               <button 
                 onClick={handleDismiss}
                 className="absolute top-4 right-6 p-2 rounded-full bg-black/5 text-white/80 hover:text-white hover:bg-black/10 transition-all"
               >
                 <X size={14} />
               </button>
            </div>

            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Alpha Hub</span>
                    <span className="text-orange-200">•</span>
                    <span className="text-orange-600/70 italic">Transmission Channel</span>
                  </div>
                  <h3 className="mt-1 text-xl font-black text-slate-800 tracking-tight leading-tight">
                    Mission Intelligence
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
                   <Bell size={20} className={isHovered ? "animate-bounce" : "animate-pulse"} />
                </div>
              </div>

              {!isSubscribed ? (
                <>
                  <AnimatePresence>
                    {isHovered ? (
                      <motion.div
                        key="sub-details"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={detailVariants}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          Synchronize with the core redistribtion engine for real-time fleet deployments and urgent donor signals.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                           <Badge className="bg-orange-100 text-orange-600 border-none px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Platform</Badge>
                           <Badge className="bg-orange-100 text-orange-600 border-none px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Operations</Badge>
                        </div>
                      </motion.div>
                    ) : (
                      <p className="mt-3 text-[10px] text-slate-400 font-bold italic tracking-wide">
                        // Hover to synchronize data stream...
                      </p>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubscribe} className="mt-8 space-y-3">
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-orange-500 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agent@hub.sharebite"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-bold"
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 group/btn shadow-xl shadow-orange-100"
                    >
                      Connect Intelligence
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </motion.button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center py-8 text-center text-slate-800">
                  <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-200">
                    <CheckCircle2 className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-black mb-1 italic tracking-tight uppercase">Channel Established</h4>
                  <p className="text-[10px] text-orange-400 font-black tracking-[0.2em]">Transmission Ready</p>
                </div>
              )}
            </div>
            
            {/* Action Footer (Avatar Style icons) */}
            <div className="flex items-center justify-between border-t border-orange-50 bg-orange-50/30 px-8 py-5">
              <div className="flex -space-x-3">
                 {[BrainCircuit, Rocket, ShieldCheck].map((Icon, i) => (
                   <div key={i} className="h-8 w-8 rounded-full bg-white border-2 border-orange-50 flex items-center justify-center text-orange-400 shadow-sm transition-transform hover:scale-110 hover:z-10">
                     <Icon size={14} />
                   </div>
                 ))}
              </div>
              <p className="text-[9px] font-black text-orange-200 uppercase tracking-widest italic">
                Uplink SECURE
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
