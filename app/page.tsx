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
import { MobileAppShowcase } from "@/components/ui/mobile-app-showcase";

/**
 * ShareBite - The Luxury Edition
 * Balanced Typography & Expanded Header
 */
export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/community/posts?sort=newest").then(res => res.json()).then(data => setPosts(data.slice(0, 10))).catch(() => {});
  }, []);

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

      <main className="relative z-10 w-full pt-32 md:pt-56">
        {/* Refined Hero Section */}
        <section className="px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div
            className="px-5 py-2 rounded-full border border-orange-100 bg-orange-50 text-[11px] font-medium uppercase tracking-[0.25em] text-orange-600 mb-10 inline-flex items-center gap-3 animate-float"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
            </span>
            <Translate>Active Logistics in</Translate> <Counter value={12} /> <Translate>Major Cities</Translate>
          </div>

          <h1 
            className="text-4xl xs:text-5xl sm:text-7xl md:text-[80px] font-medium tracking-tight leading-[1.1] md:leading-[0.95] mb-8 sm:mb-10 text-slate-950"
          >
            <Translate>Zero Waste.</Translate> <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 ">
               <Translate>Unlimited Hope.</Translate>
            </span>
          </h1>

          <p
            className="text-base sm:text-lg text-slate-500 max-w-2xl mb-10 sm:mb-14 font-medium leading-relaxed px-4 sm:px-0"
          >
            <Translate>The world's most sophisticated food-sharing engine. We connect high-volume donors with NGOs and professional riders to eliminate hunger with sub-second precision.</Translate>
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto px-6 sm:px-0"
          >
            <Link href="/register" className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-orange-600 text-white font-medium text-base sm:text-lg rounded-[1.2rem] sm:rounded-[1.5rem] hover:bg-orange-700 hover:shadow-2xl hover:shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-orange-100">
              <Translate>Start Donating</Translate> <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white border border-slate-200 text-slate-950 font-medium text-base sm:text-lg rounded-[1.2rem] sm:rounded-[1.5rem] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm">
              <Translate>Watch Impact</Translate> <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" /></div>
            </Link>
          </div>

          {/* Luxury Marquee */}
          <div className="mt-20 sm:mt-32 w-full max-w-6xl">
            <p className="text-[9px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.5em] text-slate-300 mb-6 sm:mb-12"><Translate>Trusted Power Partners</Translate></p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-16 sm:w-40 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-16 sm:w-40 bg-gradient-to-l from-white to-transparent z-10" />
              <Marquee pauseOnHover className="[--duration:25s] py-6 sm:py-12">
                {partners.map((p, i) => (
                  <div key={i} className="flex flex-col items-center justify-center gap-3 sm:gap-5 mx-6 sm:mx-12 transition-all duration-300 cursor-default group hover:-translate-y-2">
                     <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-32 sm:h-32 flex items-center justify-center mix-blend-multiply opacity-60 group-hover:opacity-100 transition-opacity">
                        <Image 
                          src={p.img} 
                          alt={p.name} 
                          width={140}
                          height={140}
                          className="object-contain w-full h-full" 
                          priority={i < 3}
                        />
                     </div>
                     <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">{p.name}</span>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </section>

        <div className="w-full">
          <ImpactGallery />
        </div>

        {/* Live Community Highlights Section */}
        {posts.length > 0 && (
          <section className="py-24 sm:py-32 overflow-hidden border-y border-slate-100 bg-white relative">
             <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-xl">
                   <p className="text-orange-600 text-[11px] font-black uppercase tracking-[0.5em] mb-4 animate-pulse"><Translate>Live From the Hive</Translate></p>
                   <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-slate-950 mb-4"><Translate>Community</Translate> <span className="italic underline decoration-orange-600/20"><Translate>Highlights</Translate></span></h2>
                   <p className="text-slate-500 font-medium text-lg leading-relaxed"><Translate>Real people, real impact. Experience the latest moments shared by our global community.</Translate></p>
                </div>
                <Link href="/community" className="px-8 py-4 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-orange-100 transition-all active:scale-95 flex items-center gap-3 self-start md:self-auto">
                   <Translate>Explore all Moments</Translate> <ArrowRight size={16} />
                </Link>
             </div>

             <Marquee pauseOnHover className="[--duration:60s] [--gap:2rem] py-4">
                {posts.map((post) => (
                   <div key={post.id} className="w-[320px] xs:w-[380px] aspect-[10/12] relative rounded-[2.5rem] overflow-hidden group border border-slate-100 bg-white shadow-sm flex-shrink-0">
                      <Image 
                        src={post.imageUrl} 
                        alt="Highlight" 
                        fill 
                        sizes="380px"
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                      
                      <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg overflow-hidden relative border border-white/40 bg-slate-800">
                            {post.author.imageUrl ? (
                              <Image src={post.author.imageUrl} fill sizes="24px" alt="A" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-black">{post.author.name.charAt(0)}</div>
                            )}
                         </div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">{post.author.name}</span>
                      </div>

                      <div className="absolute bottom-8 left-8 right-8">
                         <p className="text-white text-base font-medium leading-relaxed drop-shadow-md">
                           &ldquo;{post.caption}&rdquo;
                         </p>
                      </div>
                   </div>
                ))}
             </Marquee>
          </section>
        )}

        {/* Polished Bento Grid */}
        <section id="features" className="px-6 py-24 sm:py-40 max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-28 px-4">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-medium tracking-tight mb-6 sm:mb-8"><Translate>Platform of</Translate> <span className="text-orange-600 "><Translate>Prestige.</Translate></span></h2>
            <p className="text-slate-500 font-medium text-base sm:text-lg max-w-xl mx-auto"><Translate>Engineered for absolute reliability, transparency, and global scale.</Translate></p>
          </div>
          
          <BentoGrid items={features} />
        </section>

        {/* Roles Section - Premium Orange Gradient */}
        <section id="roles" className="px-6 sm:px-10 py-16 sm:py-24 md:py-32 bg-gradient-to-br from-orange-400 via-[#F89880] to-orange-600 text-white rounded-[2rem] md:rounded-[4rem] mx-4 md:mx-12 overflow-hidden relative group shadow-inner border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 blur-[80px] sm:blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-16 lg:gap-20 relative z-10">
            <RoleItem luxury title={<Translate>The Giver</Translate>} desc={<Translate>Transform surplus into status. Posting handles everything from logistics to detailed impact reports.</Translate>} />
            <RoleItem luxury title={<Translate>The Anchor</Translate>} desc={<Translate>Empower your NGO with a high-fidelity dashboard to manage cities of surplus food.</Translate>} />
            <RoleItem luxury title={<Translate>The Fleet</Translate>} desc={<Translate>Step into the driver's seat of change. Deliver smiles and earn elite Karma rewards.</Translate>} />
          </div>
        </section>

        {/* Minimalist CTA */}
        <section className="px-6 py-24 sm:py-48 text-center max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-6xl md:text-[100px] font-medium tracking-tighter mb-8 sm:mb-14 text-slate-950 leading-tight"><Translate>Ready to Lead?</Translate></h2>
          <p className="text-base sm:text-lg text-slate-400 mb-10 sm:mb-16 max-w-lg mx-auto font-medium px-4"><Translate>Join 12,000+ pioneers redefining food security. Experience the future of sharing.</Translate></p>
          <Link href="/register" className="inline-flex w-full sm:w-auto px-10 sm:px-20 py-5 sm:py-8 bg-slate-950 text-white font-medium text-lg sm:text-2xl rounded-[1.5rem] sm:rounded-[2rem] hover:bg-orange-600 hover:-translate-y-2 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 group items-center justify-center">
             <Translate>Initialize Profile</Translate> <ArrowRight className="inline ml-3 group-hover:translate-x-3 transition-transform w-5 h-5 sm:w-8 sm:h-8" />
          </Link>
        </section>

        {/* Testimonials */}
        <TestimonialsSectionDemo />

        {/* FAQs */}
        <FaqsSection />
      </main>

      {/* Mobile App Showcase - Above Footer */}
      <MobileAppShowcase />

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
