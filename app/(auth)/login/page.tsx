"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  ArrowRight, 
  Mail, 
  Lock, 
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginRole, setLoginRole] = useState<"DONOR" | "NGO" | "RIDER">("DONOR");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in. Check your credentials.");
      }

      // Success! Route based on role
      const role = data.user.role;
      if (role !== loginRole && role !== "ADMIN" && role !== "RIDER") {
        throw new Error(`Account registered as ${role}. Please switch to the correct portal tab above.`);
      }

      if (role === "DONOR") router.push("/donor");
      else if (role === "NGO") router.push("/ngo");
      else if (role === "RIDER") router.push("/rider");
      else router.push("/admin");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex flex-col items-center justify-center p-6 selection:bg-orange-100 overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-50 blur-[140px] rounded-full opacity-60" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-50/80 blur-[140px] rounded-full opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px:32px]" />
      </div>

      <div className="relative z-10 w-full max-w-[28rem]">
        <div className="flex flex-col items-center mb-10">
           <Link href="/" className="flex items-center gap-3 group mb-8">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center group-hover:rotate-12 transition-all duration-300">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-slate-900">ShareBite</span>
           </Link>
           <h1 className="text-4xl font-black tracking-tight text-center mb-2">
              {loginRole === "DONOR" ? "Welcome Back" : loginRole === "NGO" ? "Ops Command" : "Rider Dispatch"}
           </h1>
           <p className="text-slate-500 font-medium text-sm">
              {loginRole === "DONOR" ? "Securely access your donor portal." : loginRole === "NGO" ? "Securely access your NGO logistics." : "Securely access your delivery missions."}
           </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl">
               <button
                  type="button"
                  onClick={() => setLoginRole("DONOR")}
                  className={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${loginRole === "DONOR" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                  Donor
               </button>
               <button
                  type="button"
                  onClick={() => setLoginRole("NGO")}
                  className={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${loginRole === "NGO" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                  NGO Hub
               </button>
               <button
                  type="button"
                  onClick={() => setLoginRole("RIDER")}
                  className={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${loginRole === "RIDER" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                  Rider
               </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <InputGroup 
              label="Verified Email / Identification" 
              placeholder="e.g. hero@sharebite.org" 
              type="email" 
              icon={<Mail className="w-4 h-4" />} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <div className="flex bg-orange-50/50 p-1.5 rounded-2xl mb-2">
               <button
                  type="button"
                  onClick={() => setIsOtpMode(false)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isOtpMode ? "bg-white text-orange-600 shadow-sm" : "text-slate-400"}`}
               >
                  Password
               </button>
               <button
                  type="button"
                  onClick={() => setIsOtpMode(true)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isOtpMode ? "bg-white text-orange-600 shadow-sm" : "text-slate-400"}`}
               >
                  Tactical OTP
               </button>
            </div>

            <AnimatePresence mode="wait">
              {!isOtpMode ? (
                <motion.div 
                  key="password"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-2"
                >
                   <div className="flex justify-between items-center pr-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Protocol</label>
                   </div>
                   <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors">
                       <Lock className="w-4 h-4" />
                     </div>
                     <input 
                       type="password"
                       placeholder="••••••••"
                       className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 focus:bg-white transition-all shadow-inner disabled:opacity-50"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       disabled={loading}
                       required
                     />
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="otp"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-2"
                >
                   <div className="flex justify-between items-center pr-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-orange-600 ml-1">6-Digit Verification</label>
                      <button type="button" className="text-[9px] font-black uppercase text-slate-400 hover:text-orange-600">Send Code</button>
                   </div>
                   <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600">
                       <ShieldCheck className="w-4 h-4" />
                     </div>
                     <input 
                       type="text"
                       maxLength={6}
                       placeholder="0 0 0 0 0 0"
                       className="w-full pl-11 pr-6 py-4 bg-white border-2 border-orange-100 rounded-2xl text-center text-lg font-black tracking-[0.5em] focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-50 transition-all shadow-xl shadow-orange-50 placeholder:text-slate-200"
                       value={otp}
                       onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                       disabled={loading}
                       required
                     />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4">
               <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-950 text-white font-black rounded-3xl hover:bg-orange-600 transition-all shadow-2xl shadow-orange-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100 uppercase text-xs tracking-[0.2em]"
               >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>{isOtpMode ? "Verify & Decrypt" : "Execute Login"} <ArrowRight className="w-5 h-5" /></>
                  )}
               </button>
            </div>

            <div className="flex items-center gap-2 justify-center pt-2">
               <ShieldCheck className="w-3 h-3 text-green-500" />
               <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">End-to-end encrypted portal</span>
            </div>
          </form>
        </motion.div>

        <div className="mt-10 flex flex-col items-center gap-6">
           <p className="text-sm font-bold text-slate-400 text-center">
              New to our logistics network? <br />
              <Link href="/register" className="text-orange-600 hover:underline hover:text-orange-700 transition-colors">Apply for an Account</Link>
           </p>
           
           <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Intelligence
           </Link>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ 
  label, placeholder, type = "text", icon, value, onChange, disabled, required 
}: { 
  label: string, placeholder: string, type?: string, icon: React.ReactNode, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean, required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors z-10">
          {icon}
        </div>
        <input 
          type={type}
          placeholder={placeholder}
          className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 focus:bg-white transition-all shadow-inner relative disabled:opacity-50"
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
}
