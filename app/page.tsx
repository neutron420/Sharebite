"use client";

import React from "react";
import Link from "next/link";
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

import Marquee from "@/components/magicui/marquee";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Footer } from "@/components/ui/large-name-footer";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { TestimonialsSectionDemo } from "@/components/blocks/demo";
import { FaqsSection } from "@/components/ui/faqs-1";
import { ImpactGallery } from "@/components/ui/impact-gallery";

/**
 * ShareBite - The Luxury Edition
 * Balanced Typography & Expanded Header
 */
export default function Home() {
  const partners = [
    { name: "UNICEF", icon: <Globe2 className="w-5 h-5" /> },
    { name: "RED CROSS", icon: <Heart className="w-5 h-5" /> },
    { name: "FEED INDIA", icon: <Utensils className="w-5 h-5" /> },
    { name: "GOOD WAVE", icon: <Star className="w-5 h-5" /> },
    { name: "AID MISSION", icon: <Building2 className="w-5 h-5" /> },
    { name: "UN FOOD", icon: <Globe2 className="w-5 h-5" /> },
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
    <div className="relative min-h-screen bg-white text-white flex flex-col items-center selection:bg-orange-100 overflow-hidden">
      
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,rgba(248, 80, 24, 0.08),transparent_70%)] opacity-70" /> */}
        <Image src="https://res.cloudinary.com/dabnumgog/image/upload/v1774251688/monochrome-street-food-entertainment.jpg_amdchc.jpg" alt="Background Pattern" fill className="object-cover " />
        {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" /> */}
      </div>

      {/* Broad & Premium Navbar */}
      <nav className="fixed top-8 z-50 w-[95%] max-w-7xl">
        <div className="mx-auto rounded-[2rem] border border-orange-100 bg-white/60 backdrop-blur-2xl px-8 py-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl shadow-[0_8px_20px_rgba(234,88,12,0.2)] flex items-center justify-center group-hover:rotate-6 transition-all">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font tracking-tighter text-slate-900">ShareBite</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-12 text-[12px] font uppercase tracking-[0.1em] text-black">
            <a href="#partners" className="hover:text-orange-600 transition-colors">Partners</a>
            <a href="#stories" className="hover:text-orange-600 transition-colors">Stories</a>
            <a href="#features" className="hover:text-orange-600 transition-colors">Impact</a>
            <a href="#roles" className="hover:text-orange-600 transition-colors">Roles</a>
            <a href="#testimonial" className="hover:text-orange-600 transition-colors">Testimonial</a>
            <a href="#faq" className="hover:text-orange-600 transition-colors">faq</a>
            <Link href="/login" className="hover:text-orange-600 transition-colors">Portal</Link>
          </div>

          <Link href="/register" className="px-8 py-3 bg-slate-950 text-white text-[12px] font rounded-2xl hover:bg-orange-600 hover:shadow-lg hover:shadow-slate-700 transition-all active:scale-95 flex items-center gap-2">
            JOIN MOVEMENT <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 w-full pt-56">
        {/* Refined Hero Section */}
        <section id="partners" className="px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 py-2 rounded-full border border-orange-100 bg-orange-50 text-[11px] font uppercase tracking-[0.25em] text-orange-600 mb-10 inline-flex items-center gap-3"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
            </span>
            Active Logistics in 12 Major Cities
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-[80px] font tracking-tight leading-[0.95] mb-10 text-white"
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
            className="text-base md:text-lg text-white max-w-2xl mb-14 font-medium leading-relaxed"
          >
            The world&apos;s most sophisticated food-sharing engine. We connect high-volume donors with NGOs and professional riders to eliminate hunger with sub-second precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <Link href="/register" className="px-12 py-5 bg-orange-600 text-white font text-lg rounded-[1.5rem] hover:bg-orange-700 hover:shadow-lg hover:shadow-slate-900 transition-all active:scale-95 flex items-center gap-3">
              Start Donating <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-12 py-5 bg-slate-800 border border-slate-200 text-white font text-lg rounded-[1.5rem] hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-3">
              Watch Impact <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Play className="w-3 h-3 fill-current" /></div>
            </Link>
          </motion.div>

          {/* Luxury Marquee */}
          <div className="mt-32 w-full max-w-6xl">
            <p className="text-[11px] font uppercase tracking-[0.5em] text-slate-300 mb-12">Trusted Power Partners</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-900 to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-900 to-transparent z-10" />
              <Marquee pauseOnHover className="[--duration:25s] py-12">
                {partners.map((p, i) => (
                  <div key={i} className="flex items-center gap-6 mx-12 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
                     <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-all shadow-sm">
                       {p.icon}
                     </div>
                     <span className="text-2xl font  tracking-tighter text-white">{p.name}</span>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </section>

        {/* Epic Impact Gallery - Now natively full width outside the padded hero container */}
        <section id="stories">
          <div className="w-full">
            <ImpactGallery />
          </div>
        </section>

        {/* Polished Bento Grid */}
        <section id="features" className="px-6 py-40 max-w-7xl mx-auto">
          <div className="text-center mb-28">
            <h2 className="text-4xl md:text-7xl font tracking-tight mb-8">Platform of <span className="text-orange-600 ">Prestige.</span></h2>
            <p className="text-white font-bold text-lg max-w-xl mx-auto">Engineered for absolute reliability, transparency, and global scale.</p>
          </div>
          
          <BentoGrid className="auto-rows-[25rem]">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </section>

        {/* Roles Section - Premium Contrast */}
        <section id="roles" className="px-10 py-32 bg-slate-500/30 text-white rounded-[4rem] mx-4 md:mx-12 overflow-hidden relative group">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-orange-600/10 to-transparent pointer-none" />
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-20 relative z-10">
            <RoleItem luxury title="The Giver" desc="Transform surplus into status. Posting handles everything from logistics to detailed impact reports." />
            <RoleItem luxury title="The Anchor" desc="Empower your NGO with a high-fidelity dashboard to manage cities of surplus food." />
            <RoleItem luxury title="The Fleet" desc="Step into the driver's seat of change. Deliver smiles and earn elite Karma rewards." />
          </div>
        </section>

        {/* Minimalist CTA */}
        <section className="px-6 py-48 text-center">
          <h2 className="text-5xl md:text-[100px] font tracking-tighter mb-14 text-white ">Ready to Lead?</h2>
          <p className="text-lg text-white mb-16 max-w-lg mx-auto font-medium">Join 12,000+ pioneers redefining food security. Experience the future of sharing.</p>
          <Link href="/register" className="px-20 py-8 bg-slate-950 text-white font text-2xl rounded-[2rem] hover:bg-orange-700 hover:-translate-y-2 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 group">
             Initialize Profile <ArrowRight className="inline ml-2 group-hover:translate-x-3 transition-transform" />
          </Link>
        </section>

        {/* Testimonials */}
        <section id="testimonial">
          <TestimonialsSectionDemo />
        </section>

        {/* FAQs */}
        <section id="faq">
          <FaqsSection />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function RoleItem({ title, desc, luxury = false }: { title: string, desc: string, luxury?: boolean }) {
  return (
    <div className="space-y-6 group cursor-default">
       <div className="h-0.5 w-12 bg-orange-600 group-hover:w-full transition-all duration-700" />
       <h3 className="text-4xl font  tracking-tight">{title}</h3>
       <p className="text-white font-medium leading-relaxed">{desc}</p>
       <button className="flex items-center gap-3 text-[11px] font uppercase tracking-widest text-white hover:text-orange-500 transition-colors">
         Explore Role <ChevronRight className="w-4 h-4" />
       </button>
    </div>
  );
}
