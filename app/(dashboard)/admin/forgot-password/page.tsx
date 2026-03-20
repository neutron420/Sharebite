"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Eye,
  EyeOff,
  RefreshCcw,
  ShieldAlert,
  ShieldHalf,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Turnstile from "react-turnstile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import confetti from "canvas-confetti";

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

type Step = "EMAIL" | "OTP" | "RESET_PASSWORD" | "SUCCESS";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#F89880', '#fb923c'] });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#F89880', '#ea580c'] });
    }, 250);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "ADMIN", turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setStep("OTP");
      setSuccess("OTP sent to your admin email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      setStep("RESET_PASSWORD");
      setSuccess("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      
      setStep("SUCCESS");
      triggerConfetti();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -10 }
  };

  const buttonStyle = cn(
    "w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white py-4 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    isHovered ? "shadow-lg shadow-orange-200" : ""
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4 font-sans">
      
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(244,152,128,0.2)] overflow-hidden relative border border-orange-100/50">
        
        <div className="h-1.5 bg-slate-50 w-full flex">
          <motion.div 
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
            initial={{ width: "25%" }}
            animate={{ 
              width: step === "EMAIL" ? "25%" : 
                     step === "OTP" ? "50%" : 
                     step === "RESET_PASSWORD" ? "75%" : "100%" 
            }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </div>

        <div className="p-8 md:p-14">
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center mb-6 border border-orange-100 shadow-inner"
            >
              <KeyRound className="w-8 h-8 text-[#F89880]" />
            </motion.div>
            
            <h1 className="text-2xl md:text-3xl font-medium text-slate-900 tracking-tight mb-2">
              {step === "EMAIL" && "Recover Admin Access"}
              {step === "OTP" && "Verification Token"}
              {step === "RESET_PASSWORD" && "Credential Setup"}
              {step === "SUCCESS" && "Authority Restored"}
            </h1>
            
            <p className="text-slate-500 text-sm leading-relaxed max-w-[320px]">
              {step === "EMAIL" && "Enter your administrative registry email to initialize a secure bypass dispatch."}
              {step === "OTP" && `Security token deployed. Intercepting clearance at ${email}.`}
              {step === "RESET_PASSWORD" && "Clearance granted. Deploy your new administrative credentials."}
              {step === "SUCCESS" && "Admin profile re-initialized. Your security clearance is now active."}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <Alert variant="destructive" className="mb-6 rounded-2xl border-red-100 bg-red-50/50">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && step === "OTP" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Alert className="mb-6 rounded-2xl border-emerald-100 bg-emerald-50/50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="font-medium text-xs">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === "EMAIL" && (
              <motion.form 
                key="email"
                variants={containerVariants}
                initial="initial" animate="animate" exit="exit"
                onSubmit={handleSendOTP}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Target Identity Profile</label>
                   <div className="flex items-center justify-center gap-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                      <ShieldHalf className="text-orange-600" size={18} />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-orange-600">Administrative clearance</span>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Primary Email Registry</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sharebite.internal"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex justify-center border border-slate-50 rounded-2xl p-4 bg-slate-50/30 scale-95 opacity-80 hover:opacity-100 transition-opacity">
                  <Turnstile 
                    sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} 
                    onVerify={(token) => setTurnstileToken(token)}
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                >
                  <button type="submit" disabled={isLoading} className={buttonStyle}>
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Dispatch OTP"}
                    {!isLoading && <ArrowRight className="w-5 h-5 translate-x-1" />}
                  </button>
                </motion.div>
              </motion.form>
            )}

            {step === "OTP" && (
              <motion.form 
                key="otp"
                variants={containerVariants}
                initial="initial" animate="animate" exit="exit"
                onSubmit={handleVerifyOTP}
                className="space-y-8"
              >
                <div className="space-y-4 text-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Security Token Clearance</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="— — — — — —"
                    className="w-full text-center bg-slate-50 border border-slate-100 rounded-2xl py-6 text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-slate-200"
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                >
                  <button type="submit" disabled={isLoading} className={buttonStyle}>
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Verify Access"}
                    {!isLoading && <ShieldCheck className="w-5 h-5" />}
                  </button>
                </motion.div>
              </motion.form>
            )}

            {step === "RESET_PASSWORD" && (
              <motion.form 
                key="reset"
                variants={containerVariants}
                initial="initial" animate="animate" exit="exit"
                onSubmit={handleResetPassword}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">New Authority Path</label>
                    <div className="relative group">
                      <input 
                        type={isPasswordVisible ? "text" : "password"} 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-orange-500 transition-colors p-1"
                      >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Confirm Deployment</label>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                >
                  <button type="submit" disabled={isLoading} className={buttonStyle}>
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Deploy Credentials"}
                    {!isLoading && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </motion.div>
              </motion.form>
            )}

            {step === "SUCCESS" && (
              <motion.div 
                key="success"
                variants={containerVariants}
                initial="initial" animate="animate" exit="exit"
                className="text-center space-y-12"
              >
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center border border-emerald-100 relative shadow-inner">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <motion.div 
                      className="absolute inset-0 rounded-[2rem] border-4 border-emerald-500"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                </div>

                <div className="space-y-6 px-2">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Administrative authority restored. Please proceed to your security center.
                  </p>
                  
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                  >
                    <Link 
                      href="/admin/login" 
                      className={cn(buttonStyle, "py-5 text-base font-bold")}
                    >
                      Enter Admin Center
                      <ArrowRight className="w-6 h-6" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "SUCCESS" && (
            <div className="mt-14 pt-8 border-t border-slate-50 text-center">
              <Link href="/admin/login" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-orange-500 flex items-center justify-center gap-2 transition-all group">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Admin Login
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-10 left-10 pointer-events-none opacity-[0.03] select-none">
        <h2 className="text-[120px] font-black leading-none uppercase">ShareBite</h2>
      </div>
    </div>
  );
}
