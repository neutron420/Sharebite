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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    role: "DONOR" as Role,
    name: "",
    email: "",
    password: "",
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
  });

  const updateFormData = (field: string, value: string | Role) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
        const basicInfo = formData.name.trim() !== "" && formData.email.trim() !== "" && formData.password.length >= 6;
        if (formData.role === "DONOR") {
          return basicInfo && formData.donorType !== "";
        }
        return basicInfo;
      case 2:
        if (formData.role === "NGO" || formData.role === "RIDER") {
          return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.pincode.trim() !== "" && formData.verificationDoc.trim() !== "";
        }
        return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.pincode.trim() !== "";
      default: return true;
    }
  };

  const currentInfo = stepDescriptions[formData.role || "DONOR"];

  // For Step 2 (map step), we use a wider layout
  const isMapStep = currentStep === 2;

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
          "flex flex-col bg-white p-8 md:p-10",
          isMapStep ? "w-full flex-row" : "w-full md:w-1/2"
        )}>
          {success && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6">
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Authenticated</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {/* ─── STEP 0: Role Selection ─── */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-8 md:p-10 flex flex-col justify-center h-full"
              >
                <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">Create Your Account</h1>
                <p className="text-gray-500 mb-6 text-sm">Join the mission to reduce food waste</p>

                {/* Role Selector Tabs (matches Login Page) */}
                <div className="flex bg-orange-50 p-1.5 rounded-xl mb-8">
                  {(["DONOR", "NGO", "RIDER"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => updateFormData("role", role)}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200",
                        formData.role === role
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {role === "NGO" ? "NGO Hub" : role === "RIDER" ? "Rider" : "Donor"}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className={cn(
                    "p-6 rounded-2xl border-2 transition-all duration-300",
                    "border-orange-500 bg-orange-50/30 shadow-md shadow-orange-100/50"
                  )}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                        {formData.role === "DONOR" ? <Heart className="w-6 h-6" /> : formData.role === "NGO" ? <Building2 className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{stepDescriptions[formData.role || "DONOR"].title}</h3>
                        <p className="text-xs text-gray-500 italic">Ready to make an impact?</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stepDescriptions[formData.role || "DONOR"].subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-100 active:scale-95"
                  >
                    Continue <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-400 mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ─── STEP 1: Personal Details ─── */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-8 md:p-10 flex flex-col justify-center h-full"
              >
                <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">
                  {formData.role === "DONOR" ? "Donor Details" : formData.role === "NGO" ? "NGO Hub Setup" : "Rider Details"}
                </h1>
                <p className="text-gray-500 mb-6 text-sm">Secure your account with mission-critical info</p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.role === "DONOR" ? "Full Name" : "Organization Name"} <span className="text-orange-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder={formData.role === "DONOR" ? "e.g. Rahul Singh" : formData.role === "NGO" ? "e.g. Feeding India" : "e.g. Aman Kumar"}
                      className="h-11 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="hello@sharebite.org"
                        className={cn(
                          "h-11 bg-gray-50 border-gray-200 pr-10 focus:border-orange-500 focus:ring-orange-500 transition-all",
                          emailAvailable === false && "border-red-500 bg-red-50 focus:border-red-500",
                          emailAvailable === true && "border-emerald-500 bg-emerald-50 focus:border-emerald-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {checkingEmail && <Loader2 className="w-4 h-4 animate-spin text-orange-600" />}
                        {emailAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shadow-sm" strokeWidth={3} />}
                        {emailAvailable === false && <XCircle className="w-4 h-4 text-red-600" strokeWidth={3} />}
                      </div>
                    </div>
                    {emailAvailable === false && <p className="text-[10px] text-red-500 font-bold mt-1 px-1 italic">Email already in combat!</p>}
                  </div>

                  {formData.role === "DONOR" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        Category <span className="text-orange-500">*</span>
                      </label>
                      <Select
                        onValueChange={(v) => updateFormData("donorType", v)}
                        value={formData.donorType}
                      >
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500">
                          <SelectValue placeholder="Who are you?" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-orange-100">
                          <SelectItem value="WEDDING" className="focus:bg-orange-50 focus:text-orange-600">Wedding / Event</SelectItem>
                          <SelectItem value="NORMAL_VERSION" className="focus:bg-orange-50 focus:text-orange-600">Individual / Normal</SelectItem>
                          <SelectItem value="OTHER" className="focus:bg-orange-50 focus:text-orange-600">Any Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-gray-400 italic">Helps us curate the best experience for you</p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <Input
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                        placeholder="+91 98765 00000"
                        className={cn(
                          "h-11 bg-gray-50 border-gray-200 pr-10 focus:border-orange-500 focus:ring-orange-500 transition-all",
                          phoneAvailable === false && "border-red-500 bg-red-50 focus:border-red-500",
                          phoneAvailable === true && "border-emerald-500 bg-emerald-50 focus:border-emerald-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {checkingPhone && <Loader2 className="w-4 h-4 animate-spin text-orange-600" />}
                        {phoneAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={3} />}
                        {phoneAvailable === false && <XCircle className="w-4 h-4 text-red-600" strokeWidth={3} />}
                      </div>
                    </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={isPasswordVisible ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          placeholder="Min 6 characters"
                          className="h-11 bg-gray-50 border-gray-200 pr-10 focus:border-orange-500 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <Button variant="ghost" onClick={prevStep} className="text-gray-400 font-bold">
                    <ChevronLeft className="mr-1 w-4 h-4" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-100 active:scale-95"
                  >
                    Continue <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: Location + Verification (Full Width with Map) ─── */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-col md:flex-row w-full min-h-[620px]"
              >
                {/* Map Section */}
                <div className="w-full md:w-[60%] h-[350px] md:h-auto border-r border-gray-100 relative">
                  <div className="absolute top-6 left-6 z-20">
                    <div className="bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                        <MapPin className="w-5 h-5 text-white" fill="white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Pin Your Location</p>
                        <p className="text-xs font-bold text-gray-800">Click on the map to set your base</p>
                      </div>
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
                      toast.success(`Location set: ${data.city}`);
                    }}
                  />
                </div>

                {/* Form Section */}
                <div className="flex-grow flex flex-col p-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    {formData.role === "DONOR" ? "Profile Details" : formData.role === "NGO" ? "NGO Hub Setup" : "Rider Base Setup"}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mb-6">Final step — verify your location & upload docs</p>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                  )}

                  <div className="space-y-4 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                        <Input readOnly value={formData.city} placeholder="Pin on map" className="bg-gray-50 border-gray-200 text-sm h-10" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
                        <Input readOnly value={formData.pincode} placeholder="..." className="bg-gray-50 border-gray-200 text-orange-600 font-bold text-sm h-10" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                      <Input
                        value={formData.address}
                        onChange={(e) => updateFormData("address", e.target.value)}
                        placeholder="Verify detected address"
                        className="bg-gray-50 border-gray-200 text-sm h-10"
                      />
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        {formData.role === "DONOR" ? "Profile Photo" : formData.role === "RIDER" ? "Driver License / ID" : "Registration Proof"}
                        {(formData.role === "NGO" || formData.role === "RIDER") && <span className="text-orange-500 ml-1">*</span>}
                      </label>
                      <div
                        onClick={() => !uploadingImage && (formData.role === "DONOR" ? fileInputRef.current?.click() : verifyInputRef.current?.click())}
                        className={cn(
                          "w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all",
                          formData.imageUrl || formData.verificationDoc ? "border-orange-200 bg-orange-50/50" : "border-gray-200 bg-gray-50 hover:border-orange-300"
                        )}
                      >
                        <input
                          type="file" accept="image/*" className="hidden"
                          ref={formData.role === "DONOR" ? fileInputRef : verifyInputRef}
                          onChange={(e) => handleFileUpload(e, formData.role === "DONOR" ? "imageUrl" : "verificationDoc")}
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-1 text-orange-600">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                          </div>
                        ) : (formData.imageUrl || formData.verificationDoc) ? (
                          <>
                            <img src={formData.role === "DONOR" ? formData.imageUrl : formData.verificationDoc} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Uploaded" />
                            <div className="relative z-10 flex flex-col items-center gap-1">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-[10px] font-bold uppercase bg-white px-3 py-1 rounded-full shadow-sm">Uploaded</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-300">
                            <UploadCloud className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Click to upload</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={prevStep} disabled={isSubmitting} className="text-gray-400 font-bold">
                      <ChevronLeft className="mr-1 w-4 h-4" /> Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!isStepValid() || isSubmitting || uploadingImage}
                      className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-100 active:scale-95"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                      ) : (
                        <>Complete Registration <ArrowRight className="ml-2 w-4 h-4" /></>
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
