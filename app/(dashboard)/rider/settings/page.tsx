"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Bell, 
  Lock, 
  ChevronRight,
  Camera,
  LogOut,
  Save,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface RiderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  vehicleType?: string;
  licenseNumber?: string;
}

export default function RiderSettingsPage() {
  const [user, setUser] = useState<RiderUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success("Settings saved successfully.");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-gray-500 text-sm">Loading configurations...</span>
    </div>
  );

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 text-gray-900">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-none">
          Settings
        </h1>
        <p className="text-gray-500 text-sm">Manage your profile, vehicle details, and account security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <SettingsNavButton icon={User} label="Profile" active />
          <SettingsNavButton icon={Truck} label="Vehicle Details" />
          <SettingsNavButton icon={ShieldCheck} label="Verification" />
          <SettingsNavButton icon={Bell} label="Notifications" />
          <SettingsNavButton icon={Lock} label="Security" />
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-10">
          
          {/* Profile Card */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="h-24 w-24 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-600 text-3xl font-bold border-2 border-white shadow-lg">
                  {user.name.charAt(0)}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-gray-900 text-white rounded-xl shadow-xl hover:bg-orange-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-sm font-medium text-gray-500">{user.email}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">Verified Rider</Badge>
                  <Badge variant="outline" className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Active</Badge>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      defaultValue={user.name} 
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      defaultValue={user.email} 
                      readOnly
                      className="w-full pl-11 pr-4 py-4 bg-gray-100 border border-gray-100 rounded-2xl text-sm font-medium text-gray-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Operating Region</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. South Delhi, India"
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl shadow-gray-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Profile Changes
              </button>
            </form>
          </section>

          {/* Vehicle Info */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">Vehicle Information</h3>
              </div>
              <Badge className="bg-orange-50 text-orange-600 border-none font-bold">In Use</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 rounded-2xl border border-gray-50 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Type</p>
                  <p className="text-sm font-bold text-gray-900">Electric Two-Wheeler</p>
               </div>
               <div className="p-5 rounded-2xl border border-gray-50 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Plate Number</p>
                  <p className="text-sm font-bold text-gray-900">DL 3S AU 4201</p>
               </div>
            </div>

            <button className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              Update vehicle documents <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </section>

          {/* Danger Zone */}
          <section className="p-8 rounded-[2rem] border border-rose-100 bg-rose-50/20 flex items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-rose-900">Sign Out</h4>
              <p className="text-xs text-rose-600 font-medium">Temporarily disconnect your session from this device.</p>
            </div>
            <button className="px-6 py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl shadow-sm hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsNavButton({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-white border border-gray-100 shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-orange-500 text-white' : 'bg-transparent text-gray-300'}`}>
        <Icon className="w-4 h-4" />
      </div>
      {label}
    </button>
  );
}
