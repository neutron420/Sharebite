"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Search, 
  RefreshCw, 
  MessageSquare, 
  Heart, 
  Trash2, 
  Eye, 
  Calendar, 
  User,
  X,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface CommunityPost {
  id: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    imageUrl: string;
  };
  likes: {
    id: string;
    user: {
      id: string;
      name: string;
      imageUrl: string;
    };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      imageUrl: string;
    };
  }[];
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/community-posts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      setPosts(await res.json());
    } catch (err) {
      toast.error("Failed to load community feed audit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this community moment?")) return;
    
    setIsDeleting(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Post removed from Hive");
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (detailPost?.id === postId) setDetailPost(null);
      }
    } catch {
      toast.error("Deletion failed");
    } finally {
      setIsDeleting(null);
    }
  };

  const filtered = posts.filter(p => 
    p.caption.toLowerCase().includes(search.toLowerCase()) || 
    p.author.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
       <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full shadow-lg" />
       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Global Feed...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><LayoutGrid size={20} /></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Content Feed Audit</h1>
           </div>
           <p className="text-slate-500 text-sm">Managing {posts.length} moments currently active in the community hive</p>
        </div>
        <button 
           onClick={fetchPosts} 
           className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 hover:bg-slate-50 flex items-center gap-3 font-black text-sm transition-all active:scale-95 shadow-sm"
        >
           <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh Feed
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
         <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search feed by captions, keywords or authors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border-none rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-semibold"
            />
         </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filtered.map((post) => (
           <motion.div 
             key={post.id}
             layoutId={post.id}
             className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
           >
              {/* Image Preview */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                 <Image 
                   src={post.imageUrl} 
                   alt="P" 
                   fill 
                   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                   className="object-cover transition-transform duration-700 group-hover:scale-110" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                 
                 <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden relative border border-white/40 bg-slate-800">
                           {post.author.imageUrl ? (
                             <Image 
                               src={post.author.imageUrl} 
                               fill 
                               sizes="20px"
                               alt="A" 
                               className="object-cover" 
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white">{post.author.name.charAt(0)}</div>
                           )}
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[80px]">{post.author.name}</span>
                    </div>
                    <button 
                       onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                       className="p-3 bg-red-500 text-white rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    >
                       <Trash2 size={18} />
                    </button>
                 </div>

                 <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white font-bold text-sm line-clamp-2 leading-tight">"{post.caption}"</p>
                 </div>
              </div>

              {/* Quick Stats Overlay (Table Style below image) */}
              <div className="p-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-red-500 transition-colors">
                       <Heart size={16} className={post.likes.length > 0 ? "fill-current" : ""} />
                       <span className="text-xs font-black">{post.likes.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                       <MessageSquare size={16} />
                       <span className="text-xs font-black">{post.comments.length}</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setDetailPost(post)}
                   className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                 >
                    Inspect <Eye size={14} />
                 </button>
              </div>
           </motion.div>
         ))}

         {filtered.length === 0 && (
           <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No hive content matches your search</p>
           </div>
         )}
      </div>

      {/* ── Deep Inspection Modal ── */}
      <AnimatePresence>
        {detailPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" 
               onClick={() => setDetailPost(null)} 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative bg-white max-w-5xl w-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh]"
             >
                {/* Visual Side */}
                <div className="relative w-full md:w-[45%] h-64 md:h-full bg-slate-900">
                   <Image 
                     src={detailPost.imageUrl} 
                     alt="P" 
                     fill 
                     sizes="(max-width: 768px) 100vw, 45vw"
                     className="object-cover border-r border-slate-100" 
                   />
                   <div className="absolute top-6 left-6 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-white">
                      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Posted On</p>
                      <p className="text-sm font-bold flex items-center gap-2"><Calendar size={14} /> {formatDate(detailPost.createdAt)}</p>
                   </div>

                   <div className="absolute bottom-6 left-6 right-6">
                      <div className="p-6 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[2rem]">
                         <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest block mb-2">Original Caption</span>
                         <p className="text-white font-medium italic leading-relaxed">"{detailPost.caption}"</p>
                      </div>
                   </div>
                </div>

                {/* Audit Side */}
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-slate-100 border relative overflow-hidden">
                            {detailPost.author.imageUrl ? (
                               <Image 
                                 src={detailPost.author.imageUrl} 
                                 fill 
                                 sizes="48px"
                                 alt="A" 
                                 className="object-cover" 
                               />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center font-black text-slate-400 uppercase">{detailPost.author.name.charAt(0)}</div>
                            )}
                         </div>
                         <div>
                            <h2 className="text-lg font-black text-slate-900">{detailPost.author.name}</h2>
                            <p className="text-xs text-orange-600 font-bold uppercase tracking-tight flex items-center gap-2">
                               {detailPost.author.role} <span className="w-1 h-1 bg-slate-300 rounded-full" /> {detailPost.author.email}
                            </p>
                         </div>
                      </div>
                      <button onClick={() => setDetailPost(null)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><X size={24} /></button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      {/* Likes Context */}
                      <section>
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-red-50 text-red-500 rounded-xl"><Heart size={18} className="fill-current" /></div>
                               <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Heart Manifest {detailPost.likes.length}</h3>
                            </div>
                            <TrendingUp size={16} className="text-slate-300" />
                         </div>
                         <div className="flex flex-wrap gap-3">
                            {detailPost.likes.map((like) => (
                               <div key={like.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl group transition-all hover:bg-red-50 hover:border-red-100">
                                  <div className="w-5 h-5 rounded-full overflow-hidden relative ring-2 ring-white bg-white">
                                     {like.user.imageUrl ? (
                                       <Image 
                                         src={like.user.imageUrl} 
                                         fill 
                                         sizes="20px"
                                         alt="A" 
                                         className="object-cover" 
                                       />
                                     ) : (
                                       <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400">{like.user.name.charAt(0)}</div>
                                     )}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-red-700">{like.user.name}</span>
                               </div>
                            ))}
                            {detailPost.likes.length === 0 && <p className="text-xs text-slate-400 italic">This moment hasn't received appreciation yet.</p>}
                         </div>
                      </section>

                      {/* Comments Thread */}
                      <section>
                         <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><MessageSquare size={18} /></div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Dialogue Thread {detailPost.comments.length}</h3>
                         </div>
                         <div className="space-y-4">
                             {detailPost.comments.map((comment) => (
                               <div key={comment.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100">
                                  <div className="flex items-center justify-between mb-3">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg overflow-hidden relative bg-white">
                                           {comment.author.imageUrl ? (
                                             <Image 
                                               src={comment.author.imageUrl} 
                                               fill 
                                               sizes="24px"
                                               alt="A" 
                                               className="object-cover" 
                                             />
                                           ) : (
                                             <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">{comment.author.name.charAt(0)}</div>
                                           )}
                                        </div>
                                        <span className="text-xs font-black text-slate-900">{comment.author.name}</span>
                                     </div>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatDate(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-900">"{comment.content}"</p>
                               </div>
                            ))}
                            {detailPost.comments.length === 0 && (
                               <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                  <p className="text-xs text-slate-400 font-bold">No active discussion on this moment.</p>
                               </div>
                            )}
                         </div>
                      </section>
                   </div>

                   <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                      <button 
                        onClick={() => handleDelete(detailPost.id)}
                        className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                         <Trash2 size={18} /> Permanently Delete
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
