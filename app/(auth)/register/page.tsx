"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Heart, Building2, UploadCloud, CheckCircle2, Image as ImageIcon, MapPin, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LocationPicker from "@/components/map/LocationPicker";

type Role = "DONOR" | "NGO" | "RIDER" | null;

const steps = [
  { id: "role", title: "Role" },
  { id: "personal", title: "Details" },
  { id: "verification", title: "Verification" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

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
    verificationDoc: ""
  });

  const updateFormData = (field: string, value: string | Role) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "imageUrl" | "verificationDoc") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const res = await fetch("/api/upload/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const { presignedUrl, publicUrl, error: apiError } = await res.json();

      if (!res.ok) throw new Error(apiError || "Failed to initialize upload");

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");

      setFormData(prev => ({ ...prev, [fieldName]: publicUrl }));
    } catch (err: any) {
      setError(err.message || "Failed to upload.");
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
            const issues = data.details.map((d: any) => d.message).join(", ");
            throw new Error(issues);
        }
        throw new Error(data.error || "Failed to register.");
      }

      toast.success("Account created successfully!");
      router.push("/login?registered=true");

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false); // Enable returning to form if fails
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.role !== null;
      case 1:
        return formData.name.trim() !== "" && formData.email.trim() !== "" && formData.password.trim() !== "";
      case 2:
        if (formData.role === "NGO" || formData.role === "RIDER") {
           return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.pincode.trim() !== "" && formData.verificationDoc.trim() !== "";
        }
        return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.pincode.trim() !== "";
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-950 flex flex-col items-center justify-center p-6 selection:bg-orange-100 overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50 blur-[130px] rounded-full opacity-60" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50 blur-[130px] rounded-full opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px:32px]" />
      </div>

      <div className={cn("relative z-10 w-full transition-all duration-500 mx-auto py-8", currentStep === 2 ? "max-w-5xl" : "max-w-lg")}>
        
        <div className="flex flex-col items-center mb-8 text-center text-slate-950 font-black">
           <Link href="/" className="flex items-center gap-3 group mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center group-hover:rotate-12 transition-all duration-300">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
           </Link>
           <h1 className="text-3xl tracking-tight">Join ShareBite</h1>
           <p className="text-slate-400 font-bold mt-2 text-sm italic">Connecting surplus food to those who need it most.</p>
        </div>

        {/* Progress indicator */}
        <motion.div
           layout
          className="mb-12 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between mb-2 px-10 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center"
                whileHover={{ scale: 1.1 }}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full transition-all duration-500 flex items-center justify-center text-[10px] font-black z-20",
                    index < currentStep
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-100"
                      : index === currentStep
                        ? "bg-slate-900 text-white ring-4 ring-orange-600/20 shadow-xl"
                        : "bg-white border-2 border-slate-100 text-slate-300",
                  )}
                >
                    {index < currentStep ? <Check className="w-3 h-3" strokeWidth={5} /> : index + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-2 font-black uppercase tracking-[0.2em] hidden sm:block transition-colors duration-300",
                    index <= currentStep
                      ? "text-orange-600"
                      : "text-slate-300",
                  )}
                >
                  {step.title}
                </span>
              </motion.div>
            ))}
          </div>
          
          {/* Progress bar line */}
          <div className="absolute top-3 left-[15%] right-[15%] h-0.5 bg-slate-100 -z-0 rounded-full overflow-hidden">
            <motion.div 
               className="h-full bg-orange-600"
               initial={{ width: 0 }}
               animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
               transition={{ duration: 0.6, ease: "anticipate" }}
            />
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-[0_30px_70px_rgba(0,0,0,0.05)] rounded-[3.5rem] overflow-hidden bg-white">
            <div className="flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  className="w-full"
                >
                  
                  {/* Step 1: Role */}
                  {currentStep === 0 && (
                    <div className="py-2">
                      <CardHeader className="p-10 pb-4">
                        <CardTitle className="text-3xl font-black italic tracking-tight underline decoration-orange-600/10">Select your role</CardTitle>
                        <CardDescription className="font-bold text-slate-500 text-lg">
                          How will you use the platform?
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 px-10 pb-6">
                         <RadioGroup
                          value={formData.role ?? ""}
                          onValueChange={(value) => updateFormData("role", value as Role)}
                          className="grid grid-cols-1 gap-4"
                        >
                          {[
                            { value: "DONOR", label: "I'm a Donor", desc: "For restaurants, individuals, and businesses.", icon: <Heart className="w-6 h-6" /> },
                            { value: "NGO", label: "I'm an NGO", desc: "For organizations distributing food.", icon: <Building2 className="w-6 h-6" /> },
                            { value: "RIDER", label: "I'm a Rider", desc: "For heroes delivering surplus food.", icon: <Truck className="w-6 h-6" /> },
                          ].map((role, index) => (
                            <motion.div
                              key={role.value}
                              className={cn("flex items-center space-x-5 rounded-[2.5rem] border-2 p-8 cursor-pointer transition-all", formData.role === role.value ? "border-orange-600 bg-orange-50/20 shadow-2xl shadow-orange-100/30" : "border-slate-50 hover:border-orange-200 bg-slate-50/20")}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => updateFormData("role", role.value as Role)}
                            >
                              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-sm", formData.role === role.value ? "bg-orange-600 text-white rotate-6" : "bg-white text-slate-300")}>
                                {role.icon}
                              </div>
                              <div className="flex flex-col flex-grow">
                                  <Label
                                    htmlFor={`role-${index}`}
                                    className="cursor-pointer font-black text-2xl tracking-tighter"
                                  >
                                    {role.label}
                                  </Label>
                                  <span className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-tight">{role.desc}</span>
                              </div>
                              <RadioGroupItem
                                value={role.value}
                                id={`role-${index}`}
                                className="text-orange-600 border-slate-200 scale-150"
                              />
                            </motion.div>
                          ))}
                        </RadioGroup>
                      </CardContent>
                    </div>
                  )}

                  {/* Step 2: Details */}
                  {currentStep === 1 && (
                    <div className="py-2">
                       <CardHeader className="p-10 pb-4 text-slate-900 font-black">
                        <CardTitle className="text-3xl italic tracking-tighter underline decoration-orange-600/10">Base Credentials</CardTitle>
                        <CardDescription className="text-slate-400 text-lg font-bold">
                          Let&apos;s get you setup securely.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 px-10 pb-6">
                        <motion.div variants={fadeInUp} className="space-y-3">
                          <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">
                             {formData.role === "DONOR" ? "Full Name" : "Organization Name"}
                          </Label>
                          <Input
                            id="name"
                            placeholder={formData.role === "DONOR" ? "e.g. Rahul Singh" : "e.g. Feeding India"}
                            value={formData.name}
                            onChange={(e) => updateFormData("name", e.target.value)}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-500 focus:ring-orange-500/10 font-black px-6 text-lg transition-all"
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-3">
                          <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="hello@sharebite.org"
                            value={formData.email}
                            onChange={(e) => updateFormData("email", e.target.value)}
                         className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-500 focus:ring-orange-500/10 font-black px-6 text-lg transition-all"
                          />
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={fadeInUp} className="space-y-3">
                            <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="+91 98765 00000"
                                value={formData.phoneNumber}
                                onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-500 focus:ring-orange-500/10 font-black px-6 text-lg transition-all"
                            />
                            </motion.div>
                            <motion.div variants={fadeInUp} className="space-y-3">
                            <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Secure Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => updateFormData("password", e.target.value)}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:border-orange-500 focus:ring-orange-500/10 font-black px-6 text-lg transition-all"
                            />
                            </motion.div>
                        </div>
                      </CardContent>
                    </div>
                  )}

                  {/* Step 3: Verification (NEW SPLIT UI) */}
                  {currentStep === 2 && (
                    <div className="flex flex-col md:flex-row min-h-[500px]">
                       {/* MAP PART */}
                       <div className="w-full md:w-[60%] h-[350px] md:h-auto border-r border-slate-50 relative">
                          <div className="absolute top-10 left-10 z-20 animate-in fade-in slide-in-from-left-8 duration-1000">
                             <div className="bg-white/95 backdrop-blur-2xl px-6 py-4 rounded-[1.8rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex items-center gap-4 group cursor-default hover:scale-105 transition-transform duration-500">
                                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 rotate-0 group-hover:rotate-12 transition-transform">
                                   <MapPin className="w-5 h-5 text-white" fill="white" />
                                </div>
                                <div>
                                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 leading-none mb-1.5 opacity-80">Interactive Grid</p>
                                   <p className="text-sm font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Pin your operational base</p>
                                </div>
                             </div>
                          </div>
                          
                          <LocationPicker 
                            onLocationSelect={(data) => {
                               setFormData(prev => ({
                                  ...prev,
                                  address: data.address,
                                  city: data.city,
                                  state: data.state,
                                  district: data.district,
                                  pincode: data.pincode,
                                  latitude: data.latitude,
                                  longitude: data.longitude
                               }));
                               toast.success(`Success! Hub set at ${data.city}`);
                            }}
                          />
                       </div>

                       {/* FORM PART */}
                       <div className="flex-grow flex flex-col bg-slate-50/20 p-8">
                          <div className="mb-8">
                            <h3 className="text-2xl font-black italic tracking-tighter text-slate-900">
                                {formData.role === "DONOR" ? "Profile Details" : "NGO Hub Setup"}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Finalizing Onboarding</p>
                          </div>

                          <div className="space-y-5 flex-grow overflow-y-auto pr-2 scrollbar-hide">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black border border-red-100 uppercase tracking-widest">
                                    Error: {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detected City</Label>
                                  <Input readOnly value={formData.city} placeholder="Pin Map" className="bg-white border-slate-100 italic font-black h-12 rounded-xl text-xs" />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Zip/Pincode</Label>
                                  <Input readOnly value={formData.pincode} placeholder="..." className="bg-white border-slate-100 italic font-black h-12 rounded-xl text-xs text-orange-600" />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Address</Label>
                               <Input value={formData.address} onChange={(e) => updateFormData("address", e.target.value)} placeholder="Verify detected address" className="font-black border-slate-100 h-12 rounded-xl bg-white text-xs" />
                            </div>

                            <div className="pt-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-3 block">
                                   {formData.role === "DONOR" ? "Identity Photo" : formData.role === "RIDER" ? "Driver License / ID" : "Registration Proof"}
                                </Label>
                               
                               <div 
                                  onClick={() => !uploadingImage && (formData.role === "DONOR" ? fileInputRef.current?.click() : verifyInputRef.current?.click())}
                                  className={cn(
                                     "w-full h-32 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative",
                                     formData.imageUrl || formData.verificationDoc ? 'border-orange-200 bg-orange-50/50 shadow-inner' : 'border-slate-100 bg-white hover:border-orange-300'
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
                                        <Loader2 className="w-7 h-7 animate-spin" strokeWidth={3} />
                                        <span className="font-black text-[10px] uppercase tracking-widest">Uploading...</span>
                                     </div>
                                  ) : (formData.imageUrl || formData.verificationDoc) ? (
                                     <>
                                       <img src={formData.role === "DONOR" ? formData.imageUrl : formData.verificationDoc} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Doc" />
                                       <div className="relative z-10 flex flex-col items-center gap-1">
                                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                                          <span className="font-black text-[9px] uppercase bg-white px-3 py-1 rounded-full shadow-sm">Uploaded</span>
                                       </div>
                                     </>
                                  ) : (
                                     <div className="flex flex-col items-center gap-1 text-slate-300">
                                       <UploadCloud className="w-7 h-7 mb-1" />
                                       <span className="font-black text-[10px] uppercase tracking-widest">Drop File</span>
                                     </div>
                                  )}
                               </div>
                            </div>
                          </div>

                          <div className="pt-8 flex justify-between items-center gap-4">
                             <Button
                                 type="button"
                                 variant="ghost"
                                 onClick={prevStep}
                                 disabled={isSubmitting}
                                 className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 px-6"
                             >
                                 <ChevronLeft className="h-4 w-4 mr-1" /> Back
                             </Button>
                             
                             <Button
                                 type="button"
                                 onClick={handleSubmit}
                                 disabled={!isStepValid() || isSubmitting || uploadingImage}
                                 className="flex-grow h-14 rounded-2xl bg-slate-950 text-white font-black hover:bg-orange-600 transition-all shadow-xl group/btn"
                             >
                                 {isSubmitting ? (
                                   <div className="flex items-center gap-2">
                                       <Loader2 className="h-4 w-4 animate-spin" /> <span>Deploying...</span>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2 uppercase tracking-widest text-xs">
                                       Complete Registration <Check className="h-4 w-4 group-hover/btn:scale-125 transition-transform" />
                                   </div>
                                 )}
                             </Button>
                          </div>
                       </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* SHARED FOOTER FOR STEPS 0 & 1 */}
              {currentStep < 2 && (
                <div className="px-10 pb-10 pt-4">
                    <div className="flex justify-between items-center border-t border-slate-50 pt-8">
                      <Button
                          type="button"
                          variant="ghost"
                          onClick={prevStep}
                          disabled={currentStep === 0 || isSubmitting}
                          className={cn(
                             "flex items-center gap-2 transition-all duration-300 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-950",
                             currentStep === 0 && "opacity-0 pointer-events-none"
                          )}
                      >
                          <ChevronLeft className="h-4 w-4" /> Back
                      </Button>
                      
                      <Button
                          type="button"
                          onClick={nextStep}
                          disabled={!isStepValid() || uploadingImage}
                          className="flex items-center gap-3 h-16 font-black transition-all duration-300 rounded-2xl bg-slate-950 text-white hover:bg-orange-600 px-10 shadow-2xl active:scale-95 group/next"
                      >
                          <span className="uppercase tracking-widest text-xs">Access Next Step</span>
                          <ChevronRight className="h-5 w-5 group-hover/next:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <p className="mt-12 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
           Part of the movement? <Link href="/login" className="text-orange-600 hover:text-orange-700 underline underline-offset-4 ml-1">Log In Here</Link>
        </p>

      </div>
    </div>
  );
}
