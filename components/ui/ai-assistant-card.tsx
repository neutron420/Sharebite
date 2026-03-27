"use client";

import {
  SparklesIcon,
  X,
  SendHorizontal,
  Phone,
  Mail,
  HandHeart,
  Store,
  Truck,
  ShieldCheck,
  TrendingUp,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import { useTranslationStore } from "@/lib/translation-store";

interface AiAssistantCardProps {
  onClose?: () => void;
}

export const AiAssistantCard = ({ onClose }: AiAssistantCardProps) => {
  const { currentLanguage } = useTranslationStore();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/chat',
      body: {
        language: currentLanguage
      }
    }),
  });
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isLoading = status === "streaming" || status === "submitted" || isTranscribing;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleBadgeClick = (text: string) => {
    if (!isLoading) {
      sendMessage({ text });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceUpload = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");

      const response = await fetch("/api/chat/voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      if (data.text && data.text.trim()) {
        sendMessage({ text: data.text });
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error("Failed to process voice message");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatAssistantText = (text: string, role: string) => {
    if (role !== "assistant") {
      return text;
    }

    return text
      .replace(/\r/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/`{1,3}/g, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  return (
    <Card className="flex h-[min(82vh,700px)] sm:h-[min(78vh,700px)] min-h-[520px] w-[calc(100vw-24px)] sm:w-[480px] flex-col gap-4 p-3 sm:p-4 shadow-2xl bg-background border-border/50 rounded-3xl overflow-hidden">
      <div className="flex flex-row items-center justify-between p-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
            <Icons.logo className="size-5 text-orange-600" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">ShareBite AI</p>
            <p className="text-xs text-muted-foreground">Support Chat</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            className="size-4 text-muted-foreground"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 19a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"
            />
          </svg>
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
          <X className="size-4 text-muted-foreground" />
        </Button>
      </div>
      
      <CardContent className="flex flex-1 flex-col p-0 overflow-hidden relative">
        <div 
            ref={scrollRef}
            className="flex flex-col space-y-4 p-4 overflow-y-auto h-full no-scrollbar pb-10"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col space-y-6 pt-10">
              <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Support Chat
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hi! I&apos;m here to help with your food donations and volunteer questions. How can I assist you today?
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Suggested Topics</p>
                <div className="flex flex-wrap gap-2">
                {[
                  { icon: HandHeart, color: "text-orange-500", text: "How to donate?" },
                  { icon: Store, color: "text-blue-500", text: "NGO verification" },
                  { icon: Truck, color: "text-green-500", text: "Become a rider" },
                  { icon: ShieldCheck, color: "text-purple-500", text: "Food safety" },
                  { icon: TrendingUp, color: "text-pink-500", text: "Our impact" },
                  { icon: SparklesIcon, color: "text-amber-500", text: "More" },
                ].map((item, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="h-9 cursor-pointer gap-2 px-3 text-[11px] font-medium rounded-full bg-background border-border hover:bg-muted/50 transition-all"
                    onClick={() => handleBadgeClick(item.text)}
                  >
                    <item.icon className={cn("size-3.5", item.color)} />
                    {item.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex flex-col space-y-1.5 max-w-[85%]",
                    m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-tl-none border border-border/40"
                    )}
                  >
                    {m.parts
                      ?.filter((part) => part.type === "text")
                      .map((part, i) => (
                        <div key={i} className="whitespace-pre-wrap leading-relaxed">
                          {formatAssistantText(part.text, m.role)}
                        </div>
                      ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isLoading && (
            <div className="flex flex-col space-y-2 mr-auto items-start max-w-[85%]">
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-4 py-2 border border-border/40 shadow-sm">
                    <div className="flex gap-1">
                        <span className="size-1 w-1 rounded-full bg-primary/40 animate-bounce" />
                        <span className="size-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                        <span className="size-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                    </div>
                </div>
            </div>
          )}
        </div>

        <div className="mt-auto border-t bg-background">
          <div className="relative flex items-center gap-2 p-3">
            <div className="relative flex-1">
              <Textarea
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="min-h-[44px] max-h-[120px] resize-none border-none py-3 ps-4 pe-22 sm:pe-20 shadow-none focus-visible:ring-0 bg-muted/30 rounded-2xl text-sm"
                rows={1}
              />

              <div className="absolute end-1.5 bottom-1.5 flex items-center gap-1.5 sm:gap-1">
                <Button
                  className={cn(
                    "size-9 sm:size-8 rounded-xl transition-all",
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 animate-pulse text-white" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading && !isRecording}
                >
                  {isRecording ? <MicOff className="size-5 sm:size-4" /> : <Mic className="size-5 sm:size-4" />}
                </Button>

                <Button
                  className="size-9 sm:size-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all"
                  size="icon"
                  type="submit"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading}
                >
                  {isTranscribing ? (
                    <Loader2 className="size-5 sm:size-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-5 sm:size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="px-4 pb-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a
                href="tel:+919002132340"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Phone className="size-3.5 text-orange-600" />
                +91 9002132340
              </a>
              <a
                href="mailto:sharebite.support@gmail.com"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Mail className="size-3.5 text-orange-600" />
                sharebite.support@gmail.com
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
