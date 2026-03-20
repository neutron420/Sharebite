"use client";

import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import LocationPicker from "@/components/map/LocationPicker";

// ─── Animated Dot Map ───
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default function ShareBiteRegister() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
          role: "ADMIN",
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

      router.push("/admin/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        {/* Left side - Animated Dot Map */}
        <div className="hidden lg:flex w-2/5 relative overflow-hidden border-r border-orange-100 flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100">
            <DotMap />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl shadow-orange-200 rotate-3">
                <ShieldCheck className="text-white h-8 w-8" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-3xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 tracking-tight"
            >
              ShareBite Admin
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-center text-gray-500 max-w-xs leading-relaxed"
            >
              Command center for managing donations, users, NGOs, and keeping the platform running at full speed
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-orange-100"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Admin Access Portal</span>
            </motion.div>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className="w-full lg:w-3/5 p-8 md:p-10 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <ShieldCheck className="text-white h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Create Admin Account</h1>
            </div>
            <p className="text-gray-500 mb-7 text-sm">Set up your administrator credentials to manage ShareBite</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="admin@sharebite.org"
                    required
                    disabled={isLoading}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => update("phoneNumber", e.target.value)}
                    placeholder="+91 9876543210"
                    disabled={isLoading}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Secure Map Location Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Geographic Base Assignment <span className="text-orange-500">*</span>
                </label>
                <div className="h-[250px] w-full rounded-xl overflow-hidden border-2 border-orange-100 shadow-inner">
                  <LocationPicker
                    onLocationSelect={(data) => {
                      setForm((prev) => ({
                        ...prev,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        district: data.district,
                        pincode: data.pincode,
                        latitude: data.latitude,
                        longitude: data.longitude,
                      }));
                    }}
                  />
                </div>
                {form.city && (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                    <ShieldCheck size={14} /> Location locked: {form.city}, {form.state}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-3"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isHovered ? "shadow-lg shadow-orange-200" : "shadow-md"}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                    ) : (
                      <><UserPlus className="h-4 w-4" /> Create Admin Account</>
                    )}
                  </span>
                  {isHovered && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </button>
              </motion.div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-300">Secured admin registration</span>
              </div>

              {/* Login Link */}
              <div className="text-center pt-2">
                <a href="/admin/login" className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors">
                  Already have an account? Sign in
                </a>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
