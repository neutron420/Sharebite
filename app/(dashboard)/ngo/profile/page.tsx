"use client";

import React, { useState, useEffect } from "react";
import { 
 Building2 as Building2Icon, 
 Mail as MailIcon, 
 MapPin as MapPinIcon, 
 ShieldCheck as ShieldCheckIcon, 
 CalendarDays as CalendarDaysIcon,
 UserRound as UserRoundIcon,
 LayoutDashboard as LayoutDashboardIcon,
 FileText as FileTextIcon,
 History as HistoryIcon,
 Phone as PhoneIcon,
 Globe as GlobeIcon,
 Loader2 as Loader2Icon,
 Camera as CameraIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NGOProfile {
 id: string;
 name: string;
 email: string;
 role: string;
 phoneNumber?: string;
 address?: string;
 city?: string;
 state?: string;
 pincode?: string;
 imageUrl?: string;
 isVerified: boolean;
 createdAt: string;
 ngoDetails?: {
 registrationNumber?: string;
 description?: string;
 website?: string;
 };
}

export default function NGOProfilePage() {
 const [profile, setProfile] = useState<NGOProfile | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function fetchProfile() {
 try {
 const res = await fetch("/api/auth/me");
 if (res.ok) {
 const data = await res.json();
 setProfile(data);
 }
 } catch (error) {
 console.error("Profile fetch error:", error);
 } finally {
 setLoading(false);
 }
 }
 fetchProfile();
 }, []);

 if (loading) return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
 <Loader2Icon className="h-10 w-10 text-orange-500 animate-spin" />
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Organization Profile...</p>
 </div>
 );

 if (!profile) return null;

 const initials = profile.name
 .split(" ")
 .filter(Boolean)
 .slice(0, 2)
 .map(n => n[0])
 .join("")
 .toUpperCase();

 return (
 <div className="w-full space-y-6 sm:space-y-8 pb-12 ">
 {/* Cover/Header area */}
 <section className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
 <div className="h-24 sm:h-32 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 opacity-60" />
 
 <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-10 sm:-mt-12 relative flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 text-center sm:text-left">
 <div className="relative group">
 <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden shrink-0">
 <AvatarImage src={profile.imageUrl || undefined} />
 <AvatarFallback className="bg-orange-500 text-white text-2xl sm:text-3xl font-black rounded-none">
 {initials}
 </AvatarFallback>
 </Avatar>
 <button className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-orange-600 transition-all sm:opacity-0 group-hover:opacity-100">
 <CameraIcon size={14} />
 </button>
 </div>

 <div className="flex-1 space-y-2">
 <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
 <Badge className="bg-orange-50 text-orange-600 border-none font-black uppercase tracking-wider text-[9px] px-3 py-1">
 Verified NGO
 </Badge>
 {profile.isVerified && (
 <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
 <ShieldCheckIcon size={10} className="fill-emerald-600 text-white" />
 <span className="text-[9px] font-black uppercase tracking-wider">Trusted Organization</span>
 </div>
 )}
 </div>
 
 <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase line-clamp-2">
 {profile.name}
 </h1>
 
 <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
 <span className="flex items-center gap-1.5">
 <CalendarDaysIcon size={12} className="text-orange-500" /> 
 Joined {profile.createdAt && !isNaN(new Date(profile.createdAt).getTime()) 
 ? format(new Date(profile.createdAt), "MMM yyyy") 
 : "Member"}
 </span>
 <span className="flex items-center gap-1.5"><Building2Icon size={12} className="text-orange-500" /> Reg ID: {profile.ngoDetails?.registrationNumber || "NOT_SET"}</span>
 </div>
 </div>

 <div className="flex sm:hidden w-full gap-2 mt-2">
 <button className="flex-1 bg-slate-950 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200">
 Edit Profile
 </button>
 </div>
 <div className="hidden sm:flex gap-2">
 <button className="bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all shadow-sm">
 Edit Profile
 </button>
 </div>
 </div>
 </section>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
 {/* Contact & Details */}
 <div className="space-y-6">
 <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5 sm:space-y-6">
 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 underline decoration-orange-600/20 underline-offset-4">
 <UserRoundIcon size={14} className="text-orange-500" /> Organization Brief
 </h3>
 
 <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-bold">
 {profile.ngoDetails?.description || "No description provided. Complete your profile to build community trust."}
 </p>

 <div className="space-y-4 pt-4 border-t border-slate-50">
 <DetailItem icon={MailIcon} label="Official Email" value={profile.email} />
 <DetailItem icon={PhoneIcon} label="Primary Contact" value={profile.phoneNumber || "Not provided"} />
 <DetailItem icon={GlobeIcon} label="Digital Presence" value={profile.ngoDetails?.website || "sharebite.com"} />
 <DetailItem icon={MapPinIcon} label="Headquarters" value={`${profile.city || "Not set"}, ${profile.state || "Not set"}`} />
 </div>
 </section>

 <section className="bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-200">
 <div className="flex items-center gap-3 mb-4 sm:mb-6">
 <ShieldCheckIcon size={18} className="text-orange-500" />
 <h4 className="font-black uppercase tracking-widest text-[10px]">Verification Status</h4>
 </div>
 <p className="text-white/60 text-[10px] leading-relaxed font-bold mb-6">
 Direct access to high-priority surplus rescues and donor network events.
 </p>
 <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 ">
 <span className="text-[9px] font-black uppercase tracking-tight">Security Protocol</span>
 <span className="text-[9px] font-black uppercase tracking-tight text-orange-400">ENFORCED</span>
 </div>
 </section>
 </div>

 {/* Stats & Activity */}
 <div className="lg:col-span-2 space-y-6">
 <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
 <StatCard 
 icon={LayoutDashboardIcon} 
 label="Rescues" 
 value="124" 
 helper="Success rate 100%"
 color="orange"
 />
 <StatCard 
 icon={FileTextIcon} 
 label="Efficiency" 
 value="89%" 
 helper="Mission accuracy"
 color="emerald"
 />
 <StatCard 
 icon={HistoryIcon} 
 label="Log Hours" 
 value="412" 
 helper="Total active field time"
 color="blue"
 />
 <StatCard 
 icon={ShieldCheckIcon} 
 label="Audit Score" 
 value="4.9" 
 helper="Community trust"
 color="amber"
 />
 </div>

 <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm ">
 <div className="flex items-center justify-between mb-8 pb-2 border-b border-slate-50">
 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 underline decoration-orange-600/20 underline-offset-4">Mission Lifecycle Log</h3>
 <button className="text-[9px] font-black uppercase tracking-widest text-orange-600 hover:text-slate-950 transition-colors">Audit History</button>
 </div>
 
 <div className="space-y-6">
 {[1, 2, 3].map(i => (
 <div key={i} className="flex gap-4 relative last:after:hidden after:content-[''] after:absolute after:left-[11px] after:top-[28px] after:h-[calc(100%-8px)] after:w-[1px] after:bg-slate-100">
 <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 z-10">
 <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
 </div>
 <div className="flex-1 pb-6">
 <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Intelligence Update: Location Sync</p>
 <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-tight">2 hours ago • Automated Sentinel Event</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 </div>
 </div>
 </div>
 );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
 return (
 <div className="flex items-start gap-3">
 <div className="p-2 rounded-xl bg-slate-50 text-slate-400 shrink-0 border border-slate-100">
 <Icon size={12} />
 </div>
 <div className="min-w-0">
 <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 leading-none mb-1.5">{label}</p>
 <p className="text-[11px] font-bold text-slate-800 truncate uppercase">{value}</p>
 </div>
 </div>
 );
}

function StatCard({ icon: Icon, label, value, helper, color }: { icon: any, label: string, value: string, helper: string, color: 'orange' | 'emerald' | 'blue' | 'amber' }) {
 const colors = {
 orange: "text-orange-500 bg-orange-50 border-orange-100/50",
 emerald: "text-emerald-500 bg-emerald-50 border-emerald-100/50",
 blue: "text-blue-500 bg-blue-50 border-blue-100/50",
 amber: "text-amber-500 bg-amber-50 border-amber-100/50"
 };

 return (
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all group">
 <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border", colors[color])}>
 <Icon size={18} className="transition-transform group-hover:scale-110" />
 </div>
 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
 <div className="flex items-baseline gap-2">
 <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase ">{value}</span>
 </div>
 <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-tight">{helper}</p>
 </div>
 );
}
