"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Loader2, 
  Check,
  CheckCircle2,
  Clock,
  Zap,
  Timer,
  Shield,
  AlertCircle,
  Package,
  Calendar,
  Layers,
  Heart,
  Soup,
  ArrowLeft,
  Camera,
  Search,
  LayoutGrid,
  UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import LocationPicker from "@/components/map/LocationPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import GuidedAddressSelector from "@/components/map/GuidedAddressSelector";
import { 
  GiBroccoli, 
  GiChickenLeg, 
  GiMilkCarton, 
  GiBreadSlice, 
  GiFruitBowl, 
  GiHotMeal, 
  GiWheat, 
  GiBoxUnpacking,
  GiSodaCan,
  GiOpenedFoodCan,
  GiSnowflake1,
  GiStarsStack
} from "react-icons/gi";
import { HiCloudUpload } from "react-icons/hi";

const categories = [
  { value: "VEG", label: "Vegetarian", icon: <GiBroccoli /> },
  { value: "NON_VEG", label: "Non-Veg", icon: <GiChickenLeg /> },
  { value: "DAIRY", label: "Dairy", icon: <GiMilkCarton /> },
  { value: "BAKERY", label: "Bakery", icon: <GiBreadSlice /> },
  { value: "FRUITS_AND_VEGGIES", label: "Produce", icon: <GiFruitBowl /> },
  { value: "COOKED_FOOD", label: "Cooked", icon: <GiHotMeal /> },
  { value: "STAPLES", label: "Grains", icon: <GiWheat /> },
  { value: "PACKAGED_FOOD", label: "Packaged", icon: <GiBoxUnpacking /> },
  { value: "BEVERAGES", label: "Non-Alcoholic Beverages/Water", icon: <GiSodaCan /> },
  { value: "CANNED_GOODS", label: "Canned", icon: <GiOpenedFoodCan /> },
  { value: "FROZEN_FOOD", label: "Frozen", icon: <GiSnowflake1 /> },
  { value: "OTHERS", label: "Others", icon: <GiStarsStack /> },
];

