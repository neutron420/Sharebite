"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/navbar";
import { Footerdemo as Footer } from "@/components/ui/footer-section";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, MapPin, Heart, Share2, MessageCircle, User as UserIcon, Plus, LogOut, Utensils, Bell, Send, Flag, MoreHorizontal } from "lucide-react";
import PostMomentModal from "@/components/community/post-moment-modal";
import { toast } from "sonner";
import Image from "next/image";
import { useSocket } from "@/components/providers/socket-provider";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { addListener } = useSocket();

  useEffect(() => {
    checkAuth().then(() => {
       fetchPosts();
    });
  }, []);

  useEffect(() => {
    const unsubscribe = addListener("COMMUNITY_POST", (newPost) => {
      // Avoid duplicate posts if the current user just posted it (it would already be in state from onSuccess)
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
      // Optional: Add a subtle toast or sound effect here
      toast.success("Someone just shared a new moment!", { icon: "✨" });
    });

    const unsubscribeUpdate = addListener("COMMUNITY_POST_UPDATE", (updatedPost) => {
       setPosts((prev) => 
         prev.map((p) => p.id === updatedPost.id ? { ...p, ...updatedPost } : p)
         .sort((a,b) => (b._count?.likes || 0) - (a._count?.likes || 0))
       );
    });

    return () => {
      unsubscribe();
      unsubscribeUpdate();
    };
  }, [addListener]);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/community/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        setUser(data.user);
        setIsAuthLoading(false);
      } else {
        window.location.href = "/community/login";
      }
    } catch {
      window.location.href = "/community/login";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      setUser(null);
      toast.success("Successfully disconnected from Hive");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handlePostSuccess = (newPost: any) => {
    setPosts([newPost, ...posts]);
  };

  const handleShareClick = () => {
    if (!isLoggedIn) {
      toast.error("Please login to share a moment!", {
        action: {
          label: "Login",
          onClick: () => window.location.href = "/community/login"
        }
      });
      return;
    }
    setIsModalOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-600 animate-spin flex-shrink-0"></div>
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Checking Hive Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col pt-24">
      {/* Floating Pill Community Navbar (Referencing Main Site) */}
      <nav className="fixed left-0 w-full z-[60] px-2 sm:px-3 top-2 sm:top-4">
        <div className="mx-auto max-w-7xl rounded-[1.5rem] sm:rounded-[2.5rem] border border-orange-100 bg-white/80 backdrop-blur-2xl px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-xl sm:rounded-2xl shadow-[0_8px_20px_rgba(234,88,12,0.2)] flex items-center justify-center group-hover:rotate-6 transition-all shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="white" />
            </div>
            <span className="text-sm sm:text-2xl font-medium tracking-tighter text-slate-900 uppercase italic underline decoration-orange-600/10">ShareBite <span className="text-slate-400">Hive</span></span>
          </a>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={handleShareClick}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all transform hover:-translate-y-0.5 shadow-lg active:scale-95 shrink-0"
                >
                  <Camera size={14} /> Share Moment
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button className="p-1.5 sm:p-2 text-slate-400 hover:text-orange-600 transition-colors relative">
                    <Bell size={18} className="sm:w-5 sm:h-5" />
                    <span className="absolute top-1 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  </button>
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200 shrink-0">
                      {user?.imageUrl ? (
                        <img src={user?.imageUrl} alt={user?.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={14} className="text-orange-600" />
                      )}
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Disconnect"
                    >
                      <LogOut size={16} className="sm:w-[18px] sm:h-[18px]"/>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                 <a href="/community/login" className="text-[9px] sm:text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors uppercase tracking-widest px-2 sm:px-3 py-2">
                   Sign In
                 </a>
                 <a href="/community/signup" className="text-[9px] sm:text-xs font-bold text-white bg-slate-950 hover:bg-orange-600 transition-colors uppercase tracking-widest px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-xl shadow-lg shadow-slate-200 whitespace-nowrap">
                   Join Hive
                 </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-6 sm:pt-12 pb-20">
        {/* Feed Section - Single Column */}
        <section className="px-0 sm:px-4 max-w-2xl mx-auto w-full">
          {isLoading ? (
            <div className="flex flex-col gap-10">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border-y sm:border sm:border-slate-100 rounded-none sm:rounded-[2rem] overflow-hidden flex flex-col pt-6 animate-pulse">
                   <div className="flex items-center px-6 mb-4 gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100" />
                      <div className="flex flex-col gap-2">
                         <div className="w-24 h-3 bg-slate-100 rounded" />
                         <div className="w-16 h-2bg-slate-100 rounded" />
                      </div>
                   </div>
                   <div className="px-6 mb-4 flex flex-col gap-2">
                       <div className="w-full h-4 bg-slate-100 rounded" />
                       <div className="w-3/4 h-4 bg-slate-100 rounded" />
                   </div>
                   <div className="aspect-[4/3] w-full bg-slate-50" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col gap-10">
              {posts.map((post, idx) => (
                <PostCard key={post.id} post={post} delay={idx * 0.1} />
              ))}
            </div>
          ) : (
            <div className="py-40 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Camera size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">No moments yet</h3>
              <p className="text-slate-400 mt-2">Become the first to share a wholesome moment with the community!</p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Floating Action Button for Mobile - Centered Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] md:hidden px-4 w-full flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShareClick}
          className="bg-white/90 text-slate-950 px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-3 border border-slate-200 backdrop-blur-2xl transition-all duration-300"
        >
          <Camera size={20} className="text-orange-500" />
          <span className="text-[11px] font-black uppercase tracking-widest">Share Moment</span>
          <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center">
             <Plus size={16} className="text-white" />
          </div>
        </motion.button>
      </div>

      <PostMomentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePostSuccess}
      />
    </div>
  );
}

