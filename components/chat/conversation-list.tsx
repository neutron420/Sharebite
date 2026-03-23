"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface Conversation {
  id: string;
  donation: {
    title: string;
    imageUrl?: string;
  };
  participantA: {
    id: string;
    name: string;
    imageUrl?: string;
    role: string;
  };
  participantB: {
    id: string;
    name: string;
    imageUrl?: string;
    role: string;
  };
  messages: {
    text: string;
    createdAt: string;
  }[];
  updatedAt: string;
}

interface ConversationListProps {
  currentUserId: string;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ currentUserId, selectedId, onSelect }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((c) => {
    const otherUser = c.participantA.id === currentUserId ? c.participantB : c.participantA;
    return (
      otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.donation.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase italic">Inbox</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {loading ? (
          <div className="space-y-4 px-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-1">
            {filteredConversations.map((c) => {
              const otherUser = c.participantA.id === currentUserId ? c.participantB : c.participantA;
              const lastMessage = c.messages?.[0];
              const isSelected = selectedId === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all duration-300 text-left group",
                    isSelected 
                      ? "bg-slate-950 text-white shadow-xl shadow-slate-200" 
                      : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <Avatar className={cn(
                    "h-12 w-12 shrink-0 border-2",
                    isSelected ? "border-orange-500" : "border-slate-100"
                  )}>
                    <AvatarImage src={otherUser.imageUrl || undefined} />
                    <AvatarFallback className={cn(
                        "font-black text-xs",
                        isSelected ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {otherUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={cn(
                        "font-black text-[11px] uppercase tracking-widest truncate",
                        isSelected ? "text-white" : "text-slate-950"
                      )}>
                        {otherUser.name}
                      </h3>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter opacity-50 whitespace-nowrap",
                        isSelected ? "text-slate-400" : "text-slate-400"
                      )}>
                        {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: false })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold mb-1 truncate uppercase",
                      isSelected ? "text-orange-400" : "text-orange-600"
                    )}>
                      {c.donation.title}
                    </p>
                    <p className={cn(
                      "text-[10px] font-medium truncate",
                      isSelected ? "text-slate-400" : "text-slate-400"
                    )}>
                      {lastMessage?.text || "Started a conversation"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No transmissions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
