"use client";

import { Code, Share2, Zap, LayoutDashboard, BrainCircuit, Users } from "lucide-react";
import { WorkflowBuilderCard } from "@/components/ui/workflow-builder-card";
import { motion } from "framer-motion";

export default function WorkflowBuilderCardDemo() {
  const cards = [
    {
      imageUrl: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?q=80&w=2070&auto=format&fit=crop",
      status: "Active" as const,
      lastUpdated: "Instantaneous",
      title: "Mission Logistics Hub",
      description: "Real-time vertical scaling for surplus food redistribution across sector 7.",
      tags: ["Primary", "Core Hub"],
      users: [
        { src: "https://i.pravatar.cc/150?img=11", fallback: "AD" },
        { src: "https://i.pravatar.cc/150?img=12", fallback: "RK" },
        { src: "https://i.pravatar.cc/150?img=13", fallback: "SB" },
      ],
      actions: [
        { Icon: Zap, bgColor: "bg-orange-500" },
        { Icon: BrainCircuit, bgColor: "bg-amber-600" },
        { Icon: LayoutDashboard, bgColor: "bg-orange-400" },
      ],
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop",
      status: "Inactive" as const,
      lastUpdated: "2 hours ago",
      title: "Rider Fleet Monitor",
      description: "Awaiting sector deployment for the new volunteer transport wave.",
      tags: ["Fleet", "Operations"],
      users: [
        { src: "https://i.pravatar.cc/150?img=5", fallback: "RM" },
        { src: "https://i.pravatar.cc/150?img=6", fallback: "JD" },
      ],
      actions: [
        { Icon: Users, bgColor: "bg-slate-700" },
        { Icon: Share2, bgColor: "bg-slate-500" },
      ],
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#fdfcfb] p-12 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <span className="text-orange-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Design System Console</span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
          Mission Controller <span className="text-orange-500 italic">Cards</span>
        </h1>
        <p className="mt-4 text-slate-400 text-sm font-medium max-w-md mx-auto leading-relaxed">
          Hover over the mission nodes to expand the operational briefing and access command controls.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <WorkflowBuilderCard {...card} />
          </motion.div>
        ))}
      </div>

      <div className="mt-20 flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-orange-100 italic">
         <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
         <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">System online • Operational Hub Ready</span>
      </div>
    </div>
  );
}