export default function DonatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapTrigger, setMapTrigger] = useState<string>("");
  const [showGuidedSelector, setShowGuidedSelector] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    quantity: 1,
    weight: 0,
    expiryTime: "",
    pickupStartTime: "",
    pickupEndTime: "",
    pickupLocation: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    imageUrl: ""
  });

  // ── Persistent Location Recovery ──
  React.useEffect(() => {
    const savedLocation = localStorage.getItem("sharebite_last_location");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setFormData(prev => ({
          ...prev,
          pickupLocation: parsed.address || "",
          city: parsed.city || "",
          state: parsed.state || "",
          district: parsed.district || "",
          pincode: parsed.pincode || "",
          latitude: parsed.latitude || 0,
          longitude: parsed.longitude || 0,
        }));
      } catch (e) {
        console.error("Failed to recover saved location", e);
      }
    }
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const expiryPriorities = [
    {
      id: "urgent",
      label: "Urgent",
      subtitle: "Expires within 1-2 hours",
      hours: 1.5,
      icon: <Zap className="w-5 h-5" />,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-600",
      ringColor: "ring-red-500",
      shadowColor: "shadow-red-100",
      pulseColor: "bg-red-500",
    },
    {
      id: "moderate",
      label: "Moderate",
      subtitle: "Expires within 4-5 hours",
      hours: 4.5,
      icon: <Timer className="w-5 h-5" />,
      color: "from-amber-500 to-yellow-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-600",
      ringColor: "ring-amber-500",
      shadowColor: "shadow-amber-100",
      pulseColor: "bg-amber-500",
    },
    {
      id: "safe",
      label: "Safe",
      subtitle: "Has enough time to expire",
      hours: 8,
      icon: <Shield className="w-5 h-5" />,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-600",
      ringColor: "ring-emerald-500",
      shadowColor: "shadow-emerald-100",
      pulseColor: "bg-emerald-500",
    },
  ];

  const handlePrioritySelect = useCallback((priorityId: string, hours: number) => {
    setSelectedPriority(priorityId);
    const now = new Date();
    const expiry = new Date(now.getTime() + hours * 60 * 60 * 1000);
    // Format as datetime-local value: YYYY-MM-DDTHH:MM
    const year = expiry.getFullYear();
    const month = String(expiry.getMonth() + 1).padStart(2, "0");
    const day = String(expiry.getDate()).padStart(2, "0");
    const hrs = String(expiry.getHours()).padStart(2, "0");
    const mins = String(expiry.getMinutes()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}T${hrs}:${mins}`;
    updateFormData("expiryTime", formatted);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); 
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

   
      setIsValidating(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const verifyRes = await fetch("/api/vision/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          base64Data, 
          mimeType: file.type, 
          category: formData.category 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setIsValidating(false);

      const verifyData = await verifyRes.json();

      if (!verifyData.isFood) {
        setPreviewUrl(null);
        toast.error("Verification failed: This doesn't look like food. Please upload a real food photo.");
        return;
      }

      toast.success("Image verified as food! ✅ Uploading...");

 
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Upload initialization failed");
      const { presignedUrl, url } = await res.json();

      let uploadSuccess = false;
      try {
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        uploadSuccess = uploadRes.ok;
      } catch {
        // Fallback check
        try {
          const checkRes = await fetch(url, { method: "HEAD" });
          uploadSuccess = checkRes.ok;
        } catch {
          throw new Error("Upload failed. Try disabling browser extensions.");
        }
      }

      updateFormData("imageUrl", url);
      toast.success("Synchronized with Secure Cloud! ☁️");

    } catch (error: any) {
      console.error(error);
      setPreviewUrl(null);
      updateFormData("imageUrl", "");
      if (error.name === "AbortError") {
        toast.error("AI verification timed out. Please try again.");
      } else {
        toast.error(error.message || "Failed to process image");
      }
    } finally {
      setUploadingImage(false);
      setIsValidating(false);
    }
  };

  const steps = [
    { title: "Basics", icon: <Package /> },
    { title: "Timing", icon: <Calendar /> },
    { title: "Location", icon: <MapPin /> }
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const isStepValid = () => {
    if (currentStep === 0) {
      return formData.title && formData.category && formData.quantity > 0;
    }
    if (currentStep === 1) {
      return formData.expiryTime && formData.pickupStartTime && formData.pickupEndTime;
    }
    if (currentStep === 2) {
      return formData.latitude !== 0 && formData.city;
    }
    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
         const data = await res.json();
         if (data.details) {
           throw new Error(data.details.map((d: any) => d.message).join(", "));
         }
         throw new Error(data.error || "Failed to post donation");
      }

      setSuccess("Mission Accomplished! Your donation has been deployed to the grid.");
      setError(null);
      toast.success("Donation posted! Thank you for sharing.");

      // Save location for next time
      const locationData = {
        address: formData.pickupLocation,
        city: formData.city,
        state: formData.state,
        district: formData.district,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };
      localStorage.setItem("sharebite_last_location", JSON.stringify(locationData));
      
      // Delay redirect to allow the user to see the premium alert
      setTimeout(() => {
        router.push("/donor");
      }, 3000);
    } catch (error: any) {
      setError(error.message);
      setSuccess(null);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
         
         {/* FORM PART - SCROLLABLE */}
         <div className="w-full lg:w-[45%] xl:w-[40%] bg-white border-r border-slate-100 overflow-y-auto p-6 sm:p-8 md:p-12">
            <div className="max-w-md mx-auto min-h-full flex flex-col">
               {/* Steps indicator inside form for better context */}
               <div className="flex items-center justify-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 shrink-0">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all",
                        i < currentStep ? "bg-orange-600 text-white" : 
                        i === currentStep ? "bg-slate-900 text-white shadow-lg" : 
                        "bg-slate-100 text-slate-400"
                      )}>
                        {i < currentStep ? <Check className="w-3 h-3" strokeWidth={5} /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-[9px] uppercase font-black tracking-widest",
                        i <= currentStep ? "text-slate-900" : "text-slate-300"
                      )}>{step.title}</span>
                      {i < steps.length - 1 && <div className="w-4 h-px bg-slate-100 mx-1" />}
                    </div>
                  ))}
                </div>
               
               <AnimatePresence mode="wait">
                  <motion.div
                     key={currentStep}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 10 }}
                     transition={{ duration: 0.3 }}
                     className="flex-grow space-y-8"
                  >
                     {/* Alerts Section */}
                     {success && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                          <Alert variant="success" className="mb-8">
                            <CheckCircle2 className="h-5 w-5" />
                            <AlertTitle>Surplus Shared</AlertTitle>
                            <AlertDescription>{success}</AlertDescription>
                          </Alert>
                        </motion.div>
                     )}
                     {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                          <Alert variant="destructive" className="mb-8">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle>Tactical Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                     )}

                     {currentStep === 0 && (
                        <div className="space-y-8">
                           <div className="space-y-2">
                              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 underline decoration-orange-600/10">Food Basics</h2>
                              <p className="text-sm font-bold text-slate-400">Describe what you&apos;re sharing today.</p>
                           </div>

                           <div className="space-y-6 pt-4">
                              <div className="space-y-3">
                                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Category <span className="text-orange-500">*</span></Label>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {categories.map((cat) => (
                                       <button
                                          key={cat.value}
                                          onClick={() => updateFormData("category", cat.value)}
                                          className={cn(
                                             "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group touch-manipulation",
                                             formData.category === cat.value ? "border-orange-600 bg-orange-50/30 text-orange-600 shadow-xl shadow-orange-100" : "border-slate-50 bg-slate-50/50 hover:border-orange-200"
                                          )}
                                       >
                                          <div className="text-3xl group-hover:scale-110 transition-all text-orange-600/80 group-hover:text-orange-600">{cat.icon}</div>
                                          <span className="text-[9.5px] font-black uppercase tracking-tighter leading-tight">{cat.label}</span>
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Giving it a name <span className="text-orange-500">*</span></Label>
                                 <Input 
                                    placeholder="e.g. Extra Lunch Biryani" 
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black px-6 text-lg transition-all"
                                    value={formData.title}
                                    onChange={(e) => updateFormData("title", e.target.value)}
                                 />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Servings Count</Label>
                                    <Input 
                                       type="number" 
                                       className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black px-6 text-lg transition-all"
                                       value={formData.quantity}
                                       min={1}
                                       onChange={(e) => updateFormData("quantity", parseInt(e.target.value) || 0)}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Approx Weight (kg)</Label>
                                    <Input 
                                       type="number" 
                                       className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black px-6 text-lg transition-all"
                                       value={formData.weight}
                                       step="0.1"
                                       onChange={(e) => updateFormData("weight", parseFloat(e.target.value) || 0)}
                                    />
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                                 <Textarea 
                                    placeholder="Any specific handling instructions or details?" 
                                    className="rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-medium px-6 py-4 min-h-[120px] transition-all"
                                    value={formData.description}
                                    onChange={(e) => updateFormData("description", e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {currentStep === 1 && (
                        <div className="space-y-8">
                           <div className="space-y-2">
                              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 underline decoration-orange-600/10">Timing Logistics</h2>
                              <p className="text-sm font-bold text-slate-400">When should we pick this up?</p>
                           </div>

                           <div className="space-y-6 pt-4">
                              {/* Expiry Priority System */}
                              <div className="space-y-4">
                                 <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Expiry Priority <span className="text-orange-500">*</span></Label>
                                 </div>
                                 
                                 <div className="space-y-3">
                                    {expiryPriorities.map((priority) => {
                                       const isSelected = selectedPriority === priority.id;
                                       return (
                                          <button
                                             key={priority.id}
                                             type="button"
                                             onClick={() => handlePrioritySelect(priority.id, priority.hours)}
                                             className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden",
                                                isSelected
                                                   ? `${priority.borderColor} ${priority.bgColor} ring-2 ${priority.ringColor} ring-offset-2 shadow-xl ${priority.shadowColor}`
                                                   : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                                             )}
                                          >
                                             {/* Radio Indicator */}
                                             <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                                isSelected
                                                   ? `${priority.borderColor} ${priority.bgColor}`
                                                   : "border-slate-200 bg-white"
                                             )}>
                                                {isSelected && (
                                                   <motion.div
                                                      initial={{ scale: 0 }}
                                                      animate={{ scale: 1 }}
                                                      className={cn("w-3 h-3 rounded-full bg-gradient-to-br", priority.color)}
                                                   />
                                                )}
                                             </div>

                                             {/* Icon */}
                                             <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                                isSelected
                                                   ? `bg-gradient-to-br ${priority.color} text-white shadow-lg ${priority.shadowColor}`
                                                   : "bg-slate-100 text-slate-400 group-hover:text-slate-600"
                                             )}>
                                                {priority.icon}
                                             </div>

                                             {/* Text */}
                                             <div className="flex-grow text-left">
                                                <p className={cn(
                                                   "font-black text-sm tracking-tight transition-colors",
                                                   isSelected ? priority.textColor : "text-slate-700"
                                                )}>{priority.label}</p>
                                                <p className={cn(
                                                   "text-[11px] font-bold transition-colors mt-0.5",
                                                   isSelected ? `${priority.textColor} opacity-70` : "text-slate-400"
                                                )}>{priority.subtitle}</p>
                                             </div>

                                             {/* Hamburger / indicator */}
                                             {isSelected && (
                                                <motion.div
                                                   initial={{ opacity: 0, scale: 0.5 }}
                                                   animate={{ opacity: 1, scale: 1 }}
                                                   className={cn("w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0", priority.color)}
                                                >
                                                   <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                                                </motion.div>
                                             )}
                                          </button>
                                       );
                                    })}
                                 </div>

                                 {/* Auto-calculated expiry display */}
                                 {selectedPriority && formData.expiryTime && (
                                    <motion.div
                                       initial={{ opacity: 0, y: -8 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-2xl"
                                    >
                                       <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                       <p className="text-[11px] font-bold text-white/80">
                                          Auto-set expiry: <span className="text-orange-400 font-black">{new Date(formData.expiryTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                                       </p>
                                    </motion.div>
                                 )}

                                 {/* Or manual override */}
                                 <div className="relative">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-slate-100" />
                                    <p className="relative inline-block bg-white pr-3 text-[10px] font-black uppercase tracking-widest text-slate-300">or set manually</p>
                                 </div>

                                 <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100 group-focus-within:border-orange-200 transition-all pointer-events-none">
                                       <Calendar className="w-5 h-5" />
                                    </div>
                                    <Input 
                                       type="datetime-local" 
                                       className="pl-16 h-16 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black text-sm transition-all cursor-pointer w-full pr-4"
                                       value={formData.expiryTime}
                                       onChange={(e) => {
                                          updateFormData("expiryTime", e.target.value);
                                          setSelectedPriority(null); // Clear priority if user manually edits
                                       }}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black uppercase text-orange-600/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                       Tap to Change
                                    </div>
                                 </div>
                                 <p className="text-[10px] font-bold text-orange-600 ml-1 opacity-70">Avoid wasting food, set a realistic safety buffer.</p>
                              </div>

                              {/* Refined Pickup Logistics - Strategic Time Windows */}
                              <div className="space-y-6 pt-4 border-t border-slate-50">
                                 <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Pickup Date <span className="text-orange-500">*</span></Label>
                                    <div className="relative group">
                                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 transition-colors group-focus-within:text-orange-600 pointer-events-none" />
                                       <Input 
                                          type="date" 
                                          required
                                          onClick={(e) => e.currentTarget.showPicker?.()}
                                          className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black text-sm transition-all cursor-pointer w-full"
                                          value={formData.pickupStartTime.split('T')[0] || ""}
                                          onChange={(e) => {
                                             const newDate = e.target.value;
                                             const startTime = formData.pickupStartTime.split('T')[1] || "12:00";
                                             const endTime = formData.pickupEndTime.split('T')[1] || "15:00";
                                             updateFormData("pickupStartTime", `${newDate}T${startTime}`);
                                             updateFormData("pickupEndTime", `${newDate}T${endTime}`);
                                          }}
                                       />
                                       <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-black uppercase text-orange-600/40">Select Day</div>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                       <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">From (Start)</Label>
                                       <div className="relative group">
                                          <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 transition-colors group-focus-within:text-orange-600 pointer-events-none" />
                                          <Input 
                                             type="time" 
                                             onClick={(e) => e.currentTarget.showPicker?.()}
                                             className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black text-sm transition-all cursor-pointer w-full"
                                             value={formData.pickupStartTime.split('T')[1] || ""}
                                             onChange={(e) => {
                                                const date = formData.pickupStartTime.split('T')[0] || new Date().toISOString().split('T')[0];
                                                updateFormData("pickupStartTime", `${date}T${e.target.value}`);
                                             }}
                                          />
                                       </div>
                                    </div>
                                    <div className="space-y-3">
                                       <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">To (End)</Label>
                                       <div className="relative group">
                                          <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 transition-colors group-focus-within:text-orange-600 pointer-events-none" />
                                          <Input 
                                             type="time" 
                                             onClick={(e) => e.currentTarget.showPicker?.()}
                                             className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black text-sm transition-all cursor-pointer w-full"
                                             value={formData.pickupEndTime.split('T')[1] || ""}
                                             onChange={(e) => {
                                                const date = formData.pickupEndTime.split('T')[0] || new Date().toISOString().split('T')[0];
                                                updateFormData("pickupEndTime", `${date}T${e.target.value}`);
                                             }}
                                          />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="pt-8 space-y-4">
                                 <div className="flex items-center justify-between">
                                   <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Proof (Optional)</Label>
                                   {formData.imageUrl && (
                                     <button 
                                       onClick={() => updateFormData("imageUrl", "")} 
                                       className="text-[10px] font-black text-red-500 uppercase tracking-widest"
                                     >
                                       Remove
                                     </button>
                                   )}
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-3">
                                    <button
                                       type="button"
                                       onClick={() => !uploadingImage && cameraInputRef.current?.click()}
                                       className={cn(
                                          "flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-2 transition-all",
                                          formData.imageUrl ? "border-slate-100 bg-slate-50/50" : "border-orange-100 bg-orange-50/20 text-orange-600 shadow-lg shadow-orange-100/50"
                                       )}
                                    >
                                       <Camera className="w-6 h-6" />
                                       <span className="text-[10px] font-black uppercase tracking-widest">Take Photo</span>
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                       className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/50 text-slate-400 hover:border-orange-200 hover:text-orange-600 transition-all"
                                    >
                                       <HiCloudUpload className="w-8 h-8" />
                                       <span className="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
                                    </button>
                                 </div>

                                 <input 
                                   type="file" accept="image/*" capture="environment" className="hidden" 
                                   ref={cameraInputRef} 
                                   onChange={handleFileUpload}
                                   disabled={uploadingImage}
                                 />
                                 <input 
                                   type="file" accept="image/*" className="hidden" 
                                   ref={fileInputRef} 
                                   onChange={handleFileUpload}
                                   disabled={uploadingImage}
                                 />

                                 {formData.imageUrl && (
                                    <motion.div
                                       initial={{ opacity: 0, scale: 0.95 }}
                                       animate={{ opacity: 1, scale: 1 }}
                                       className="relative w-full h-48 rounded-[2rem] overflow-hidden border-2 border-orange-200 shadow-xl"
                                    >
                                       <img src={(previewUrl || formData.imageUrl) as string} className="w-full h-full object-cover" alt="Preview" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5">
                                          <div className="flex items-center gap-2 text-white">
                                             <div className="p-1.5 bg-green-500 rounded-full">
                                                <Check className="w-3 h-3" strokeWidth={5} />
                                             </div>
                                             <span className="text-[10px] font-black uppercase tracking-widest">Photo ready for deployment</span>
                                          </div>
                                       </div>
                                    </motion.div>
                                 )}
                                 
                                 {uploadingImage && (
                                    <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                       <Loader2 className="w-5 h-5 animate-spin text-orange-600 mr-3" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing visual data...</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )}

                     {currentStep === 2 && (
                        <div className="space-y-8">
                           <div className="space-y-2">
                              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 underline decoration-orange-600/10">Location Check</h2>
                              <p className="text-sm font-bold text-slate-400">Confirm where items are stored.</p>
                           </div>

                           <div className="space-y-6 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">City</Label>
                                    <Input readOnly value={formData.city} placeholder="Pin Map ->" className="bg-slate-50 border-slate-100 font-black italic h-12 rounded-xl text-xs" />
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Zipcode</Label>
                                    <Input readOnly value={formData.pincode} placeholder="..." className="bg-slate-50 border-slate-100 font-black italic h-12 rounded-xl text-xs" />
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Logistics Address</Label>
                                 <div className="flex gap-2 relative">
                                    <Input 
                                       className="flex-grow h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-600 font-black px-6 text-sm transition-all"
                                       value={formData.pickupLocation}
                                       placeholder="Door no, Street, Landmark..."
                                       onChange={(e) => updateFormData("pickupLocation", e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                       <Button 
                                          variant="outline" 
                                          type="button"
                                          className="h-14 rounded-2xl border-2 border-orange-100 text-orange-600 hover:bg-orange-50 font-black text-[10px] uppercase px-4 flex items-center gap-2"
                                          onClick={() => setMapTrigger(formData.pickupLocation)}
                                       >
                                          <Search className="w-3.5 h-3.5" /> Pin
                                       </Button>
                                       <Button 
                                          variant="outline" 
                                          type="button"
                                          className={cn(
                                             "h-14 rounded-2xl border-2 font-black text-[10px] uppercase px-4 flex items-center gap-2 transition-all",
                                             showGuidedSelector ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100" : "border-slate-100 text-slate-400 hover:border-orange-100 hover:text-orange-600"
                                          )}
                                          onClick={() => setShowGuidedSelector(!showGuidedSelector)}
                                       >
                                          <LayoutGrid className="w-3.5 h-3.5" /> Guide
                                       </Button>
                                    </div>

                                    <AnimatePresence>
                                       {showGuidedSelector && (
                                          <>
                                             <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setShowGuidedSelector(false)}
                                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
                                             />
                                             <motion.div 
                                                initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                                                animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                                                className="fixed lg:absolute top-1/2 lg:top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:translate-y-0 w-[90%] max-w-[400px] z-[60] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] h-fit"
                                             >
                                                <GuidedAddressSelector 
                                                   onClose={() => setShowGuidedSelector(false)}
                                                   onSelect={(data) => {
                                                      const newAddress = `${data.area ? data.area + ', ' : ''}${data.city}, ${data.state}`;
                                                      setFormData(prev => ({ 
                                                         ...prev, 
                                                         pickupLocation: prev.pickupLocation && prev.pickupLocation.trim().length > 0 ? prev.pickupLocation : newAddress,
                                                         city: data.city,
                                                         state: data.state
                                                      }));
                                                      setMapTrigger(newAddress);
                                                      setShowGuidedSelector(false);
                                                      toast.success(`Position updated to ${data.city}`);
                                                   }}
                                                />
                                             </motion.div>
                                          </>
                                       )}
                                    </AnimatePresence>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 italic">Try searching or use the &quot;Guide&quot; for structured selection.</p>
                              </div>

                              {/* Mobile Map Integrated - Precise Ops Targeting */}
                              <div className="lg:hidden pt-4">
                                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-3 block">Tactical Pin Pointing</Label>
                                 <div className="h-72 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-100 ring-1 ring-slate-100">
                                    <LocationPicker 
                                       externalSearchTrigger={mapTrigger}
                                       onLocationSelect={(data: { address: any; city: any; state: any; district: any; pincode: any; latitude: any; longitude: any; }) => {
                                          setFormData(prev => ({
                                             ...prev,
                                             pickupLocation: prev.pickupLocation && prev.pickupLocation.trim().length > 0 ? prev.pickupLocation : data.address,
                                             city: data.city,
                                             state: data.state,
                                             district: data.district,
                                             pincode: data.pincode,
                                             latitude: data.latitude,
                                             longitude: data.longitude
                                          }));
                                          toast.success(`Position Locked: ${data.city}`);
                                       }}
                                    />
                                 </div>
                              </div>

                              <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50 mt-10">
                                 <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                                       <Heart className="w-5 h-5 fill-orange-600" />
                                    </div>
                                    <div className="flex-grow">
                                       <h4 className="text-xs font-black uppercase tracking-widest text-orange-900 leading-none mb-1">Impact Preview</h4>
                                       <p className="text-[11px] font-bold text-orange-700/70">Your {formData.quantity || 0} servings will nourish a small community hub in {formData.city || "your area"}.</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </motion.div>
               </AnimatePresence>

               {/* Button Group */}
               <div className="pt-12 mt-auto pb-8 flex items-center gap-4">
                  {currentStep > 0 && (
                     <Button 
                        variant="ghost" 
                        onClick={prevStep}
                        className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400"
                     >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                     </Button>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                     <Button 
                        onClick={nextStep}
                        disabled={!isStepValid()}
                        className="flex-grow h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-orange-600 transition-all shadow-xl active:scale-95 group/next"
                     >
                        <span className="uppercase tracking-widest text-xs">Continue to {steps[currentStep+1].title}</span>
                        <ChevronRight className="w-4 h-4 ml-2 group-hover/next:translate-x-1 transition-transform" />
                     </Button>
                  ) : (
                     <Button 
                        onClick={handleSubmit}
                        disabled={!isStepValid() || isSubmitting || uploadingImage}
                        className="flex-grow h-14 rounded-2xl bg-orange-600 text-white font-black hover:bg-slate-900 transition-all shadow-2xl shadow-orange-100 active:scale-95 italic text-lg"
                     >
                        {isSubmitting ? (
                           <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin" /> Post Now...
                           </div>
                        ) : (
                           <div className="flex items-center gap-2">
                              Launch Donation <Check className="w-5 h-5" strokeWidth={3} />
                           </div>
                        )}
                     </Button>
                  )}
               </div>
            </div>
         </div>

         {/* MAP PART - STATIC/SIDE */}
         <div className="hidden lg:block flex-grow relative bg-slate-100">
            <div className="absolute inset-0 z-0">
               <LocationPicker 
                  externalSearchTrigger={mapTrigger}
                  onLocationSelect={(data: { address: any; city: any; state: any; district: any; pincode: any; latitude: any; longitude: any; }) => {
                     setFormData(prev => ({
                        ...prev,
                        pickupLocation: prev.pickupLocation && prev.pickupLocation.trim().length > 0 ? prev.pickupLocation : data.address,
                        city: data.city,
                        state: data.state,
                        district: data.district,
                        pincode: data.pincode,
                        latitude: data.latitude,
                        longitude: data.longitude
                     }));
                     toast.success(`Success! Pin set at ${data.city}`);
                  }}
               />
            </div>

            {/* Float Info */}
            <div className="absolute top-10 right-10 z-10 w-64 animate-in fade-in slide-in-from-right-8 duration-700">
               <Card className="rounded-[2.5rem] border-0 shadow-2xl shadow-slate-900/10 overflow-hidden bg-white/90 backdrop-blur-md">
                  <CardContent className="p-8">
                     <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-100">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <h3 className="font-black text-sm tracking-tight mb-2">Pin Pickup Point</h3>
                     <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Help our pickup partners find you faster by pinning exactly where items are.</p>
                  </CardContent>
               </Card>
            </div>

            {/* Overlay if not in Step 2 */}
            {currentStep !== 2 && (
               <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] transition-all pointer-events-none" />
            )}
         </div>

      </div>
   );
}
