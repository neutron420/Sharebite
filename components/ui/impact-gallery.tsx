"use client";

import Image from "next/image";
import Marquee from "@/components/magicui/marquee";

const items = [
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774251688/monochrome-street-food-entertainment.jpg_amdchc.jpg",
    title: "Community First",
    quote: "Empowering local communities by transforming the culture of surplus food sharing.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774252454/8ebf16dfc67eef2d796ab09c95673f32.jpg_tyn76s.jpg",
    title: "Zero Waste",
    quote: "Bridging the gap between excess and emptiness, one meal at a time.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774252454/3e93feb0777eb984125202906e922840.jpg_fijkml.jpg",
    title: "Unstoppable Logistics",
    quote: "Sub-second precision matching empowers riders to act immediately.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774252454/74a85eaa548f3689b044a3455b39a00c.jpg_knctbk.jpg",
    title: "Anchor Partners",
    quote: "Verified NGO partnerships guarantee every donation creates measurable impact.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774252453/87afed84c6a7e302f713633b6817ef8e.jpg_nvfoae.jpg",
    title: "Global Scalability",
    quote: "Engineered to support massive throughput, turning local charity into global infrastructure.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774252547/dab8746ebb0d48e0413f5d97a8dd712c.jpg_pkkwas.jpg",
    title: "A Shared Vision",
    quote: "Ending global hunger is not a dream — it is the operating system of tomorrow.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774259339/559db5233119fdeed5aaceb4633a7ac3.jpg_jjdnbp.jpg",
    title: "Unbroken Chain",
    quote: "A perfectly optimized network where nothing good goes to waste.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774259312/6c08a864b9dcad9605cb564bc42d264d.jpg_yowfli.jpg",
    title: "Digital Compassion",
    quote: "Applying cutting-edge tech to solve humanity's oldest problem.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774259602/1191f22f107db5d7b111fa85c2532a6f.jpg_pohdau.jpg",
    title: "Sustainable Hope",
    quote: "Redistributing abundance to create a profoundly better world.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774339746/bd324b3cd42980caa74b2fd2e095b2ff.jpg_ettzff.jpg",
    title: "Global Reach",
    quote: "Expanding operations beyond borders to eradicate hunger entirely.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774339746/5b4c61381a83b72daffb10a3a8bd738c.jpg_o5csdm.jpg",
    title: "Silent Operations",
    quote: "Flawless and silent handover ensuring respect and dignity.",
  },
  {
    url: "https://res.cloudinary.com/dabnumgog/image/upload/v1774339746/05749487c759ec46f67314e8e8783477.jpg_casa0c.jpg",
    title: "Generosity Engine",
    quote: "Powering the pulse of community-driven surplus rescue.",
  }
];

// Splitting items for top and bottom rows to create visual variety
const row1Items = items.slice(0, 6);
const row2Items = items.slice(6, 12);

function GalleryCard({ item }: { item: (typeof items)[0] }) {
  return (
    <div
      style={{ width: 420, height: 280, minWidth: 420, minHeight: 280, maxWidth: 420, maxHeight: 280 }}
      className="relative rounded-2xl overflow-hidden group cursor-pointer border border-slate-200/50"
    >
      <Image
        src={item.url}
        alt={item.title}
        fill
        unoptimized
        sizes="420px"
        className="object-cover brightness-[0.7] transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="inline-block px-3 py-1 rounded-full bg-orange-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
          {item.title}
        </span>
        <p className="text-white/95 text-[15px] font-medium leading-[1.3] max-w-xs drop-shadow-lg">
          &ldquo;{item.quote}&rdquo;
        </p>
      </div>
    </div>
  );
}

export function ImpactGallery() {
  return (
    <section className="mb-32 overflow-hidden w-full bg-white relative">
      {/* Section Header */}
      <div className="text-center mb-16 px-6 relative z-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-orange-600 mb-5">Our Impact</p>
        <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-slate-950 mb-6">
          Stories That{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Inspire.</span>
        </h2>
        <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
          The faces and moments behind our mission to end hunger.
        </p>
      </div>

      {/* Conveyor Belts Container */}
      <div className="w-full flex flex-col gap-5 py-4 relative">
        
        {/* Row 1 — Scrolls Left (Standard Marquee) */}
        <div className="relative w-full overflow-hidden flex">
          <Marquee pauseOnHover className="[--duration:35s] [--gap:20px] p-0" repeat={6}>
            {row1Items.map((item, i) => (
              <GalleryCard key={`r1-${i}`} item={item} />
            ))}
          </Marquee>
        </div>

        {/* Row 2 — Scrolls Right (Reversed Marquee) */}
        <div className="relative w-full overflow-hidden flex">
          <Marquee pauseOnHover reverse className="[--duration:40s] [--gap:20px] p-0" repeat={6}>
            {row2Items.map((item, i) => (
              <GalleryCard key={`r2-${i}`} item={item} />
            ))}
          </Marquee>
        </div>

      </div>
    </section>
  );
}
