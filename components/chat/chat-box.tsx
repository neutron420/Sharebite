"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Image as ImageIcon, Loader2, ChevronLeft, CheckCheck, Wifi } from "lucide-react";
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
  conversationId: string;
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
  isRead: boolean;
  createdAt: string;
  _optimistic?: boolean;
}

interface ChatBoxProps {
  currentUserId: string;
  conversationId: string;
  otherUser: User;
  donationTitle: string;
  onBack?: () => void;
}

export function ChatBox({ currentUserId, conversationId, otherUser, donationTitle, onBack }: ChatBoxProps) {
  const { socket, addListener, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

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

  // Listen for incoming messages via WebSocket
  useEffect(() => {
    const unsubscribe = addListener("NEW_MESSAGE", (message: Message) => {
      if (message.conversationId === conversationId) {
        // Avoid duplicates: don't add if already present (from optimistic update)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            // Replace optimistic message with confirmed one
            return prev.map((m) => (m.id === message.id ? message : m));
          }
          // Also remove any optimistic messages from the same sender with matching text
          const filtered = prev.filter(
            (m) => !(m._optimistic && m.senderId === message.senderId && m.text === message.text)
          );
          return [...filtered, message];
        });
        // Auto mark as read
        fetch(`/api/chat/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [addListener, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setSending(true);
    setInputText("");

    // Create an optimistic message that appears immediately for the sender
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      text,
      senderId: currentUserId,
      sender: { name: "You", imageUrl: undefined },
      conversationId,
      isRead: false,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Try WebSocket first, fallback to HTTP
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "SEND_MESSAGE",
          payload: {
            conversationId,
            receiverId: otherUser.id,
            text,
          },
        })
      );
      setSending(false);
    } else {
      // Fallback: send via HTTP API
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const savedMsg = await res.json();
          // Replace optimistic message with the real one
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? { ...savedMsg, _optimistic: false } : m))
          );
        }
      } catch (error) {
        console.error("Failed to send message via API:", error);
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setInputText(text); // Restore text so user can retry
      } finally {
        setSending(false);
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "NGO": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "DONOR": return "bg-orange-50 text-orange-600 border-orange-100";
      case "RIDER": return "bg-blue-50 text-blue-600 border-blue-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ea580c 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      
      {/* Glassmorphism Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 py-5 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-2.5 -ml-2 rounded-2xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-4 ring-orange-500/5">
              <AvatarImage src={otherUser.imageUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-700 text-white font-black text-sm">
                {otherUser.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
               "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
               isConnected ? "bg-emerald-500" : "bg-slate-300"
            )}>
               <div className={cn("w-1.5 h-1.5 rounded-full bg-white", isConnected && "animate-pulse")} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-slate-900 truncate">
                {otherUser.name}
              </h2>
              <span className={cn("text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-lg border", getRoleBadgeColor(otherUser.role))}>
                {otherUser.role}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="w-1 h-1 rounded-full bg-orange-600" />
               <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/70 truncate">
                 MISSION: {donationTitle}
               </p>
            </div>
          </div>
        </div>

        <div className={cn(
          "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-white/50 text-[9px] font-black uppercase tracking-[0.2em]",
          isConnected ? "text-emerald-600" : "text-slate-400"
        )}>
          {isConnected ? (
             <>
               <Wifi className="w-3 h-3 animate-pulse" />
               Live Coordination Active
             </>
          ) : "Ops Channel Offline"}
        </div>
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 scrollbar-hide"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
             <div className="relative w-12 h-12">
                <Loader2 className="h-12 w-12 text-orange-600 animate-spin absolute inset-0" strokeWidth={3} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2 h-2 bg-orange-600 rounded-full" />
                </div>
             </div>
             <p className="font-black text-[9px] uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Mission Log...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="flex flex-col gap-6">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const isMine = m.senderId === currentUserId;
                const showAvatar = !isMine && (i === 0 || messages[i - 1]?.senderId !== m.senderId);

                return (
                  <motion.div
                    key={m.id || i}
                    initial={{ opacity: 0, x: isMine ? 20 : -20, scale: 0.95 }}
                    animate={{ opacity: m._optimistic ? 0.6 : 1, x: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className={cn(
                      "flex gap-3 max-w-[85%] sm:max-w-[70%]",
                      isMine ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isMine && (
                      <div className="w-8 shrink-0 flex items-end mb-1">
                        {showAvatar ? (
                          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                            <AvatarImage src={otherUser.imageUrl || undefined} />
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-black">
                              {otherUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : <div className="w-8" />}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <div
                        className={cn(
                          "px-5 py-3.5 text-[14px] font-medium leading-relaxed shadow-lg shadow-slate-200/10",
                          isMine
                            ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-[1.5rem] rounded-tr-none shadow-orange-500/10"
                            : "bg-white text-slate-900 rounded-[1.5rem] rounded-tl-none border border-slate-100"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      </div>
                      
                      <div className={cn(
                        "flex items-center gap-2 px-1",
                        isMine ? "justify-end" : "justify-start"
                      )}>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
                           {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                           <div className="flex items-center">
                              {m._optimistic ? (
                                 <Loader2 className="w-2.5 h-2.5 text-orange-400 animate-spin" />
                              ) : (
                                 <CheckCheck className={cn("w-3 h-3", m.isRead ? "text-orange-500" : "text-slate-300")} />
                              )}
                           </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-8">
            <div className="relative">
               <div className="w-24 h-24 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center border border-slate-50">
                  <div className="w-16 h-16 bg-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-orange-100">
                    <Send className="h-8 w-8" />
                  </div>
               </div>
               <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-white shadow-sm uppercase tracking-tighter">Secure</div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Strategic Link Established</h3>
              <p className="text-[10px] font-black text-slate-400 max-w-[250px] uppercase tracking-[0.2em] leading-relaxed mx-auto">
                Coordination for food rescue is ready. Message {otherUser.name.split(' ')[0]} to begin deployment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Console */}
      <div className="px-4 sm:px-10 py-8 bg-gradient-to-t from-white via-white to-transparent shrink-0">
        <div className="max-w-4xl mx-auto">
           <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2.5rem] opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-500" />
             <div className="relative flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-[2rem] shadow-2xl">
                <input
                  type="text"
                  placeholder="Type your tactical update..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending}
                  className="flex-1 px-6 py-4 bg-transparent text-[14px] font-semibold text-slate-900 placeholder:text-slate-300 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || sending}
                  className="group/btn h-12 w-12 bg-gray-900 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:opacity-20 disabled:hover:bg-gray-900"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" />
                  )}
                </button>
             </div>
           </div>
           <div className="flex justify-center mt-4">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Proprietary Web-Mesh Comms Interface v4.0</p>
           </div>
        </div>
      </div>
    </div>
  );
}
