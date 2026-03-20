"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Define the types for the component props for type-safety and reusability
interface User {
  src: string;
  fallback: string;
}

interface Action {
  Icon: React.ElementType;
  bgColor: string;
}

interface WorkflowBuilderCardProps {
  imageUrl: string;
  status: "Active" | "Inactive";
  lastUpdated: string;
  title: string;
  description: string;
  tags: string[];
  users: User[];
  actions: Action[];
  className?: string;
}

export const WorkflowBuilderCard = ({
  imageUrl,
  status,
  lastUpdated,
  title,
  description,
  tags,
  users,
  actions,
  className,
}: WorkflowBuilderCardProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Animation variants for the details section
  const detailVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: "1rem",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={cn("w-full max-w-sm cursor-pointer", className)}
    >
      <Card className="overflow-hidden rounded-3xl border-orange-100/50 bg-white shadow-md transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-200/50">
        {/* Card Image */}
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          {/* Status Badge Over Image */}
          <div className="absolute top-4 left-4">
             <div className={cn(
               "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
               status === "Active" 
                 ? "bg-emerald-500/80 text-white border-emerald-400/50" 
                 : "bg-slate-500/80 text-white border-slate-400/50"
             )}>
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === "Active" ? "bg-white" : "bg-slate-300")} />
                {status}
             </div>
          </div>
        </div>

        <div className="p-6">
          {/* Always-visible header content */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lastUpdated}</span>
                <span className="text-orange-200">•</span>
                <span className="text-orange-600/70">ShareBite Core</span>
              </div>
              <h3 className="mt-1 text-xl font-black text-slate-800 tracking-tight leading-tight">
                {title}
              </h3>
            </div>
            <button
              aria-label="More options"
              className="p-2 rounded-xl bg-orange-50 text-orange-400 transition-colors hover:bg-orange-100 hover:text-orange-600"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Animated description and tags section */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                key="details"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={detailVariants}
                className="overflow-hidden"
              >
                <p className="text-sm text-slate-500 leading-relaxed font-semibold italic">"{description}"</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} className="bg-orange-100 text-orange-600 hover:bg-orange-200 border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between border-t border-orange-50 bg-orange-50/20 p-5">
          <div className="flex -space-x-3">
            {users.map((user, index) => (
              <Avatar
                key={index}
                className="h-9 w-9 border-4 border-white shadow-sm"
                aria-label={user.fallback}
              >
                <AvatarImage src={user.src} />
                <AvatarFallback className="bg-orange-500 text-white font-bold text-xs">{user.fallback}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {actions.map(({ Icon, bgColor }, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-white text-white shadow-sm transition-transform",
                  bgColor.includes("orange") || bgColor.includes("amber") ? bgColor : "bg-orange-500" // Support user preference but fallback to orange
                )}
              >
                <Icon size={16} />
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
