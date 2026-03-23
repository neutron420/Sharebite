"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  imageUrl?: string;
  role: string;
}

interface Message {
  id: string;
  text?: string;
  senderId: string;
  sender: {
    name: string;
    imageUrl?: string;
  };
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
  isRead: boolean;
  createdAt: string;
}

interface ChatBoxProps {
  currentUserId: string;
  conversationId: string;
  otherUser: User;
  donationTitle: string;
}

export function ChatBox({ currentUserId, conversationId, otherUser, donationTitle }: ChatBoxProps) {
  const { socket, addListener } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    }

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = addListener("NEW_MESSAGE", (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        // Auto mark as read if this conversation is active
        fetch(`/api/chat/conversations/${conversationId}/read`, { method: "POST" });
      }
    });

    return () => unsubscribe();
  }, [addListener, conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket) return;

    const payload = {
      type: "SEND_MESSAGE",
      payload: {
        conversationId,
        receiverId: otherUser.id,
        text: inputText.trim(),
      },
    };

    socket.send(JSON.stringify(payload));
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-slate-100 ring-2 ring-orange-500/20">
            <AvatarImage src={otherUser.imageUrl || undefined} />
            <AvatarFallback className="bg-slate-50 text-slate-400 font-black text-xs">
              {otherUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-950 truncate max-w-[200px]">
              {otherUser.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
                Discussing: {donationTitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin" strokeWidth={3} />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const isMine = m.senderId === currentUserId;
                return (
                  <motion.div
                    key={m.id || i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "group p-4 rounded-[2rem] text-xs font-semibold leading-relaxed relative",
                      isMine 
                        ? "bg-slate-950 text-white rounded-tr-none shadow-2xl shadow-slate-200" 
                        : "bg-white text-slate-950 rounded-tl-none border border-slate-100 shadow-xl shadow-slate-200/50"
                    )}>
                      {m.text}
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter opacity-50 block mt-2",
                        isMine ? "text-slate-400" : "text-slate-400"
                      )}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
             <div className="w-16 h-16 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center text-slate-100">
                <Send className="h-8 w-8" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">New Protocol Initialized</p>
             <p className="text-[10px] font-bold text-slate-400 max-w-[200px]">Send a message to coordinate the food rescue mission.</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100 z-10 shrink-0">
        <div className="relative group max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="Secure transmission..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="w-full pl-6 pr-24 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button className="p-2.5 rounded-2xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90">
                <ImageIcon className="h-4 w-4" />
            </button>
            <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-950"
            >
                <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
