"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/navbar";
import { Footerdemo as Footer } from "@/components/ui/footer-section";
import { motion } from "framer-motion";
import { User as UserIcon, Calendar, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function CommunityProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/community/profile/${id}`);
      if (res.ok) {
        setProfile(await res.json());
      } else {
        toast.error("Profile not found");
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-600 animate-spin flex-shrink-0"></div>
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
       <div className="min-h-screen flex flex-col pt-24 bg-slate-50 items-center">
          <a href="/community" className="mb-4 text-orange-600 flex items-center font-bold text-sm">
             <ArrowLeft className="mr-2" size={16} /> Back to Hive
          </a>
          <h1 className="text-2xl font-black text-slate-900">User Not Found</h1>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pt-24 pb-20">
      <nav className="fixed left-0 w-full z-[60] px-4 top-4 pointer-events-none">
         <div className="mx-auto max-w-2xl flex items-center pointer-events-auto">
            <a href="/community" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors">
               <ArrowLeft size={16} className="text-slate-600" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-900">Back</span>
            </a>
         </div>
      </nav>

      <main className="flex-1 max-w-2xl px-4 mx-auto w-full mt-4">
         {/* Profile Header */}
         <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shrink-0 relative">
               {profile.imageUrl ? (
                  <Image src={profile.imageUrl} alt={profile.name} fill className="object-cover" />
               ) : (
                  <UserIcon size={40} className="text-orange-500" />
               )}
            </div>
            
            <div className="flex-1">
               <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
               <p className="text-xs sm:text-sm font-bold text-orange-600 uppercase tracking-widest mt-1">
                  {profile.role === "ADMIN" ? "HIVE MODERATOR" : "HIVE CONTRIBUTOR"}
               </p>
               
               <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 text-slate-400 text-xs font-medium">
                  <Calendar size={14} />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}</span>
               </div>
               
               <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                     <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Posts</p>
                     <p className="text-lg font-black text-slate-900">{profile.communityPosts.length}</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Posts */}
         <h2 className="text-lg font-black tracking-tighter text-slate-900 mb-6">Moments ({profile.communityPosts.length})</h2>
         
         <div className="grid grid-cols-1 gap-6">
            {profile.communityPosts.length > 0 ? (
               profile.communityPosts.map((post: any) => (
                  <a key={post.id} href={`/community?post=${post.id}`} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group block">
                     <div className="aspect-video w-full bg-slate-50 relative overflow-hidden">
                        <Image src={post.imageUrl} alt={post.caption} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 800px" />
                     </div>
                     <div className="p-4 sm:p-6">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed">{post.caption}</p>
                        <p className="text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                     </div>
                  </a>
               ))
            ) : (
               <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No moments shared yet.</p>
               </div>
            )}
         </div>
      </main>
      <Footer />
    </div>
  );
}
