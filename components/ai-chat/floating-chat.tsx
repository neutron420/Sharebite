"use client";

import { useState } from "react";
import { AiAssistantCard } from "@/components/ui/ai-assistant-card";
import { MessageSquare, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-[7.5rem] z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-8">
      {isOpen && (
        <div className="mb-2 w-full sm:w-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300 transform-gpu shadow-2xl rounded-3xl overflow-hidden">
          <AiAssistantCard onClose={() => setIsOpen(false)} />
        </div>
      )}
      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "relative size-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
            isOpen 
              ? "bg-background text-foreground border-border hover:bg-muted" 
              : "bg-primary text-primary-foreground"
          )}
        >
          {isOpen ? (
            <X className="size-6 transition-transform rotate-0 group-hover:rotate-90 duration-300" />
          ) : (
            <div className="relative">
               <MessageSquare className="size-6 fill-current" />
               <Sparkles className="absolute -top-1.5 -right-1.5 size-4 text-amber-300 animate-pulse" />
            </div>
          )}
        </Button>
      </div>
      
      {!isOpen && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2 glass px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-500 delay-1000 hidden md:block">
            <span className="flex items-center gap-2 text-orange-600">
                <div className="size-2 rounded-full bg-orange-500 animate-ping" />
                Ask ShareBite AI
            </span>
        </div>
      )}
    </div>
  );
}
