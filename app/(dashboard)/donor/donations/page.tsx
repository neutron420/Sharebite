"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  History, 
  LayoutDashboard,
  LogOut,
  Loader2,
  Package,
  Calendar,
  MapPin,
  Clock,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import DonationList from "@/components/ui/donation-list";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function DonorHistory() {
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function fetchDonations() {
      try {
        setLoading(true);
        // Assuming /api/donations returns all donations for the logged-in user if called appropriately
        const res = await fetch("/api/donations");
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setDonations(data);
      } catch (error) {
        console.error("History load error:", error);
        toast.error("Could not load your history.");
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      toast.success("Signed out successfully");
    } catch (e) {
      router.push("/login");
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading Logs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic underline decoration-orange-600/10 underline-offset-8 transition-all hover:decoration-orange-500/20 cursor-default">
                 Donation History
              </h1>
              <p className="text-slate-400 font-bold">Track your past and current active shares.</p>
            </motion.div>
            <Link href="/donor/donate" className="group px-8 py-4 bg-slate-950 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95">
              Post New <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </Link>
          </header>

          <div className="space-y-8">
             <div className="h-auto">
                <DonationList donations={donations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)} />
             </div>

             {donations.length > itemsPerPage && (
               <Pagination className="mt-8">
                 <PaginationContent>
                   <PaginationItem>
                     <PaginationPrevious 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }} 
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                     />
                   </PaginationItem>
                   
                   {Array.from({ length: Math.ceil(donations.length / itemsPerPage) }).map((_, i) => (
                     <PaginationItem key={i}>
                       <PaginationLink 
                         href="#" 
                         onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                         isActive={currentPage === i + 1}
                         className="cursor-pointer"
                       >
                         {i + 1}
                       </PaginationLink>
                     </PaginationItem>
                   ))}

                   <PaginationItem>
                     <PaginationNext 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(donations.length / itemsPerPage)) setCurrentPage(currentPage + 1); }}
                        className={currentPage === Math.ceil(donations.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                     />
                   </PaginationItem>
                 </PaginationContent>
               </Pagination>
             )}
          </div>
    </div>
  );
}


