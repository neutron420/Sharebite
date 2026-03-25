"use client";

import { cn } from "@/lib/utils";
import {
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
    Video,
    Globe,
} from "lucide-react";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

const itemsSample: BentoItem[] = [];

function BentoGrid({ items = itemsSample }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-8 rounded-[2rem] overflow-hidden transition-all duration-500",
                        "border border-orange-100 bg-white/80 backdrop-blur-sm",
                        "hover:shadow-[0_20px_40px_rgba(255,100,50,0.05)] hover:border-orange-200",
                        "hover:-translate-y-1 will-change-transform",
                        item.colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
                        item.colSpan === 3 ? "md:col-span-3" : ""
                    )}
                >
                    <div
                        className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-orange-50/30",
                            item.hasPersistentHover && "opacity-100"
                        )}
                    />

                    <div className="relative flex flex-col h-full justify-between space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600 transition-all duration-300 group-hover:bg-orange-600 group-hover:text-white">
                                {item.icon}
                            </div>
                            {item.status && (
                                <span
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm",
                                        "bg-orange-50 text-orange-600",
                                        "transition-colors duration-300 group-hover:bg-orange-100"
                                    )}
                                >
                                    {item.status}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-900 tracking-tight text-xl">
                                {item.title}
                                {item.meta && (
                                    <span className="ml-2 text-xs text-orange-300 font-bold uppercase tracking-widest">
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className="text-base text-slate-500 leading-relaxed font-medium">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-orange-400 transition-all duration-300"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-orange-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                {item.cta || "Explore →"}
                            </span>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    );
}

export { BentoGrid }
