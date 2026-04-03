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
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCcw,
  LucideIcon,
  ShieldAlert,
  User,
  Building2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Turnstile from "react-turnstile";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import confetti from "canvas-confetti";

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

type Step = "EMAIL" | "OTP" | "RESET_PASSWORD" | "SUCCESS";
type Role = "DONOR" | "NGO" | "RIDER";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("EMAIL");
  const [role, setRole] = useState<Role>("DONOR");
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
  const turnstileSiteKey = (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

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
        body: JSON.stringify({ email, role, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setStep("OTP");
      setSuccess(
        `OTP sent to your email. ${data.devOtp ? `(DEV OVERRIDE: ${data.devOtp})` : "Check your inbox."}`
      );
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
    "w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    isHovered ? "shadow-lg shadow-orange-200" : ""
  );

  const roles: { id: Role; label: string; Icon: LucideIcon }[] = [
    { id: "DONOR", label: "Donor", Icon: User },
    { id: "NGO", label: "NGO", Icon: Building2 },
    { id: "RIDER", label: "Rider", Icon: Truck },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4 font-sans selection:bg-[#F89880]/20">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(244,152,128,0.2)] overflow-hidden relative border border-orange-100/50 backdrop-blur-xl">
        
        <div className="h-1.5 bg-slate-50 w-full flex">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#F89880] to-orange-500"
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
              className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100 shadow-inner"
            >
              <KeyRound className="w-7 h-7 text-[#F89880]" />
            </motion.div>
            
            <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
              {step === "EMAIL" && "Recover Access"}
              {step === "OTP" && "Direct Verification"}
              {step === "RESET_PASSWORD" && "Security Re-entry"}
              {step === "SUCCESS" && "Access Restored"}
            </h1>
            
            <p className="text-slate-500 text-xs leading-relaxed max-w-[280px]">
              {step === "EMAIL" && "Select your role and enter your email to initialize a secure recovery dispatch."}
              {step === "OTP" && `Authentication code generated. Dispatching to ${email}.`}
              {step === "RESET_PASSWORD" && "Credentials verified. Deploy your new secure password now."}
              {step === "SUCCESS" && "Credentials updated successfully. Your new security profile is active."}
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
                className="space-y-6"
              >
                {/* Role Selector Tabs */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Target Identity Profile</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {roles.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRole(id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all",
                          role === id 
                            ? "bg-white text-orange-600 shadow-sm border border-orange-100" 
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                        )}
                      >
                        <Icon size={14} className={role === id ? "text-orange-600" : "text-slate-300"} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Primary Email Registry</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#F89880] transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="commander@sharebite.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#F89880]/10 focus:border-[#F89880]/50 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex justify-center border border-slate-50 rounded-2xl p-4 bg-slate-50/30 scale-95 opacity-80 hover:opacity-100 transition-opacity">
                  <Turnstile 
                    sitekey={turnstileSiteKey}
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
                    {!isLoading && <ArrowRight className="w-5 h-5" />}
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
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Security Verification Token</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="— — — — — —"
                    className="w-full text-center bg-slate-50 border border-slate-100 rounded-2xl py-5 text-3xl font-medium tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-[#F89880]/10 focus:border-[#F89880]/50 transition-all placeholder:text-slate-200"
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
                
                <p className="text-center text-xs text-slate-400 font-medium">
                  Didn&apos;t receive code? <button type="button" onClick={handleSendOTP} className="text-[#F89880] hover:underline hover:text-orange-600 transition-colors">Resend</button>
                </p>
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
                <div className="space-y-5">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">New Terminal Password</label>
                    <div className="relative group">
                      <input 
                        type={isPasswordVisible ? "text" : "password"} 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#F89880]/10 focus:border-[#F89880]/50 transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1"
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
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#F89880]/10 focus:border-[#F89880]/50 transition-all"
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
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Secure Profile"}
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
                className="text-center space-y-10"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border border-emerald-100 relative shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <motion.div 
                      className="absolute inset-0 rounded-[1.5rem] border-4 border-emerald-500"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <p className="text-sm text-slate-500 font-medium">
                    User clearance restored. Access your strategic portal.
                  </p>
                  
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                  >
                    <Link 
                      href="/login" 
                      className={cn(buttonStyle, "py-4")}
                    >
                      Return to Login Hub 
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "SUCCESS" && (
            <div className="mt-12 pt-8 border-t border-slate-50 text-center">
              <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-orange-500 flex items-center justify-center gap-2 transition-all group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Exit to Login
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