function PostCard({ post, delay }: { post: any; delay: number }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [commentCount, setCommentCount] = useState(post._count?.comments || 0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
     setLikeCount(post._count?.likes || 0);
     setCommentCount(post._count?.comments || 0);
  }, [post._count?.likes, post._count?.comments]);

  useEffect(() => {
     if (post.isLiked !== undefined) {
        setIsLiked(post.isLiked);
     }
  }, [post.isLiked]);

  const fetchComments = async () => {
    if (comments.length > 0) return;
    setIsCommentsLoading(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comment`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {
       toast.error("Failed to load conversation");
    } finally {
       setIsCommentsLoading(false);
    }
  };

  const toggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen);
    if (!isCommentsOpen) fetchComments();
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/community/posts/${post.id}/like`, { 
        method: "POST",
        credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikeCount(data.count);
      }
    } catch {
       toast.error("Failed to sync appreciation");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
        credentials: "include"
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment("");
        setCommentCount((prev: number) => prev + 1);
        toast.success("Moment shared!");
      }
    } catch {
      toast.error("Message delivery failed");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReport = async () => {
     const reason = window.prompt("Reason for reporting this post? (e.g. Inappropriate content, NOT food-related)");
     if (!reason) return;

     try {
       const res = await fetch(`/api/community/posts/${post.id}/report`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ reason }),
         credentials: "include"
       });
       if (res.ok) {
         toast.success("Moment reported for review. Thank you for keeping Hive safe.");
       }
     } catch {
       toast.error("Failed to report");
     }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border-y sm:border sm:border-slate-100 rounded-none sm:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col pt-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-4">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border shadow-sm relative">
               {post.author.imageUrl ? (
                 <Image src={post.author.imageUrl} alt={post.author.name} fill className="object-cover" />
               ) : (
                 <UserIcon size={20} className="text-orange-600" />
               )}
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1">{post.author.name}</h4>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none">{post.author.role}</p>
            </div>
         </div>

         <button 
           onClick={handleReport}
           className="p-2 text-slate-300 hover:text-red-400 transition-colors"
           title="Report misbehavior"
         >
            <Flag size={18} />
         </button>
      </div>

      {/* Caption Content */}
      <div className="px-6 mb-4">
        <p className="text-slate-700 text-base leading-relaxed">
          {post.caption}
        </p>
      </div>

      {/* Uncropped Optimized Image */}
      <div className="relative w-full bg-slate-50 border-y border-slate-50 overflow-hidden cursor-pointer" onClick={handleLike}>
         <Image
            src={post.imageUrl}
            alt={post.caption}
            width={800}
            height={600}
            priority={delay < 0.3}
            className="w-full h-auto object-contain max-h-[70vh] transition-all duration-500 hover:brightness-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
         />
      </div>

      {/* Footer / Actions */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
           <div className="flex items-center gap-4">
              <button 
                onClick={handleLike} 
                className="flex items-center gap-2 hover:text-orange-500 transition-colors cursor-pointer group"
              >
                <div className={`p-2 rounded-full transition-colors ${isLiked ? "bg-orange-50" : "bg-slate-50 group-hover:bg-orange-50"}`}>
                  <Heart size={22} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-orange-500" : "text-slate-400 group-hover:text-orange-500"} />
                </div>
                <span className={`text-sm font-bold ${isLiked ? "text-orange-500" : "text-slate-500"}`}>
                  {likeCount}
                </span>
              </button>

              <button 
                onClick={toggleComments}
                className="flex items-center gap-2 hover:text-orange-500 transition-colors cursor-pointer group"
              >
                <div className={`p-2 rounded-full transition-colors ${isCommentsOpen ? "bg-orange-50" : "bg-slate-50 group-hover:bg-orange-50"}`}>
                  <MessageCircle size={22} className={isCommentsOpen ? "text-orange-500" : "text-slate-400 group-hover:text-orange-500"} />
                </div>
                <span className={`text-sm font-bold ${isCommentsOpen ? "text-orange-500" : "text-slate-500"}`}>{commentCount}</span>
              </button>
           </div>
           
           <button 
             onClick={() => {
               toast.success("Moment link ready to share!");
               navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
             }}
             className="p-2 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 flex items-center gap-2 transition-colors cursor-pointer"
           >
              <Share2 size={20} />
           </button>
        </div>
        
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-4">
           <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
           <button onClick={toggleComments} className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest hover:text-orange-500">
              {isCommentsOpen ? "Close Hive" : "Add comment"} <Send size={12} className={isCommentsOpen ? "rotate-90" : ""} />
           </button>
        </div>
      </div>

      {/* Expanded Instagram-Style Comment Section */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col bg-slate-50/50"
          >
            <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-4">
               {isCommentsLoading ? (
                  <div className="py-10 flex justify-center">
                     <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-orange-500 animate-spin" />
                  </div>
               ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3"
                    >
                       <div className="w-8 h-8 rounded-full bg-white border shrink-0 overflow-hidden relative shadow-sm">
                          {comment.author.imageUrl ? (
                             <Image src={comment.author.imageUrl} alt="U" fill className="object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-slate-300 uppercase">{comment.author.name.charAt(0)}</div>
                          )}
                       </div>
                       <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm shadow-slate-100/50">
                          <div className="flex items-center justify-between mb-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{comment.author.name}</span>
                             <span className="text-[9px] text-slate-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                       </div>
                    </motion.div>
                  ))
               ) : (
                  <div className="py-10 text-center px-10">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No signals yet. Start the conversation!</p>
                  </div>
               )}
            </div>

            {/* Input Fixed at bottom of section */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
               <form onSubmit={handleAddComment} className="flex-1 flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2 hover:bg-slate-100 transition-colors">
                  <input 
                    type="text"
                    placeholder="Message the Hive..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-slate-900 placeholder:text-slate-400 py-1"
                  />
                  <button 
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="p-2 text-orange-600 disabled:text-slate-300 transition-colors"
                  >
                     <Send size={16} />
                  </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
