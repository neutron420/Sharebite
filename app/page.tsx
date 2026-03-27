"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Truck, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe2,
  Users,
  ChevronRight,
  Star,
  MapPin,
  Utensils,
  Play,
  Menu,
  X
} from "lucide-react";
import { useInView, useSpring, useTransform } from "framer-motion";

function Counter({ value, direction = "up" }: { value: number, direction?: "up" | "down" }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [mounted, setMounted] = useState(false);

  const spring = useSpring(0, {
    mass: 1,
    stiffness: 100,
    damping: 30,
  });

  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    setMounted(true);
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  useEffect(() => {
    return display.on("change", (v) => setDisplayValue(v));
  }, [display]);

  return <motion.span ref={ref} suppressHydrationWarning>{mounted ? displayValue : "0"}</motion.span>;
}

import Marquee from "@/components/magicui/marquee";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { Footerdemo as Footer } from "@/components/ui/footer-section";
import { cn } from "@/lib/utils";
import { TestimonialsSectionDemo } from "@/components/blocks/demo";
import { FaqsSection } from "@/components/ui/faqs-1";

import { ImpactGallery } from "@/components/ui/impact-gallery";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Translate } from "@/components/ui/translate";
import { Header } from "@/components/navbar";

/**
 * ShareBite - The Luxury Edition
 * Balanced Typography & Expanded Header
 */
