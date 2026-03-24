"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
  Play
} from "lucide-react";
import { useInView, useSpring, useTransform } from "framer-motion";

function Counter({ value, direction = "up" }: { value: number, direction?: "up" | "down" }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(0, {
    mass: 1,
    stiffness: 100,
    damping: 30,
  });

  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

import Marquee from "@/components/magicui/marquee";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Footerdemo as Footer } from "@/components/ui/footer-section";
import { cn } from "@/lib/utils";
import { TestimonialsSectionDemo } from "@/components/blocks/demo";
import { FaqsSection } from "@/components/ui/faqs-1";
import { ImpactGallery } from "@/components/ui/impact-gallery";

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

  const features = [
    {
      Icon: ShieldCheck,
      name: "Military Grade Security",
      description: "Secure 4-digit PIN verification ensures food reaches the right hands every single time.",
      href: "#",
      cta: "Verify security",
      className: "col-span-3 lg:col-span-1",
      background: <div className="absolute inset-0 bg-orange-50/50" />,
    },
    {
      Icon: Truck,
      name: "Real-Time Fleet Dispatch",
      description: "Track your rescue hero in real-time across the city with zero-latency GPS updates.",
      href: "#",
      cta: "Live tracking",
      className: "col-span-3 lg:col-span-2",
      background: <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-amber-100/20" />,
    },
    {
      Icon: Zap,
      name: "Sub-Second Matching",
      description: "Our high-speed matching engine connects donors to the nearest NGOs in milliseconds.",
      href: "#",
      cta: "Explore tech",
      className: "col-span-3 lg:col-span-2",
      background: <div className="absolute inset-0 bg-orange-50/30" />,
    },
    {
      Icon: Users,
      name: "Community Legacy",
      description: "Earn Karma points and build your community legacy. Transform waste into hope.",
      href: "#",
      cta: "Join leaderboard",
      className: "col-span-3 lg:col-span-1",
      background: <div className="absolute inset-0 bg-amber-50/50" />,
    },
  ];

  return (
    <div className="relative min-h-screen bg-white text-slate-950 flex flex-col items-center selection:bg-orange-100 overflow-hidden">
      
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.08),transparent_70%)] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Broad & Premium Navbar */}
      <nav className="fixed top-8 z-50 w-[95%] max-w-7xl">
        <div className="mx-auto rounded-[2rem] border border-orange-100 bg-white/60 backdrop-blur-2xl px-8 py-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl shadow-[0_8px_20px_rgba(234,88,12,0.2)] flex items-center justify-center group-hover:rotate-6 transition-all">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-medium tracking-tighter text-slate-900">ShareBite</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-12 text-[12px] font-medium uppercase tracking-[0.2em] text-slate-400">
            <a href="#features" className="hover:text-orange-600 transition-colors">Tech Stack</a>
            <a href="#impact" className="hover:text-orange-600 transition-colors">Impact Log</a>
            <a href="#roles" className="hover:text-orange-600 transition-colors">Coalition</a>
            <Link href="/login" className="hover:text-orange-600 transition-colors">Portal</Link>
          </div>

          <Link href="/register" className="px-8 py-3 bg-slate-950 text-white text-[12px] font-medium rounded-2xl hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-100 transition-all active:scale-95 flex items-center gap-2">
            JOIN MOVEMENT <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

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
            Active Logistics in <Counter value={12} /> Major Cities
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-[80px] font-medium tracking-tight leading-[0.95] mb-10 text-slate-950"
          >
            Zero Waste. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 ">
               Unlimited Hope.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg text-slate-500 max-w-2xl mb-14 font-medium leading-relaxed"
          >
            The world&apos;s most sophisticated food-sharing engine. We connect high-volume donors with NGOs and professional riders to eliminate hunger with sub-second precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <Link href="/register" className="px-12 py-5 bg-orange-600 text-white font-medium text-lg rounded-[1.5rem] hover:bg-orange-700 hover:shadow-2xl hover:shadow-orange-100 transition-all active:scale-95 flex items-center gap-3">
              Start Donating <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-12 py-5 bg-white border border-slate-200 text-slate-950 font-medium text-lg rounded-[1.5rem] hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3">
              Watch Impact <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Play className="w-3 h-3 fill-current" /></div>
            </Link>
          </motion.div>

          {/* Luxury Marquee */}
          <div className="mt-32 w-full max-w-6xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.5em] text-slate-300 mb-12">Trusted Power Partners</p>
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
            <h2 className="text-4xl md:text-7xl font-medium tracking-tight mb-8">Platform of <span className="text-orange-600 ">Prestige.</span></h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">Engineered for absolute reliability, transparency, and global scale.</p>
          </div>
          
          <BentoGrid className="auto-rows-[25rem]">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </section>

        {/* Roles Section - Premium Orange Gradient */}
        <section id="roles" className="px-10 py-32 bg-gradient-to-br from-orange-400 via-[#F89880] to-orange-600 text-white rounded-[4rem] mx-4 md:mx-12 overflow-hidden relative group shadow-inner border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-20 relative z-10">
            <RoleItem luxury title="The Giver" desc="Transform surplus into status. Posting handles everything from logistics to detailed impact reports." />
            <RoleItem luxury title="The Anchor" desc="Empower your NGO with a high-fidelity dashboard to manage cities of surplus food." />
            <RoleItem luxury title="The Fleet" desc="Step into the driver's seat of change. Deliver smiles and earn elite Karma rewards." />
          </div>
        </section>

        {/* Minimalist CTA */}
        <section className="px-6 py-48 text-center">
          <h2 className="text-5xl md:text-[100px] font-medium tracking-tighter mb-14 text-slate-950 ">Ready to Lead?</h2>
          <p className="text-lg text-slate-400 mb-16 max-w-lg mx-auto font-medium">Join <Counter value={12000} />+ pioneers redefining food security. Experience the future of sharing.</p>
          <Link href="/register" className="px-20 py-8 bg-slate-950 text-white font-medium text-2xl rounded-[2rem] hover:bg-orange-600 hover:-translate-y-2 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 group">
             Initialize Profile <ArrowRight className="inline ml-2 group-hover:translate-x-3 transition-transform" />
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

function RoleItem({ title, desc, luxury = false }: { title: string, desc: string, luxury?: boolean }) {
  return (
    <div className="space-y-6 group cursor-default">
       <div className="h-0.5 w-12 bg-white group-hover:w-full transition-all duration-700" />
       <h3 className="text-4xl font-medium tracking-tight text-white">{title}</h3>
       <p className="text-white/80 font-medium leading-relaxed">{desc}</p>
       <button className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-white/90 hover:text-white transition-colors">
         Explore Role <ChevronRight className="w-4 h-4" />
       </button>
    </div>
  );
}
