"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, MessageSquare } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

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
    senderId: string;
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
  const [potentialContacts, setPotentialContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { addListener } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [convRes, reqRes] = await Promise.all([
        fetch("/api/chat/conversations"),
        fetch("/api/requests")
      ]);

      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data);
      }

      if (reqRes.ok) {
        const requests = await reqRes.json();
        // Extract unique people across active missions
        const contacts: any[] = [];
        const seenIds = new Set();

        requests.forEach((r: any) => {
          // Add Donor
          if (r.donation?.donorId && r.donation.donorId !== currentUserId && !seenIds.has(r.donation.donorId)) {
            contacts.push({ 
              id: r.donation.donorId, 
              name: r.donation.donor.name, 
              role: "DONOR", 
              donationId: r.donationId, 
              donationTitle: r.donation.title 
            });
            seenIds.add(r.donation.donorId);
          }
          // Add NGO
          if (r.ngoId && r.ngoId !== currentUserId && !seenIds.has(r.ngoId)) {
            contacts.push({ 
              id: r.ngoId, 
              name: r.ngo.name, 
              role: "NGO", 
              donationId: r.donationId, 
              donationTitle: r.donation.title 
            });
            seenIds.add(r.ngoId);
          }
          // Add Rider
          if (r.riderId && r.riderId !== currentUserId && !seenIds.has(r.riderId)) {
            contacts.push({ 
              id: r.riderId, 
              name: r.rider.name, 
              role: "RIDER", 
              donationId: r.donationId, 
              donationTitle: r.donation.title 
            });
            seenIds.add(r.riderId);
          }
        });
        setPotentialContacts(contacts);
      }
    } catch (error) {
      console.error("Failed to fetch discovery data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartChat = async (donationId: string, participantId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, participantId }),
      });
      if (res.ok) {
        const conv = await res.json();
        await fetchData(); // Refresh list to show the new conversation
        onSelect(conv.id);
      }
    } catch (e) {
      console.error("Discovery link failed:", e);
    }
  };

  // Listen for new messages to update the conversation list in real-time
  useEffect(() => {
    const unsubscribe = addListener("NEW_MESSAGE", (message: any) => {
      if (!message) return;
      setConversations((prev) => {
        const existing = prev.find(c => c.id === message.conversationId);
        if (existing) {
            return prev.map((c) => {
              if (c.id === message.conversationId) {
                return {
                  ...c,
                  messages: [{ text: message.text, createdAt: message.createdAt, senderId: message.senderId }],
                  updatedAt: message.createdAt,
                };
              }
              return c;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else {
            // New conversation created by someone else
            fetchData();
            return prev;
        }
      });
    });

    return () => unsubscribe();
  }, [addListener, fetchData]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "NGO": return { label: "NGO", color: "bg-emerald-100 text-emerald-700" };
      case "DONOR": return { label: "Donor", color: "bg-orange-100 text-orange-700" };
      case "RIDER": return { label: "Rider", color: "bg-blue-100 text-blue-700" };
      default: return { label: role, color: "bg-gray-100 text-gray-700" };
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const otherUser = c.participantA.id === currentUserId ? c.participantB : c.participantA;
    return (
      otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.donation.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const searchedPotential = potentialContacts.filter(p => 
    !conversations.some(c => (c.participantA.id === p.id || c.participantB.id === p.id) && c.donation === p.donationId) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.donationTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 sm:p-5 space-y-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Messages</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
            {conversations.length} active
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search missions or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (filteredConversations.length > 0 || searchedPotential.length > 0) ? (
          <div className="p-2 space-y-4">
            {/* Active Chats */}
            {filteredConversations.length > 0 && (
              <div className="space-y-0.5">
                {filteredConversations.map((c) => {
                  const otherUser = c.participantA.id === currentUserId ? c.participantB : c.participantA;
                  const lastMessage = c.messages?.[0];
                  const isSelected = selectedId === c.id;
                  const roleBadge = getRoleBadge(otherUser.role);

                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group",
                        isSelected
                          ? "bg-orange-50 border border-orange-100"
                          : "hover:bg-slate-50 border border-transparent"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className={cn(
                          "h-11 w-11 border-2",
                          isSelected ? "border-orange-200" : "border-slate-100"
                        )}>
                          <AvatarImage src={otherUser.imageUrl || undefined} />
                          <AvatarFallback className={cn(
                            "font-bold text-xs",
                            isSelected ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            {otherUser.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-orange-700" : "text-slate-900"
                            )}>
                              {otherUser.name}
                            </h3>
                            <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0", roleBadge.color)}>
                              {roleBadge.label}
                            </span>
                          </div>
                        </div>
                        <p className={cn(
                          "text-[10px] font-medium truncate",
                          isSelected ? "text-orange-600" : "text-slate-400"
                        )}>
                          {c.donation.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 opacity-80">
                          {lastMessage?.senderId === currentUserId ? "You: " : ""}
                          {lastMessage?.text || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Potential Mission Chats (Discovery) */}
            {searchedPotential.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available Coordination</p>
                {searchedPotential.map((p, idx) => {
                  const roleBadge = getRoleBadge(p.role);
                  return (
                    <button
                      key={`potential-${idx}`}
                      onClick={() => handleStartChat(p.donationId, p.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-orange-50/50 border border-transparent hover:border-orange-100 transition-all duration-200 text-left group"
                    >
                      <Avatar className="h-11 w-11 border-2 border-dashed border-slate-200">
                        <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-xs">
                          {p.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                           <h3 className="text-sm font-semibold text-slate-600">{p.name}</h3>
                           <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full", roleBadge.color)}>{roleBadge.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">Mission: {p.donationTitle}</p>
                        <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                           Initialize Comms
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 px-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">{searchQuery ? "No ops match found" : "No active channels"}</p>
            <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed uppercase tracking-wider font-bold">
              Coordination channels open automatically during food rescue missions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

