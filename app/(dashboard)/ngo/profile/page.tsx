"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  CalendarDays,
  UserRound,
  LayoutDashboard,
  FileText,
  History,
  Phone,
  Globe,
  Loader2,
  Camera
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

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
      <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Organization Profile...</p>
    </div>
  );

  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-width-auto mx-auto space-y-8 pb-12">
      {/* Cover/Header area */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 opacity-60" />
        
        <div className="px-8 pb-8 -mt-12 relative flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-3xl overflow-hidden">
              <AvatarImage src={profile.imageUrl || undefined} />
              <AvatarFallback className="bg-orange-500 text-white text-3xl font-black rounded-none">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100">
              <Camera size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-orange-50 text-orange-600 border-none font-black uppercase tracking-wider text-[10px] px-3 py-1">
                Verified NGO
              </Badge>
              {profile.isVerified && (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                  <ShieldCheck size={12} className="fill-emerald-600 text-white" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Trusted Organization</span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {profile.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-orange-500" /> 
                Joined {profile.createdAt && !isNaN(new Date(profile.createdAt).getTime()) 
                  ? format(new Date(profile.createdAt), "MMMM yyyy") 
                  : "Member"}
              </span>
              <span className="flex items-center gap-1.5"><Building2 size={14} className="text-orange-500" /> Reg ID: {profile.ngoDetails?.registrationNumber || "NOT_SET"}</span>
            </div>
          </div>

          <div className="hidden md:flex gap-2">
             <button className="bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">
                Edit Profile
             </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contact & Details */}
        <div className="space-y-6">
          <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <UserRound size={16} className="text-orange-500" /> About Organization
            </h3>
            
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {profile.ngoDetails?.description || "No description provided for this organization yet. Complete your profile to build trust in the community."}
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <DetailItem icon={Mail} label="Official Email" value={profile.email} />
              <DetailItem icon={Phone} label="Primary Contact" value={profile.phoneNumber || "Not provided"} />
              <DetailItem icon={Globe} label="Digital Presence" value={profile.ngoDetails?.website || "sharebite.com"} />
              <DetailItem icon={MapPin} label="Headquarters" value={`${profile.city || "Not set"}, ${profile.state || "Not set"}`} />
            </div>
          </section>

          <section className="bg-[linear-gradient(135deg,#1C1A17_0%,#333333_100%)] rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
             <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={20} className="text-orange-500" />
                <h4 className="font-black uppercase tracking-widest text-xs">Security Status</h4>
             </div>
             <p className="text-white/60 text-xs leading-relaxed font-medium mb-6">
                Your organization is fully verified. You have access to all high-priority surplus rescues and donor network events.
             </p>
             <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest">Two-Factor Auth</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">ENABLED</span>
             </div>
          </section>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <StatCard 
               icon={LayoutDashboard} 
               label="Total Rescues" 
               value="124" 
               helper="Successful handovers"
               color="orange"
             />
             <StatCard 
               icon={FileText} 
               label="Requests Filled" 
               value="89%" 
               helper="Platform efficiency"
               color="emerald"
             />
             <StatCard 
               icon={History} 
               label="Rescue Hours" 
               value="412" 
               helper="Time spent on field"
               color="blue"
             />
             <StatCard 
               icon={ShieldCheck} 
               label="Audit Score" 
               value="4.9" 
               helper="Community trust rating"
               color="amber"
             />
          </div>

          <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Organization Timeline</h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:underline">View History</button>
             </div>
             
             <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 relative last_after:hidden after:content-[''] after:absolute after:left-[11px] after:top-[28px] after:h-[calc(100%-8px)] after:w-[1px] after:bg-slate-100">
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Updated Location Details</p>
                      <p className="text-xs text-slate-400 font-medium mt-1.5">2 hours ago • System Update</p>
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
      <div className="p-2 rounded-xl bg-slate-50 text-slate-400 shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none mb-1.5">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, helper, color }: { icon: any, label: string, value: string, helper: string, color: 'orange' | 'emerald' | 'blue' | 'amber' }) {
  const colors = {
    orange: "text-orange-500 bg-orange-50",
    emerald: "text-emerald-500 bg-emerald-50",
    blue: "text-blue-500 bg-blue-50",
    amber: "text-amber-500 bg-amber-50"
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${colors[color]} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 mt-2">{helper}</p>
    </div>
  );
}
