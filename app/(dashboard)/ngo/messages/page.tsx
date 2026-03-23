"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatBox } from "@/components/chat/chat-box";
import { Loader2, MessageSquare, ShieldCheck, Heart } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
}

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
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  useEffect(() => {
    async function fetchActiveConversation() {
      if (!selectedId) {
        setActiveConversation(null);
        return;
      }
      try {
        const res = await fetch(`/api/chat/conversations`);
        if (res.ok) {
          const conversations: Conversation[] = await res.json();
          const found = conversations.find((c) => c.id === selectedId);
          setActiveConversation(found || null);
        }
      } catch (error) {
        console.error("Conversation fetch error:", error);
      }
    }

    fetchActiveConversation();
  }, [selectedId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-20 bg-white rounded-[3rem] border border-slate-100 italic">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" strokeWidth={3} />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 animate-pulse ml-4">Syncing Ops Channel...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-5rem)] bg-white border-t border-slate-100 overflow-hidden flex shadow-2xl shadow-slate-200/50 mt-4 lg:mx-0">
      <div className="w-80 md:w-96 flex-shrink-0 border-r border-slate-50">
        <ConversationList
          currentUserId={user.id}
          selectedId={selectedId || undefined}
          onSelect={(id) => router.push(`/ngo/messages?id=${id}`)}
        />
      </div>

      <div className="flex-1 min-w-0">
        {activeConversation ? (
          <ChatBox
            currentUserId={user.id}
            conversationId={activeConversation.id}
            otherUser={
              activeConversation.participantA.id === user.id
                ? activeConversation.participantB
                : activeConversation.participantA
            }
            donationTitle={activeConversation.donation.title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 relative group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.02),transparent_70%)] opacity-70" />
            
            <div className="relative z-10 space-y-8 flex flex-col items-center text-center p-10">
                <div className="w-24 h-24 bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <div className="w-16 h-16 bg-orange-600 rounded-[2rem] shadow-xl shadow-orange-100 flex items-center justify-center text-white">
                        <MessageSquare className="h-8 w-8" />
                    </div>
                </div>
                <div>
                   <h2 className="text-3xl font-black italic tracking-tighter text-slate-950 uppercase mb-4">NGO Ops Comms</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 max-w-[300px] mx-auto leading-relaxed">
                     Coordinate food collection and redistribution missions with donors and riders instantly.
                   </p>
                </div>
                <div className="flex items-center gap-6 pt-10 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Transmissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-orange-600 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impact Live</span>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NGOMessagesPage() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<div>Loading Messenger...</div>}>
         <MessagesContent />
      </Suspense>
    </div>
  );
}
