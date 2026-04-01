"use client";

import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, UserPlus, Check, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LocationPicker from "@/components/map/LocationPicker";

type RoutePoint = { x: number; y: number; delay: number };

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
        ctx!.beginPath(); ctx!.moveTo(route.start.x, route.start.y); ctx!.lineTo(x, y);
        ctx!.strokeStyle = route.color; ctx!.lineWidth = 1.5; ctx!.stroke();
        ctx!.beginPath(); ctx!.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2); ctx!.fillStyle = route.color; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(x, y, 3, 0, Math.PI * 2); ctx!.fillStyle = "#f97316"; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(x, y, 6, 0, Math.PI * 2); ctx!.fillStyle = "rgba(249,115,22,0.4)"; ctx!.fill();
        if (progress === 1) { ctx!.beginPath(); ctx!.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2); ctx!.fillStyle = route.color; ctx!.fill(); }
      });
    }

    function animate() {
      drawDots(); drawRoutes();
      if ((Date.now() - startTime) / 1000 > 15) startTime = Date.now();
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default function CommunityRegister() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    hasAgreedToTerms: false,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const saved = localStorage.getItem("sharebite_community_register");
    if (saved) {
      const parsed = JSON.parse(saved);
      setForm(prev => ({ 
        ...prev, 
        ...parsed, 
        password: "", 
        hasAgreedToTerms: false 
      }));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const { password, confirmPassword, hasAgreedToTerms, ...safe } = form;
      localStorage.setItem("sharebite_community_register", JSON.stringify(safe));
    }
  }, [form, isHydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          role: "COMMUNITY",
          phoneNumber: form.phoneNumber || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          district: form.district || undefined,
          pincode: form.pincode || undefined,
          latitude: form.latitude || undefined,
          longitude: form.longitude || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.details?.[0]?.message || "Registration failed");
        return;
      }

      localStorage.removeItem("sharebite_community_register");
      router.push("/community/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all";

  if (!isHydrated) return <div className="min-h-screen w-full flex items-center justify-center bg-orange-50/50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-xs uppercase tracking-[0.2em] font-black text-orange-600 animate-pulse">Joining Hive...</span>
    </div>
  </div>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        <div className="hidden lg:flex w-2/5 relative overflow-hidden border-r border-orange-100 flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100">
            <DotMap />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl shadow-orange-200">
                <Users className="text-white h-10 w-10" />
              </div>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-3xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 tracking-tight">
              Community Hive
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
              Join thousands of community members sharing wholesome moments and supporting the zero-waste movement.
            </motion.p>
            <div className="space-y-4 w-full">
              <FeatureItem icon={<Sparkles size={16} />} text="Share your donation journey" />
              <FeatureItem icon={<Check size={16} />} text="Connect with local heroes" />
              <FeatureItem icon={<Users size={16} />} text="Build your impact legacy" />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-3/5 p-8 md:p-10 flex flex-col justify-center bg-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Join the Movement</h1>
            <p className="text-gray-500 mb-7 text-sm">Create your community profile to start sharing moments</p>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Jane Doe" required disabled={isLoading} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@example.com" required disabled={isLoading} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password *</label>
                <div className="relative">
                  <input type={isPasswordVisible ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 6 characters" required minLength={6} disabled={isLoading} className={`${inputClass} pr-10`} />
                  <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                    {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm Password *</label>
                <input type={isPasswordVisible ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Repeat password" required disabled={isLoading} className={`${inputClass} ${form.confirmPassword && form.password !== form.confirmPassword ? "border-red-400 bg-red-50" : ""}`} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Where are you based? *</label>
                <div className="h-[200px] w-full rounded-xl overflow-hidden border-2 border-orange-100">
                  <LocationPicker onLocationSelect={(data) => setForm(prev => ({ ...prev, ...data }))} />
                </div>
                {form.city && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Location: {form.city}, {form.state}</p>}
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.hasAgreedToTerms} onChange={(e) => update("hasAgreedToTerms", e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <span className="text-xs text-gray-500 leading-relaxed font-medium">I agree to the <Link href="/terms/community" className="text-orange-600 font-bold hover:underline">Community Guidelines</Link>.</span>
                </label>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)} className="pt-3">
                <button type="submit" disabled={isLoading || !form.hasAgreedToTerms || form.password !== form.confirmPassword || form.password.length < 6} className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white py-4 bg-slate-950 hover:bg-orange-600 transition-all duration-300 disabled:opacity-50">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Hive connecting...</> : <><UserPlus className="h-4 w-4" /> Join the Hive</>}
                </button>
              </motion.div>

              <div className="text-center pt-4">
                <Link href="/community/login" className="text-orange-600 hover:text-orange-700 text-sm font-medium">Already in the Hive? Sign in</Link>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-orange-100 shadow-sm">
      <div className="text-orange-600">{icon}</div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">{text}</span>
    </div>
  );
}
