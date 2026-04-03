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
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-slate-100 z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90 shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Avatar className="h-10 w-10 border-2 border-slate-100 ring-2 ring-orange-500/10 shrink-0">
            <AvatarImage src={otherUser.imageUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black text-xs">
              {otherUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {otherUser.name}
              </h2>
              <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0", getRoleBadgeColor(otherUser.role))}>
                {otherUser.role}
              </span>
            </div>
            <p className="text-[11px] text-orange-600 font-medium truncate mt-0.5">
              Re: {donationTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
            isConnected ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            {isConnected ? "Live" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" strokeWidth={2.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading messages...</p>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const isMine = m.senderId === currentUserId;
                const showAvatar = !isMine && (i === 0 || messages[i - 1]?.senderId !== m.senderId);

                return (
                  <motion.div
                    key={m.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: m._optimistic ? 0.7 : 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn(
                      "flex gap-2 max-w-[85%] sm:max-w-[75%]",
                      isMine ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isMine && (
                      <div className="w-7 shrink-0 flex items-end">
                        {showAvatar && (
                          <Avatar className="h-7 w-7 border border-slate-100">
                            <AvatarImage src={otherUser.imageUrl || undefined} />
                            <AvatarFallback className="bg-slate-100 text-slate-500 text-[9px] font-bold">
                              {otherUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        "px-4 py-2.5 text-[13px] leading-relaxed relative",
                        isMine
                          ? "bg-orange-600 text-white rounded-2xl rounded-tr-md shadow-sm"
                          : "bg-white text-slate-800 rounded-2xl rounded-tl-md border border-slate-100 shadow-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        isMine ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-[9px] font-medium",
                          isMine ? "text-white/60" : "text-slate-400"
                        )}>
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </span>
                        {isMine && !m._optimistic && (
                          <CheckCheck className="h-3 w-3 text-white/60" />
                        )}
                        {m._optimistic && (
                          <Loader2 className="h-3 w-3 text-white/60 animate-spin" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
              <Send className="h-7 w-7 text-slate-200" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">No messages yet</p>
              <p className="text-xs text-slate-400 max-w-[250px]">
                Send a message to coordinate the food rescue mission with {otherUser.name}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-4 bg-white border-t border-slate-100 z-10 shrink-0">
        <div className="relative max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || sending}
            className="h-11 w-11 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95 disabled:opacity-40 disabled:hover:bg-orange-600 disabled:active:scale-100 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
