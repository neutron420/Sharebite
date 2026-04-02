"use client";

import React, { useState } from "react";
import { X, Upload, Loader2, Image as ImageIcon, Sparkles, ShieldAlert, AlertTriangle, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PostMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (post: any) => void;
}

interface InterceptionData {
  reason: string;
  isImageBad?: boolean;
  isTextBad?: boolean;
}

export default function PostMomentModal({ isOpen, onClose, onSuccess }: PostMomentModalProps) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<"IDLE" | "UPLOAD" | "SCAN">("IDLE");
  const [interception, setInterception] = useState<InterceptionData | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !caption) {
      toast.error("Please provide both an image and a caption");
      return;
    }

    setLoadingPhase("UPLOAD");

    try {
      // 1. Get presigned URL
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: image.name,
          contentType: image.type,
        }),
      });

      if (!uploadRes.ok) throw new Error("Failed to get upload URL");
      const { presignedUrl, publicUrl } = await uploadRes.json();

      // 2. Upload to R2
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        body: image,
        headers: { "Content-Type": image.type },
      });

      if (!putRes.ok) throw new Error("Failed to upload image to storage");

      setLoadingPhase("SCAN");

      // 3. Create post in database
      const postRes = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          imageUrl: publicUrl,
        }),
      });

      const resData = await postRes.json().catch(() => ({}));

      if (!postRes.ok) {
        if (resData.error?.startsWith("Hive Guard:")) {
          setInterception({
            reason: resData.error.replace("Hive Guard: ", ""),
            isImageBad: resData.isImageBad,
            isTextBad: resData.isTextBad
          });
          return;
        }
        throw new Error(resData.error || "Failed to save post");
      }
      
      const post = resData;

      toast.success("Moment shared with the community!");
      onSuccess(post);
      onClose();
      // Reset form
      setCaption("");
      setImage(null);
      setPreview(null);
    } catch (error: any) {
      console.error(error);
      if (error.message?.startsWith("Hive Guard:")) {
        toast.error(error.message, { 
          style: { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" },
          icon: '🛡️',
          duration: 6000
        });
      } else {
        toast.error(error.message || "Something went wrong");
      }
    } finally {
      setLoadingPhase("IDLE");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="text-orange-500 w-5 h-5" />
                <h2 className="text-xl font-bold text-slate-800">Share a Moment</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div
                className={`relative h-64 w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-slate-50 ${
                  preview ? "border-orange-500" : "border-slate-200 hover:border-orange-400"
                }`}
                onClick={() => document.getElementById("moment-upload")?.click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold flex items-center gap-2">
                        <Upload size={18} /> Replace Image
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <ImageIcon size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">Click to upload photo</p>
                      <p className="text-xs text-slate-400">High quality wholesome moments only</p>
                    </div>
                  </div>
                )}
                <input
                  id="moment-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={loadingPhase !== "IDLE"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Write a caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell the community about this moment..."
                  required
                  rows={4}
                  disabled={loadingPhase !== "IDLE"}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPhase !== "IDLE" || !image || !caption}
                className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {loadingPhase === "UPLOAD" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Signal Uploading...</>
                ) : loadingPhase === "SCAN" ? (
                  <><ShieldAlert className="w-5 h-5 animate-pulse text-orange-400" /> Hive Security Check...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Share Moment</>
                )}
              </button>
            </form>

            {/* AI Interception Overlay */}
            <AnimatePresence>
              {interception && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative bg-red-500 text-white p-6 rounded-3xl shadow-2xl shadow-red-500/40">
                      <ShieldAlert size={48} className="animate-bounce" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                    Security Interception
                  </h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium max-w-xs">
                    Our AI Guard flagged your content for violating community guidelines.
                  </p>

                  <div className="w-full space-y-3 mb-10">
                    <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${interception.isImageBad ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}>
                      {interception.isImageBad ? <AlertTriangle size={20} /> : <Ban size={20} />}
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest">Image Security</p>
                        <p className="text-sm font-bold">{interception.isImageBad ? 'Flagged: ' + interception.reason : 'Clear'}</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${interception.isTextBad ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}>
                      {interception.isTextBad ? <Ban size={20} /> : <Ban size={20} />}
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest">Language Scan</p>
                        <p className="text-sm font-bold">{interception.isTextBad ? 'Flagged: Profanity Detected' : 'Clear'}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setInterception(null)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Acknowledge & Edit
                  </button>
                  <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    This incident has been logged for review.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
