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
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-20 bg-white rounded-3xl border border-gray-100 italic">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <p className="text-gray-500 text-sm ml-4">Loading messages...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-10rem)] bg-white rounded-3xl border border-gray-100 overflow-hidden flex shadow-sm mt-4">
      <div className="w-80 md:w-96 flex-shrink-0 border-r border-gray-50">
        <ConversationList
          currentUserId={user.id}
          selectedId={selectedId || undefined}
          onSelect={(id) => router.push(`/rider/messages?id=${id}`)}
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
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 relative group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.02),transparent_70%)] opacity-70" />
            
            <div className="relative z-10 space-y-6 flex flex-col items-center text-center p-10">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center transition-transform duration-500">
                    <div className="w-14 h-14 bg-orange-600 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center text-white">
                        <MessageSquare className="h-7 w-7" />
                    </div>
                </div>
                <div>
                   <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Messenger</h2>
                   <p className="text-sm font-medium text-gray-500 max-w-[300px] mx-auto leading-relaxed">
                     Coordinate with donors and NGOs in real-time to ensure successful mission execution.
                   </p>
                </div>
                <div className="flex items-center gap-6 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Secure Comms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-orange-500 fill-current" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Impact Focus</span>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RiderMessagesPage() {
  return (
    <div className="w-full h-full pb-0">
      <Suspense fallback={<div className="p-10 text-gray-400">Loading Messenger...</div>}>
         <MessagesContent />
      </Suspense>
    </div>
  );
}
