"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Heart,
  Building2,
  UploadCloud,
  MapPin,
  Truck,
  Utensils,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Turnstile from "react-turnstile";
import LocationPicker from "@/components/map/LocationPicker";

// ─── Animated Dot Map (same as login page) ───
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

// ─── Steps config ───
type Role = "DONOR" | "NGO" | "RIDER" | null;

const steps = [
  { id: "role", title: "Role" },
  { id: "personal", title: "Details" },
  { id: "verification", title: "Location" },
];

const stepDescriptions: Record<string, { title: string; subtitle: string }> = {
  DONOR: { title: "Donor Registration", subtitle: "Share surplus food and create impact in your community." },
  NGO: { title: "NGO Onboarding", subtitle: "Register your organization to receive and distribute food." },
  RIDER: { title: "Rider Sign-Up", subtitle: "Join our delivery fleet and help transport food to those in need." },
};

// ─── Main Component ───
export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    role: "DONOR" as Role,
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    city: "",
    address: "",
    state: "",
    district: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    imageUrl: "",
    verificationDoc: "",
    donorType: "",
    hasAgreedToTerms: false,
  });

  const updateFormData = (field: string, value: string | Role | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("sharebite_register_form");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(prev => ({ 
        ...prev, 
        ...parsed, 
        password: "", // Security: Don't restore passwords
        hasAgreedToTerms: false 
      }));
    }
    const savedStep = localStorage.getItem("sharebite_register_step");
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      const { password, confirmPassword, hasAgreedToTerms, ...safeData } = formData;
      localStorage.setItem("sharebite_register_form", JSON.stringify(safeData));
      localStorage.setItem("sharebite_register_step", currentStep.toString());
    }
  }, [formData, currentStep, isHydrated]);

  // Clear storage on successful submission (in handleSubmit)
  // [already added below in handleSubmit]

  // Debounced email check
  useEffect(() => {
    if (!formData.email || !formData.email.includes("@")) {
      setEmailAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await fetch(`/api/auth/check-availability?email=${formData.email}`);
        const data = await res.json();
        setEmailAvailable(data.available);
      } catch (e) {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Debounced phone check
  useEffect(() => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      setPhoneAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingPhone(true);
      try {
        const res = await fetch(`/api/auth/check-availability?phoneNumber=${formData.phoneNumber}`);
        const data = await res.json();
        setPhoneAvailable(data.available);
      } catch (e) {
        setPhoneAvailable(null);
      } finally {
        setCheckingPhone(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.phoneNumber]);

  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep((p) => p + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep((p) => p - 1); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "imageUrl" | "verificationDoc") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const res = await fetch("/api/upload/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { presignedUrl, publicUrl, error: apiError } = await res.json();
      if (!res.ok) throw new Error(apiError || "Failed to initialize upload");
      const uploadRes = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadRes.ok) throw new Error("Failed to upload image");
      setFormData((prev) => ({ ...prev, [fieldName]: publicUrl }));
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: formData.role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          turnstileToken, // Pass token for verification
          ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
          ...(formData.imageUrl && { imageUrl: formData.imageUrl }),
          city: formData.city,
          address: formData.address,
          state: formData.state,
          district: formData.district,
          pincode: formData.pincode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          ...((formData.role === "NGO" || formData.role === "RIDER") && formData.verificationDoc && { verificationDoc: formData.verificationDoc }),
          ...(formData.role === "DONOR" && formData.donorType && { donorType: formData.donorType }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) throw new Error(data.details.map((d: any) => d.message).join(", "));
        throw new Error(data.error || "Registration failed.");
      }
      setSuccess("Mission Ready! Your account has been authenticated and initialized.");
      toast.success("Account created successfully!");
      localStorage.removeItem("sharebite_register_form");
      localStorage.removeItem("sharebite_register_step");
      // Short delay for visual feedback of the premium alert
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went sideways during registration.");
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.role !== null;
      case 1: 
        const basicInfo = formData.name.trim() !== "" && 
                         formData.email.trim() !== "" && 
                         formData.password.length >= 6 && 
                         formData.password === formData.confirmPassword;
        if (formData.role === "DONOR") {
          return basicInfo && formData.donorType !== "";
        }
        return basicInfo;
      case 2:
        if (formData.role === "NGO" || formData.role === "RIDER") {
          return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.pincode.trim() !== "" && formData.verificationDoc.trim() !== "" && formData.hasAgreedToTerms;
        }
        return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.pincode.trim() !== "" && formData.hasAgreedToTerms;
      default: return true;
    }
  };

  const currentInfo = stepDescriptions[formData.role || "DONOR"];

  // For Step 2 (map step), we use a wider layout
  const isMapStep = currentStep === 2;

  if (!isHydrated) return <div className="min-h-screen w-full flex items-center justify-center bg-orange-50/50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-xs uppercase tracking-[0.2em] font-black text-orange-600 animate-pulse">Initializing Interface...</span>
    </div>
  </div>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        layout
        className={cn(
          "w-full overflow-hidden rounded-2xl flex bg-white shadow-xl transition-all duration-500",
          isMapStep ? "max-w-6xl" : "max-w-4xl"
        )}
      >
        {/* Left side - Animated Dot Map (hidden on map step since we show LocationPicker) */}
        {!isMapStep && (
          <div className="hidden md:block w-1/2 min-h-[620px] relative overflow-hidden border-r border-orange-100">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100">
              <DotMap />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-200">
                    <Utensils className="text-white h-7 w-7" />
                  </div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600"
                >
                  ShareBite
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-center text-gray-600 max-w-xs"
                >
                  {currentInfo.subtitle}
                </motion.p>

                {/* Step Progress Dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center gap-3 mt-8"
                >
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500",
                        i < currentStep ? "bg-orange-600 text-white" :
                        i === currentStep ? "bg-white text-orange-600 shadow-lg ring-2 ring-orange-200" :
                        "bg-white/50 text-orange-300"
                      )}>
                        {i < currentStep ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={cn("w-8 h-0.5 rounded-full transition-all", i < currentStep ? "bg-orange-500" : "bg-orange-200")} />
                      )}
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Right side - Form */}
        <div className={cn(
          "flex flex-col bg-white p-6 sm:p-8 md:p-10",
          isMapStep ? "w-full" : "w-full md:w-1/2"
        )}>
          {success && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6">
              <Alert variant="success" className="rounded-2xl border-emerald-100 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800 font-bold tracking-tight">Authenticated</AlertTitle>
                <AlertDescription className="text-emerald-600 text-xs">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6">
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold tracking-tight">Deployment Error</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {/* ─── STEP 0: Role Selection ─── */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col justify-center h-full sm:px-4"
              >
                <h1 className="text-2xl sm:text-3xl font-black mb-1 text-slate-950 uppercase italic tracking-tighter">Join Movement</h1>
                <p className="text-slate-400 mb-8 text-xs font-bold uppercase tracking-widest">Select your operational role</p>

                {/* Role Selector Tabs */}
                <div className="flex bg-slate-50 p-1 rounded-2xl mb-8 border border-slate-100/50">
                  {(["DONOR", "NGO", "RIDER"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => updateFormData("role", role)}
                      className={cn(
                        "flex-1 py-3 px-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                        formData.role === role
                          ? "bg-white text-orange-600 shadow-xl shadow-slate-200/50 translate-y-[-1px]"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {role === "NGO" ? "NGO Hub" : role === "RIDER" ? "Fleet" : "Provider"}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <motion.div 
                    layoutId="role-card"
                    className={cn(
                    "p-8 rounded-[2rem] border-2 transition-all duration-500",
                    "border-orange-600 bg-orange-600 text-white shadow-2xl shadow-orange-100"
                  )}>
                    <div className="flex items-center gap-5 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        {formData.role === "DONOR" ? <Heart className="w-7 h-7" /> : formData.role === "NGO" ? <Building2 className="w-7 h-7" /> : <Truck className="w-7 h-7" />}
                      </div>
                      <div>
                        <h3 className="font-black text-xl uppercase italic tracking-tighter leading-none">{stepDescriptions[formData.role || "DONOR"].title}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Status: Recruit</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-90">
                      {stepDescriptions[formData.role || "DONOR"].subtitle}
                    </p>
                  </motion.div>
                </div>

                <div className="flex justify-center mt-10">
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="h-16 w-full sm:w-auto px-12 rounded-2xl bg-slate-950 hover:bg-orange-600 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 transition-all active:scale-95"
                  >
                    Initialize <ChevronRight className="ml-2 w-4 h-4" strokeWidth={3} />
                  </Button>
                </div>

                <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-10">
                  Active Asset?{" "}
                  <Link href="/login" className="text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-orange-600/20">Sign In Portal</Link>
                </p>
              </motion.div>
            )}

            {/* ─── STEP 1: Personal Details ─── */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col justify-center h-full sm:px-4"
              >
                <h1 className="text-2xl sm:text-3xl font-black mb-1 text-slate-950 uppercase italic tracking-tighter">
                  {formData.role === "DONOR" ? "Identify Base" : formData.role === "NGO" ? "Hub Credentials" : "Pilot Registry"}
                </h1>
                <p className="text-slate-400 mb-8 text-[10px] font-bold uppercase tracking-widest">Secure mission-critical credentials</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                      {formData.role === "DONOR" ? "Full Designation" : "Organization Identity"} <span className="text-orange-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder={formData.role === "DONOR" ? "Rahul Singh" : formData.role === "NGO" ? "Feeding India" : "Aman Kumar"}
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:border-orange-500 focus:ring-orange-500 transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                      Email Channel <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="hello@sharebite.org"
                        className={cn(
                          "h-12 bg-slate-50 border-slate-100 rounded-xl pr-12 focus:border-orange-500 focus:ring-orange-500 transition-all text-xs",
                          emailAvailable === false && "border-red-500 bg-red-50 focus:border-red-500",
                          emailAvailable === true && "border-emerald-500 bg-emerald-50 focus:border-emerald-500"
                        )}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {checkingEmail && <Loader2 className="w-4 h-4 animate-spin text-orange-600" />}
                        {emailAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={3} />}
                        {emailAvailable === false && <XCircle className="w-4 h-4 text-red-600" strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {formData.role === "DONOR" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                        Deployment Type <span className="text-orange-500">*</span>
                      </label>
                      <Select
                        onValueChange={(v) => updateFormData("donorType", v)}
                        value={formData.donorType}
                      >
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-xs">
                          <SelectValue placeholder="Select Sector" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-100">
                          <SelectItem value="WEDDING" className="text-xs font-bold uppercase tracking-wider">Wedding / Event</SelectItem>
                          <SelectItem value="NORMAL_VERSION" className="text-xs font-bold uppercase tracking-wider">Individual / Normal</SelectItem>
                          <SelectItem value="OTHER" className="text-xs font-bold uppercase tracking-wider">Logistics / Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Operational Phone</label>
                      <div className="relative">
                        <Input
                          value={formData.phoneNumber}
                          onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                          placeholder="+91 98765 00000"
                          className={cn(
                            "h-12 bg-slate-50 border-slate-100 rounded-xl pr-12 focus:border-orange-500 focus:ring-orange-500 transition-all text-xs",
                            phoneAvailable === false && "border-red-500 bg-red-50 focus:border-red-500",
                            phoneAvailable === true && "border-emerald-500 bg-emerald-50 focus:border-emerald-500"
                          )}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                          {checkingPhone && <Loader2 className="w-4 h-4 animate-spin text-orange-600" />}
                          {phoneAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={3} />}
                          {phoneAvailable === false && <XCircle className="w-4 h-4 text-red-600" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                        Secure Key <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={isPasswordVisible ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            "h-12 bg-slate-50 border-slate-100 rounded-xl pr-12 focus:border-orange-500 focus:ring-orange-500 transition-all text-xs",
                            formData.password.length > 0 && formData.password.length < 6 && "border-red-300 focus:ring-red-500"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
                        >
                          {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                        Confirm Shield <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={isPasswordVisible ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            "h-12 bg-slate-50 border-slate-100 rounded-xl focus:border-orange-500 focus:ring-orange-500 transition-all text-xs",
                            formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && "border-red-400 bg-red-50"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-10">
                  <Button variant="ghost" onClick={prevStep} className="text-slate-400 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 rounded-xl px-6">
                    <ChevronLeft className="mr-2 w-4 h-4" strokeWidth={3} /> Abort
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="h-14 px-10 rounded-xl bg-slate-950 hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Continue <ChevronRight className="ml-2 w-4 h-4" strokeWidth={3} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: Location + Verification (Full Width with Map) ─── */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row w-full min-h-[500px]"
              >
                {/* Map Section */}
                <div className="w-full lg:w-[55%] h-[300px] lg:h-auto border-r border-slate-100 relative grayscale-[0.2] hover:grayscale-0 transition-all duration-700">
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl border border-white/50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-100 rotate-6">
                        <MapPin className="w-4 h-4 text-white" fill="white" />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-800">Operational Base Set</p>
                    </div>
                  </div>
                  <LocationPicker
                    onLocationSelect={(data) => {
                      setFormData((prev) => ({
                        ...prev,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        district: data.district,
                        pincode: data.pincode,
                        latitude: data.latitude,
                        longitude: data.longitude,
                      }));
                      toast.success(`Vector Locked: ${data.city}`);
                    }}
                  />
                </div>

                {/* Form Section */}
                <div className="flex-grow flex flex-col p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase italic tracking-tighter mb-1">
                    Deploy Base
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Confirm operational sector details</p>

                  <div className="space-y-4 flex-grow">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">City Hub</label>
                        <Input readOnly value={formData.city} placeholder="Pin Map" className="bg-slate-50 border-slate-100 text-xs h-11 rounded-xl font-bold" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Postal Code</label>
                        <Input readOnly value={formData.pincode} placeholder="----" className="bg-slate-50 border-slate-100 text-orange-600 font-black text-xs h-11 rounded-xl" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Physical Vector Address</label>
                      <Input
                        value={formData.address}
                        onChange={(e) => updateFormData("address", e.target.value)}
                        placeholder="Verify your street address"
                        className="bg-slate-50 border-slate-100 text-xs h-11 rounded-xl"
                      />
                    </div>

                    {/* File Upload / Documentation */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                        {formData.role === "DONOR" ? "Mission Profile Icon" : "Registry Documentation"}
                      </label>
                      <div
                        onClick={() => !uploadingImage && (formData.role === "DONOR" ? fileInputRef.current?.click() : verifyInputRef.current?.click())}
                        className={cn(
                          "w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all duration-300",
                          formData.imageUrl || formData.verificationDoc ? "border-emerald-500/20 bg-emerald-50/10" : "border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-orange-500/30"
                        )}
                      >
                        <input
                          type="file" accept="image/*" className="hidden"
                          ref={formData.role === "DONOR" ? fileInputRef : verifyInputRef}
                          onChange={(e) => handleFileUpload(e, formData.role === "DONOR" ? "imageUrl" : "verificationDoc")}
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-orange-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Uploading Stream...</span>
                          </div>
                        ) : (formData.imageUrl || formData.verificationDoc) ? (
                          <>
                            <img src={formData.role === "DONOR" ? formData.imageUrl : formData.verificationDoc} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" alt="Uploaded" />
                            <div className="relative z-10 flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl">
                                <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                              </div>
                              <span className="text-[8px] font-black uppercase bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-emerald-600">Securely Linked</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-300">
                            <UploadCloud className="w-6 h-6" strokeWidth={1.5} />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Upload Documentation</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Security Check */}
                    <div className="pt-4 pb-2">
                       <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Human Verification</label>
                       <div className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-2xl bg-slate-50/30 min-h-[74px]">
                          <Turnstile 
                            sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "0x4AAAAAACtsY9vA7n-6RWgO"} 
                            onVerify={(token) => setTurnstileToken(token)}
                            theme="light"
                          />
                       </div>
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-4 cursor-pointer group">
                        <div className="relative flex items-center mt-1">
                          <input
                            type="checkbox"
                            checked={formData.hasAgreedToTerms}
                            onChange={(e) => updateFormData("hasAgreedToTerms", e.target.checked)}
                            className="peer h-6 w-6 cursor-pointer appearance-none rounded-xl border-2 border-slate-100 bg-slate-50 checked:border-orange-600 checked:bg-orange-600 transition-all focus:outline-none shadow-sm"
                          />
                          <Check className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-all pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
                        </div>
                        <span className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                          I accept the <Link href={`/terms/${(formData.role || "DONOR").toLowerCase()}`} target="_blank" className="text-orange-600 underline underline-offset-4 decoration-orange-600/10">Terms of Operation</Link>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-50">
                    <Button variant="ghost" onClick={prevStep} disabled={isSubmitting} className="text-slate-400 font-black uppercase tracking-widest text-[9px] px-6">
                      <ChevronLeft className="mr-2 w-4 h-4" strokeWidth={3} /> Adjust
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!isStepValid() || isSubmitting || uploadingImage}
                      className="h-14 px-10 rounded-xl bg-slate-950 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-3" /> Initializing...</>
                      ) : (
                        <>Launch Mission <ArrowRight className="ml-3 w-4 h-4" strokeWidth={3} /></>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
