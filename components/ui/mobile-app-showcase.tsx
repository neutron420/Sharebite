"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Truck,
  Search,
  Bell,
  MapPin,
  Star,
  Users,
  ChevronRight,
  Download,
  Phone,
  LayoutDashboard,
  Plus,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { BsApple, BsGooglePlay } from "react-icons/bs";

function DynamicIsland() {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[85px] h-[24px] bg-black rounded-[20px] z-50 flex items-center justify-between px-2">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
      <div className="w-1.5 h-1.5 rounded-full bg-green-500/20 relative">
        <div className="absolute inset-[1px] rounded-full bg-green-500" />
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative w-[300px] h-[610px] md:w-[320px] md:h-[650px] shrink-0">
      {/* Phone Case/Frame */}
      <div className="absolute inset-0 bg-[#3a3b3c] rounded-[3rem] p-[8px] shadow-2xl shadow-slate-900/50">
        {/* Inner bezel */}
        <div className="absolute inset-[8px] bg-black rounded-[2.5rem] p-[3px]">
          {/* Screen */}
          <div className="relative w-full h-full bg-[#F4F7F6] rounded-[2.3rem] overflow-hidden">
            {/* Dynamic Island */}
            <DynamicIsland />

            {/* Status bar */}
            <div className="bg-transparent px-6 pt-3 pb-2 flex items-center justify-between z-40 relative">
              <span className="text-[12px] font-medium text-slate-800">9:41</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21L15.6 16.2C14.6 15.4 13.3 15 12 15C10.7 15 9.4 15.4 8.4 16.2L12 21ZM12 3C7.95 3 4.21 4.5 1.2 7.05L12 21.5L22.8 7.05C19.79 4.5 16.05 3 12 3Z" />
                </svg>
                <div className="w-5 h-2.5 border-[1.5px] border-slate-800 rounded-sm relative p-[1px]">
                  <div className="w-full h-full bg-slate-800" />
                </div>
              </div>
            </div>

            {/* App Content */}
            <div className="flex flex-col h-full bg-white relative">
              
              {/* Header */}
              <div className="px-5 pt-4 pb-2 bg-[#e6f4f1]">
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">ShareBite</h3>
                <div className="flex items-center gap-4 mt-4 border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider relative after:content-[''] after:absolute after:-bottom-[9px] after:left-0 after:w-full after:h-[2px] after:bg-slate-900">ACTIVITY</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DONATE</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WALLET</span>
                </div>
              </div>

              {/* Tips Banner */}
              <div className="p-5">
                <p className="text-[10px] text-slate-400 font-medium mb-1">Tips for your impact</p>
                <h4 className="text-sm font-semibold text-slate-900 leading-tight mb-2">Always verify the NGO</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Make sure to check the NGO's verification badge before donating large quantities. You can track all pickups in real-time.
                </p>
                <div className="flex gap-1 mt-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              </div>

              {/* Action Card */}
              <div className="px-4 pb-4">
                <div className="bg-[#EAECE4] rounded-[1.5rem] p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-900">City Hope Center</h4>
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                         <div key={i} className={`w-6 h-6 rounded-full border-2 border-[#EAECE4] ${['bg-orange-200','bg-blue-200','bg-green-200'][i-1]}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">12 Donors helped here</span>
                  </div>

                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-medium text-slate-800 leading-tight">Downtown Community Shelter & Kitchen</span>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[11px] font-medium text-slate-800">Needs: Rice, Lentils</span>
                    <button className="bg-white rounded-full px-4 py-1.5 text-[10px] font-semibold text-slate-900 shadow-sm border border-slate-100">
                      Donate
                    </button>
                  </div>
                </div>
              </div>

               {/* Bottom Nav */}
              <div className="absolute bottom-[20px] left-0 right-0 px-6">
                <div className="bg-white rounded-2xl flex items-center justify-between px-6 py-4 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] border border-slate-100">
                  <span className="text-[9px] font-semibold text-slate-900 relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-slate-900 after:rounded-full">Home</span>
                  <span className="text-[9px] font-semibold text-slate-400">Share</span>
                  <span className="text-[9px] font-semibold text-slate-400">Hub</span>
                  <span className="text-[9px] font-semibold text-slate-400">Profile</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileAppShowcase() {
  return (
    <section className="bg-[#F6F7F9] py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Inner Container simulating a rounded card */}
      <div className="max-w-[1200px] mx-auto bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-sm border border-slate-100">
        
        {/* Soft Purple background blob */}
        <div className="absolute top-[35%] left-0 right-0 h-[400px] bg-[#E8EAEF] rounded-[100px] transform -rotate-3 overflow-hidden">
           {/* Decorative squiggly line */}
           <svg className="absolute w-full h-full opacity-40 mix-blend-multiply pointer-events-none" viewBox="0 0 1000 300" preserveAspectRatio="none">
             <path d="M0,150 Q150,300 300,150 T600,150 T1000,150" fill="none" stroke="#B4BBC9" strokeWidth="8" strokeOpacity="0.5" />
             <path d="M0,200 Q200,50 400,200 T800,200 T1200,150" fill="none" stroke="#B4BBC9" strokeWidth="6" strokeOpacity="0.3" />
           </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center">
          
          {/* Left Content */}
          <div className="w-full lg:w-[50%] pt-4 lg:pt-12 pb-12 lg:pb-0 z-20">
            <h2 className="text-5xl sm:text-6xl md:text-[85px] font-medium text-[#1C1A17] tracking-tight leading-[1] mb-6">
              SHARE YOUR
              <br />
              <span className="italic font-light">SURPLUS.</span>
            </h2>

            <p className="text-[#5B5D60] text-base md:text-lg mb-8 max-w-md leading-relaxed pr-4">
              We have the largest network of verified NGOs ready to rescue your surplus. Try our quick sharing flow for any donation. Real-time fleet routing ensures zero waste.
            </p>

            <div className="flex items-center gap-4 mt-auto">
              <span className="text-[#5B5D60] text-sm font-medium w-24 leading-snug">The mobile app<br/>is available now</span>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full border border-[#D5D8DF] bg-white/50 flex items-center justify-center hover:bg-white transition-colors">
                  <BsApple className="w-4 h-4 text-[#1C1A17]" />
                </button>
                <button className="w-10 h-10 rounded-full border border-[#D5D8DF] bg-white/50 flex items-center justify-center hover:bg-white transition-colors">
                  <BsGooglePlay className="w-4 h-4 text-[#1C1A17]" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="w-full lg:w-[45%] flex justify-center lg:justify-end relative z-20 mt-12 lg:mt-0">
             <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, ease: "easeOut" }}
             >
                <PhoneMockup />
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
