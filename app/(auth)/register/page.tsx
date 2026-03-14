"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Heart, Building2, UploadCloud, CheckCircle2, Image as ImageIcon } from "lucide-react";
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

type Role = "DONOR" | "NGO" | null;

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
           ...(formData.role === "NGO" && formData.city && { city: formData.city }),
           ...(formData.role === "NGO" && formData.address && { address: formData.address }),
           ...(formData.role === "NGO" && formData.verificationDoc && { verificationDoc: formData.verificationDoc }),
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
        if (formData.role === "NGO") {
           return formData.city.trim() !== "" && formData.address.trim() !== "" && formData.verificationDoc.trim() !== "";
        }
        return true; // Donor Verification is completely optional
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

      <div className="relative z-10 w-full max-w-lg mx-auto py-8">
        
        <div className="flex flex-col items-center mb-8">
           <Link href="/" className="flex items-center gap-3 group mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center group-hover:rotate-12 transition-all duration-300">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
           </Link>
           <h1 className="text-3xl font-black tracking-tight text-center">Join ShareBite</h1>
        </div>

        {/* Progress indicator */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between mb-2 px-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center"
                whileHover={{ scale: 1.1 }}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full transition-colors duration-300",
                    index < currentStep
                      ? "bg-orange-600"
                      : index === currentStep
                        ? "bg-orange-500 ring-4 ring-orange-600/20 shadow-lg"
                        : "bg-slate-200",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] mt-2 font-black uppercase tracking-widest hidden sm:block",
                    index <= currentStep
                      ? "text-orange-600"
                      : "text-slate-400",
                  )}
                >
                  {step.title}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
            <motion.div
              className="h-full bg-orange-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[2.5rem] overflow-hidden bg-white">
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                >
                  
                  {/* Step 1: Role */}
                  {currentStep === 0 && (
                    <>
                      <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-black italic tracking-tight">Select your role</CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                          How will you use the platform?
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 px-8">
                         <RadioGroup
                          value={formData.role ?? ""}
                          onValueChange={(value) => updateFormData("role", value as Role)}
                          className="space-y-3"
                        >
                          {[
                            { value: "DONOR", label: "I'm a Donor", desc: "I want to share surplus food." },
                            { value: "NGO", label: "I'm an NGO", desc: "I distribute food to communities." },
                          ].map((role, index) => (
                            <motion.div
                              key={role.value}
                              className={cn("flex items-center space-x-3 rounded-2xl border-2 p-5 cursor-pointer transition-all", formData.role === role.value ? "border-orange-600 bg-orange-50/50 shadow-sm" : "border-slate-100 hover:border-orange-200")}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => updateFormData("role", role.value as Role)}
                            >
                              <RadioGroupItem
                                value={role.value}
                                id={`role-${index}`}
                                className="text-orange-600 border-slate-300"
                              />
                              <div className="flex flex-col w-full">
                                  <Label
                                    htmlFor={`role-${index}`}
                                    className="cursor-pointer font-black text-lg"
                                  >
                                    {role.label}
                                  </Label>
                                  <span className="text-xs text-slate-500 font-medium mt-1">{role.desc}</span>
                              </div>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      </CardContent>
                    </>
                  )}

                  {/* Step 2: Details */}
                  {currentStep === 1 && (
                    <>
                      <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-black italic tracking-tight">Primary Details</CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                          Let&apos;s get you setup securely.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5 px-8">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                             {formData.role === "DONOR" ? "Full Name" : "Organization Name"} <span className="text-orange-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            placeholder={formData.role === "DONOR" ? "Jane Doe" : "Hope Foundation"}
                            value={formData.name}
                            onChange={(e) => updateFormData("name", e.target.value)}
                            className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-medium transition-all"
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address <span className="text-orange-500">*</span></Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="hello@example.com"
                            value={formData.email}
                            onChange={(e) => updateFormData("email", e.target.value)}
                         className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-medium transition-all"
                          />
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div variants={fadeInUp} className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</Label>
                            <Input
                                id="phone"
                                placeholder="+91 987654321"
                                value={formData.phoneNumber}
                                onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                            className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-medium transition-all"
                            />
                            </motion.div>
                            <motion.div variants={fadeInUp} className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Secure Password <span className="text-orange-500">*</span></Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => updateFormData("password", e.target.value)}
                            className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-medium transition-all"
                            />
                            </motion.div>
                        </div>
                      </CardContent>
                    </>
                  )}

                  {/* Step 3: Verification */}
                  {currentStep === 2 && (
                    <>
                      <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-black italic tracking-tight">
                            {formData.role === "DONOR" ? "Make it Personal" : "NGO Verification"}
                        </CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                          {formData.role === "DONOR" ? "Add an avatar so others can recognize you (Optional)." : "Provide location and certification."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5 px-8">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        {formData.role === "DONOR" && (
                           <motion.div variants={fadeInUp} className="space-y-3">
                             <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Avatar</Label>
                             <div 
                                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative ${
                                  formData.imageUrl ? 'border-orange-200 bg-orange-50' : 'border-slate-200 hover:border-orange-400 hover:bg-slate-50'
                                }`}
                             >
                                <input 
                                   type="file" accept="image/*" className="hidden" 
                                   ref={fileInputRef} 
                                   onChange={(e) => handleFileUpload(e, "imageUrl")}
                                   disabled={uploadingImage}
                                />
                                {uploadingImage ? (
                                   <div className="flex flex-col items-center gap-3 text-orange-600">
                                      <Loader2 className="w-8 h-8 animate-spin" />
                                      <span className="font-bold text-sm">Uploading...</span>
                                   </div>
                                ) : formData.imageUrl ? (
                                   <>
                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                     <img src={formData.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Avatar" />
                                     <div className="relative z-10 flex flex-col items-center text-orange-800 bg-white/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                                       <CheckCircle2 className="w-6 h-6 mb-1" />
                                       <span className="font-bold text-sm">Uploaded</span>
                                     </div>
                                   </>
                                ) : (
                                   <div className="flex flex-col items-center gap-2 text-slate-400">
                                     <ImageIcon className="w-6 h-6 mb-2" />
                                     <span className="font-bold text-sm">Tap to upload</span>
                                   </div>
                                )}
                             </div>
                           </motion.div>
                        )}
                        
                        {formData.role === "NGO" && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <motion.div variants={fadeInUp} className="space-y-2">
                                        <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-400">City <span className="text-orange-500">*</span></Label>
                                        <Input
                                            id="city"
                                            placeholder="Mumbai"
                                            value={formData.city}
                                            onChange={(e) => updateFormData("city", e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-medium transition-all"
                                        />
                                    </motion.div>
                                    <motion.div variants={fadeInUp} className="space-y-2">
                                        <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Locality <span className="text-orange-500">*</span></Label>
                                        <Input
                                            id="address"
                                            placeholder="Sector 12"
                                            value={formData.address}
                                            onChange={(e) => updateFormData("address", e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-medium transition-all"
                                        />
                                    </motion.div>
                                </div>
                                <motion.div variants={fadeInUp} className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Registration Document Photo <span className="text-orange-500">*</span></Label>
                                    <div 
                                        onClick={() => !uploadingImage && verifyInputRef.current?.click()}
                                        className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative ${
                                        formData.verificationDoc ? 'border-amber-200 bg-amber-50' : 'border-slate-200 hover:border-amber-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input 
                                            type="file" accept="image/*" className="hidden" 
                                            ref={verifyInputRef} 
                                            onChange={(e) => handleFileUpload(e, "verificationDoc")}
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage ? (
                                            <div className="flex flex-col items-center gap-3 text-amber-600">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="font-bold text-sm">Securing Document...</span>
                                            </div>
                                        ) : formData.verificationDoc ? (
                                            <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={formData.verificationDoc} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Doc" />
                                            <div className="relative z-10 flex flex-col items-center text-amber-800 bg-white/80 px-4 py-2 rounded-xl backdrop-blur-sm border border-amber-100">
                                                <CheckCircle2 className="w-6 h-6 mb-1" />
                                                <span className="font-bold text-sm">Securely Uploaded</span>
                                            </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <UploadCloud className="w-6 h-6 mb-1" />
                                                <span className="font-bold text-sm">Tap to upload proof of operation</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                      </CardContent>
                    </>
                  )}

                </motion.div>
              </AnimatePresence>

              <div className="px-8 pb-8 pt-4">
                  <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 0 || isSubmitting}
                        className={cn(
                           "flex items-center gap-1 transition-all duration-300 rounded-xl font-bold border-slate-200 text-slate-500",
                           currentStep === 0 && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    
                    <Button
                        type="button"
                        onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
                        disabled={!isStepValid() || isSubmitting || uploadingImage}
                        className="flex items-center gap-2 transition-all duration-300 rounded-xl bg-slate-950 text-white font-black hover:bg-orange-600 px-6"
                    >
                        {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Launching...
                        </>
                        ) : (
                        <>
                            {currentStep === steps.length - 1 ? "Complete Registration" : "Continue"}
                            {currentStep === steps.length - 1 ? (
                            <Check className="h-4 w-4" />
                            ) : (
                            <ChevronRight className="h-4 w-4" />
                            )}
                        </>
                        )}
                    </Button>
                  </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <p className="mt-8 text-center text-sm font-bold text-slate-400">
           Already part of the network? <Link href="/login" className="text-orange-600 hover:text-orange-700 hover:underline transition-colors">Sign In Instead</Link>
        </p>

      </div>
    </div>
  );
}
