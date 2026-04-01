"use client";

import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, Utensils, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Turnstile from "react-turnstile";

const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 }, color: "#ea580c" },
    { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 }, color: "#ea580c" },
    { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 }, color: "#ea580c" },
    { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: "#ea580c" },
  ];

  const generateDots = (width: number, height: number) => {
    const dots: { x: number; y: number; radius: number; opacity: number }[] = [];
    const gap = 12;
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const isInMapShape =
          (x < width * 0.25 && x > width * 0.05 && y < height * 0.4 && y > height * 0.1) ||
          (x < width * 0.25 && x > width * 0.15 && y < height * 0.8 && y > height * 0.4) ||
          (x < width * 0.45 && x > width * 0.3 && y < height * 0.35 && y > height * 0.15) ||
          (x < width * 0.5 && x > width * 0.35 && y < height * 0.65 && y > height * 0.35) ||
          (x < width * 0.7 && x > width * 0.45 && y < height * 0.5 && y > height * 0.1) ||
          (x < width * 0.8 && x > width * 0.65 && y < height * 0.8 && y > height * 0.6);
        if (isInMapShape && Math.random() > 0.3) {
          dots.push({ x, y, radius: 1, opacity: Math.random() * 0.5 + 0.2 });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });
    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    function drawDots() {
      ctx!.clearRect(0, 0, dimensions.width, dimensions.height);
      dots.forEach((dot) => {
        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(234, 88, 12, ${dot.opacity})`;
        ctx!.fill();
      });
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000;
      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        const progress = Math.min(elapsed / 3, 1);
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        ctx!.beginPath();
        ctx!.moveTo(route.start.x, route.start.y);
        ctx!.lineTo(x, y);
        ctx!.strokeStyle = route.color;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = route.color;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(x, y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = "#f97316";
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(x, y, 6, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(249, 115, 22, 0.4)";
        ctx!.fill();

        if (progress === 1) {
          ctx!.beginPath();
          ctx!.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx!.fillStyle = route.color;
          ctx!.fill();
        }
      });
    }

    function animate() {
      drawDots();
      drawRoutes();
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) startTime = Date.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

interface ShareBiteLoginProps {
  /** If true, shows the role selector tabs (Donor / NGO / Rider). If false (admin login), hides them. */
  showRoleSelector?: boolean;
  /** Default role to pre-select */
  defaultRole?: "DONOR" | "NGO" | "RIDER" | "ADMIN" | "COMMUNITY";
  /** Custom forgot password link (e.g. for admin) */
  forgotPasswordUrl?: string;
  /** Custom register link when role selector is hidden */
  registerUrl?: string;
}

export default function ShareBiteLogin({ 
  showRoleSelector = true, 
  defaultRole = "DONOR",
  forgotPasswordUrl = "/forgot-password",
  registerUrl
}: ShareBiteLoginProps) {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loginRole, setLoginRole] = useState<"DONOR" | "NGO" | "RIDER" | "ADMIN" | "COMMUNITY">(defaultRole);
  const [isHydrated, setIsHydrated] = useState(false);
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(searchParams.get("registered") === "true" ? "Registration Successful! Log in to deploy your first mission." : "");

  // Persistence logic
  useEffect(() => {
    const savedEmail = localStorage.getItem("sharebite_login_email");
    const savedRole = localStorage.getItem("sharebite_login_role");
    
    if (savedEmail) setEmail(savedEmail);
    
    // Core logic: If we have a role selector (Home Login), restore from memory.
    // If not (Admin Portal), FORCE the default role to ensure access.
    if (showRoleSelector) {
      if (savedRole && (savedRole === "DONOR" || savedRole === "NGO" || savedRole === "RIDER" || savedRole === "COMMUNITY")) {
        setLoginRole(savedRole as any);
      }
    } else {
      setLoginRole(defaultRole);
    }
    
    setIsHydrated(true);
  }, [showRoleSelector, defaultRole]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("sharebite_login_email", email);
      localStorage.setItem("sharebite_login_role", loginRole);
    }
  }, [email, loginRole, isHydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: loginRole, turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        return;
      }

      const role = data.user?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "DONOR") router.push("/donor");
      else if (role === "NGO") router.push("/ngo");
      else if (role === "RIDER") router.push("/rider");
      else if (role === "COMMUNITY") router.push("/community");
      else router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    DONOR: { title: "Welcome Back, Hero", subtitle: "Securely access your donor portal and track your impact." },
    NGO: { title: "Ops Command Center", subtitle: "Manage your logistics and rescue surplus food nearby." },
    RIDER: { title: "Rider Dispatch", subtitle: "Accept missions and deliver hope across your city." },
    ADMIN: { title: "ShareBite Admin Hub", subtitle: "Total platform oversight and cognitive engine monitoring." },
    COMMUNITY: { title: "Community Hive", subtitle: "Connect with the movement and share wholesome moments." },
  };

  if (!isHydrated) return <div className="min-h-screen w-full flex items-center justify-center bg-orange-50/50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-xs uppercase tracking-[0.2em] font-black text-orange-600 animate-pulse">Authenticating Base...</span>
    </div>
  </div>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex flex-col md:flex-row bg-white shadow-xl"
      >
        {/* Left side - Animated Dot Map */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden border-r border-orange-100">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100">
            <DotMap />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-6"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-200">
                  <Utensils className="text-white h-7 w-7" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600"
              >
                ShareBite
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-sm text-center text-gray-600 max-w-xs"
              >
                Connecting donors with NGOs to reduce food waste and fight hunger across communities
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-800">
              {roleConfig[loginRole].title}
            </h1>
            <p className="text-gray-500 mb-6 text-xs sm:text-sm">{roleConfig[loginRole].subtitle}</p>

            {/* Role Selector Tabs */}
            {showRoleSelector && (
              <div className="flex bg-orange-50 p-1 rounded-xl mb-6">
                {(["DONOR", "NGO", "RIDER"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setLoginRole(role)}
                    className={cn(
                      "flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-200",
                      loginRole === role
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {role === "NGO" ? "NGO Hub" : role === "RIDER" ? "Rider" : "Donor"}
                  </button>
                ))}
              </div>
            )}

            {success && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6">
                <Alert variant="success" className="rounded-2xl border-emerald-100 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800 font-bold">Authenticated</AlertTitle>
                  <AlertDescription className="text-emerald-600">{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6">
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold">Access Denied</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                  Email <span className="text-orange-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  disabled={isLoading}
                  className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus-visible:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Password <span className="text-orange-500">*</span>
                  </label>
                  <Link href={forgotPasswordUrl} className="text-[10px] text-orange-600 hover:text-orange-700 font-black uppercase tracking-widest">
                    Forgot key?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 pr-12 placeholder:text-gray-400 focus-visible:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-orange-600 transition-colors"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              <div className="flex justify-center border border-slate-100 rounded-xl p-3 bg-slate-50/50 scale-90 sm:scale-100 origin-center">
                <Turnstile 
                  sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "0x4AAAAAACtsY9vA7n-6RWgO"} 
                  onVerify={(token) => setTurnstileToken(token)}
                />
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full relative overflow-hidden inline-flex items-center justify-center gap-3 rounded-xl text-xs font-black uppercase tracking-widest text-white py-4 px-4 bg-slate-950 hover:bg-orange-600 transition-all duration-300 focus-visible:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50",
                    isHovered ? "shadow-2xl shadow-orange-200" : ""
                  )}
                >
                  <span className="flex items-center justify-center">
                    {isLoading ? "Authenticating..." : "Initialize Session"}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </span>
                </button>
              </motion.div>

              <div className="text-center mt-6 space-y-3">
                <Link href={showRoleSelector ? "/register" : (registerUrl || "/admin/register")} className="text-orange-600 hover:text-orange-700 text-xs font-bold transition-colors block uppercase tracking-widest">
                  Don&apos;t have an account? Create one
                </Link>
                <div className="pt-2">
                  <Link 
                    href={`/terms/${loginRole.toLowerCase()}`} 
                    className="text-[9px] text-gray-300 hover:text-orange-500 font-black uppercase tracking-[0.2em] transition-colors"
                  >
                    Terms & Protocol
                  </Link>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