export default function Home() {
  const partners = [
    { name: "UNICEF", img: "/unicef.png" },
    { name: "RED CROSS", img: "/redcross.png" },
    { name: "WWF", img: "/wwf.png" },
    { name: "SANGHA", img: "/sangha.png" },
    { name: "ARTI FOUNDATION", img: "/artifoundation.png" },
  ];

  const features: BentoItem[] = [
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: <Translate>Military Grade Security</Translate>,
      description: <Translate>Secure 4-digit PIN verification ensures food reaches the right hands every single time.</Translate>,
      meta: "Encrypted",
      status: "Verified",
      tags: ["Security", "Pin"],
      colSpan: 1,
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: <Translate>Real-Time Fleet Dispatch</Translate>,
      description: <Translate>Track your rescue hero in real-time across the city with zero-latency GPS updates.</Translate>,
      meta: "Live GPS",
      status: "Active",
      tags: ["Logistics", "Fleet"],
      colSpan: 2,
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: <Translate>Sub-Second Matching</Translate>,
      description: <Translate>Our high-speed matching engine connects donors to the nearest NGOs in milliseconds.</Translate>,
      meta: "0.2ms Latency",
      status: "Ultra Fast",
      tags: ["Matchmaking", "Speed"],
      colSpan: 2,
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: <Translate>Community Legacy</Translate>,
      description: <Translate>Earn Karma points and build your community legacy. Transform waste into hope.</Translate>,
      meta: "Karma Protocol",
      status: "Social",
      tags: ["Community", "Impact"],
      colSpan: 1,
    },
  ];

  return (
    <div className="relative min-h-screen bg-white text-slate-950 flex flex-col items-center selection:bg-orange-100 overflow-hidden">
      
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.08),transparent_70%)] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <Header />

      <main className="relative z-10 w-full pt-56">
        {/* Refined Hero Section */}
        <section className="px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 py-2 rounded-full border border-orange-100 bg-orange-50 text-[11px] font-medium uppercase tracking-[0.25em] text-orange-600 mb-10 inline-flex items-center gap-3"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
            </span>
            <Translate>Active Logistics in</Translate> <Counter value={12} /> <Translate>Major Cities</Translate>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-[80px] font-medium tracking-tight leading-[0.95] mb-10 text-slate-950"
          >
            <Translate>Zero Waste.</Translate> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 ">
               <Translate>Unlimited Hope.</Translate>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg text-slate-500 max-w-2xl mb-14 font-medium leading-relaxed"
          >
            <Translate>The world's most sophisticated food-sharing engine. We connect high-volume donors with NGOs and professional riders to eliminate hunger with sub-second precision.</Translate>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <Link href="/register" className="px-12 py-5 bg-orange-600 text-white font-medium text-lg rounded-[1.5rem] hover:bg-orange-700 hover:shadow-2xl hover:shadow-orange-100 transition-all active:scale-95 flex items-center gap-3">
              <Translate>Start Donating</Translate> <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-12 py-5 bg-white border border-slate-200 text-slate-950 font-medium text-lg rounded-[1.5rem] hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3">
              <Translate>Watch Impact</Translate> <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Play className="w-3 h-3 fill-current" /></div>
            </Link>
          </motion.div>

          {/* Luxury Marquee */}
          <div className="mt-32 w-full max-w-6xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.5em] text-slate-300 mb-12"><Translate>Trusted Power Partners</Translate></p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent z-10" />
              <Marquee pauseOnHover className="[--duration:25s] py-12">
                {partners.map((p, i) => (
                  <div key={i} className="flex flex-col items-center justify-center gap-5 mx-12 transition-all duration-300 cursor-default group hover:-translate-y-2">
                     <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center mix-blend-multiply">
                       <Image 
                         src={p.img} 
                         alt={p.name} 
                         width={180}
                         height={180}
                         className="object-contain w-full h-full" 
                         priority={i < 3}
                       />
                     </div>
                     <span className="text-sm sm:text-lg font-medium uppercase tracking-[0.2em] text-slate-800">{p.name}</span>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </section>

        {/* Epic Impact Gallery - Now natively full width outside the padded hero container */}
        <div className="w-full">
          <ImpactGallery />
        </div>

        {/* Polished Bento Grid */}
        <section id="features" className="px-6 py-40 max-w-7xl mx-auto">
          <div className="text-center mb-28">
            <h2 className="text-4xl md:text-7xl font-medium tracking-tight mb-8"><Translate>Platform of</Translate> <span className="text-orange-600 "><Translate>Prestige.</Translate></span></h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto"><Translate>Engineered for absolute reliability, transparency, and global scale.</Translate></p>
          </div>
          
          <BentoGrid items={features} />
        </section>

        {/* Roles Section - Premium Orange Gradient */}
        <section id="roles" className="px-10 py-32 bg-gradient-to-br from-orange-400 via-[#F89880] to-orange-600 text-white rounded-[4rem] mx-4 md:mx-12 overflow-hidden relative group shadow-inner border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-20 relative z-10">
            <RoleItem luxury title={<Translate>The Giver</Translate>} desc={<Translate>Transform surplus into status. Posting handles everything from logistics to detailed impact reports.</Translate>} />
            <RoleItem luxury title={<Translate>The Anchor</Translate>} desc={<Translate>Empower your NGO with a high-fidelity dashboard to manage cities of surplus food.</Translate>} />
            <RoleItem luxury title={<Translate>The Fleet</Translate>} desc={<Translate>Step into the driver's seat of change. Deliver smiles and earn elite Karma rewards.</Translate>} />
          </div>
        </section>

        {/* Minimalist CTA */}
        <section className="px-6 py-48 text-center">
          <h2 className="text-5xl md:text-[100px] font-medium tracking-tighter mb-14 text-slate-950 "><Translate>Ready to Lead?</Translate></h2>
          <p className="text-lg text-slate-400 mb-16 max-w-lg mx-auto font-medium"><Translate>Join 12,000+ pioneers redefining food security. Experience the future of sharing.</Translate></p>
          <Link href="/register" className="px-20 py-8 bg-slate-950 text-white font-medium text-2xl rounded-[2rem] hover:bg-orange-600 hover:-translate-y-2 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 group">
             <Translate>Initialize Profile</Translate> <ArrowRight className="inline ml-2 group-hover:translate-x-3 transition-transform" />
          </Link>
        </section>

        {/* Testimonials */}
        <TestimonialsSectionDemo />

        {/* FAQs */}
        <FaqsSection />
      </main>

      <Footer />
    </div>
  );
}

function RoleItem({ title, desc, luxury = false }: { title: any, desc: any, luxury?: boolean }) {
  return (
    <div className="space-y-6 group cursor-default">
       <div className="h-0.5 w-12 bg-white group-hover:w-full transition-all duration-700" />
       <h3 className="text-4xl font-medium tracking-tight text-white">{title}</h3>
       <p className="text-white/80 font-medium leading-relaxed">{desc}</p>
       <button className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-white/90 hover:text-white transition-colors">
         <Translate>Explore Role</Translate> <ChevronRight className="w-4 h-4" />
       </button>
    </div>
  );
}
