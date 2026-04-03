"use client";

import React, { useState } from "react";
import { languages, useTranslationStore } from "@/lib/translation-store";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const LanguageSwitcher = () => {
    const { currentLanguage, setLanguage } = useTranslationStore();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-10 w-10 sm:w-24 bg-slate-50/50 animate-pulse rounded-2xl" />;

    const current = languages.find(l => l.code === currentLanguage) || languages[0];

    return (
        <div className="relative z-[100]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group pointer-events-auto"
            >
                <Globe className="size-3.5 sm:size-4 text-orange-600 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:flex text-xs font-bold uppercase tracking-[0.15em] text-slate-600 whitespace-nowrap items-center gap-1">
                    <span>{current.flag}</span>
                    <span>{current.name}</span>
                    <span>{current.code}</span>
                </span>
                <ChevronDown className={cn("size-3 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full mt-2 -right-4 sm:right-0 w-48 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl p-2 overflow-hidden backdrop-blur-3xl pointer-events-auto"
                    >
                        <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group",
                                        currentLanguage === lang.code 
                                            ? "bg-orange-50 text-orange-600" 
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-sm">{lang.flag}</span>
                                        {lang.name}
                                    </span>
                                    {currentLanguage === lang.code && <Check className="size-3.5" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
