'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
   ContactRound, 
   ChevronDown, 
   ChevronUp, 
   MapPin, 
   Calendar, 
   Clock, 
   ImageIcon, 
   Package, 
   User, 
   CheckCircle2, 
   ArrowRight,
   AlertCircle,
   Camera,
   Building2,
   History,
   UtensilsCrossed,
   TrendingUp,
   Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FaBoxOpen, FaClock, FaWeightHanging } from 'react-icons/fa';
import { MdOutlineFastfood } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

const BacklogIcon: React.FC = () => {
   return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
         <circle cx="7" cy="7" r="6" fill="none" stroke="#bec2c8" strokeWidth="2" strokeDasharray="1.4 1.74" strokeDashoffset="0.65" />
      </svg>
   );
};

const InProgressIcon: React.FC = () => {
   return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
         <circle cx="7" cy="7" r="6" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="3.14 0" strokeDashoffset="-0.7" />
         <circle cx="7" cy="7" r="2" fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="2.083923 100" transform="rotate(-90 7 7)" />
      </svg>
   );
};

const CompletedIcon: React.FC = ({ color = "#22c55e" }: { color?: string }) => {
   return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
         <circle cx="7" cy="7" r="6" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3.14 0" strokeDashoffset="-0.7" />
         <path d="M4.5 7L6.5 9L9.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   );
};

export const statusColors: any = {
   AVAILABLE: { color: '#facc15', icon: InProgressIcon, label: 'Available' },
   REQUESTED: { color: '#0ea5e9', icon: InProgressIcon, label: 'Requested' },
   RESERVED: { color: '#f97316', icon: InProgressIcon, label: 'Reserved' },
   PICKED_UP: { color: '#22c55e', icon: InProgressIcon, label: 'Picked Up' },
   DELIVERED: { color: '#22c55e', icon: CompletedIcon, label: 'Delivered' },
   COMPLETED: { color: '#22c55e', icon: CompletedIcon, label: 'Completed' },
   CANCELLED: { color: '#ec4899', icon: BacklogIcon, label: 'Cancelled' },
   EXPIRED: { color: '#ef4444', icon: BacklogIcon, label: 'Expired' },
};

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
   return (
      <AvatarPrimitive.Root
         data-slot="avatar"
         className={cn('relative flex size-12 shrink-0 overflow-hidden rounded-full border border-slate-100', className)}
         {...props}
      />
   );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
   return (
      <AvatarPrimitive.Image
         data-slot="avatar-image"
         className={cn('aspect-square size-full object-cover', className)}
         {...props}
      />
   );
}

function AvatarFallback({
   className,
   ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
   return (
      <AvatarPrimitive.Fallback
         data-slot="avatar-fallback"
         className={cn(
            'bg-slate-50 flex size-full items-center justify-center rounded-full text-slate-400',
            className
         )}
         {...props}
      />
   );
}

interface DonationListProps extends React.HTMLAttributes<HTMLDivElement> {
   donations: any[];
   onDelete?: (id: string) => void;
}

const DonationList = React.forwardRef<HTMLDivElement, DonationListProps>(({ donations, className, onDelete, ...props }, ref) => {
   const [expandedId, setExpandedId] = useState<string | null>(null);

   const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
   };

   return (
      <div
         ref={ref}
         className={cn(
            'w-full bg-white text-slate-900 transition-colors duration-300 border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50',
            className
         )}
         {...props}
      >
         <Table>
            <TableHeader className="bg-slate-50/50">
               <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="pl-6 py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Donation Details</TableHead>
                  <TableHead className="py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Current Status</TableHead>
                  <TableHead className="hidden sm:table-cell py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Count</TableHead>
                  <TableHead className="hidden md:table-cell py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Weight</TableHead>
                  <TableHead className="hidden lg:table-cell py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Expires At</TableHead>
                  <TableHead className="pr-6 py-5 text-[10px] uppercase tracking-widest font-black text-slate-400 w-[50px]"></TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {donations.length > 0 ? (
                  donations.map((d) => {
                     const statusInfo = statusColors[d.status] || statusColors['AVAILABLE'];
                     const StatusIcon = statusInfo.icon;
                     const isExpanded = expandedId === d.id;
                     
                     // Find active request
                     const activeRequest = d.requests?.find((r: any) => 
                        ['COMPLETED', 'ON_THE_WAY', 'PICKED_UP', 'APPROVED'].includes(r.status)
                     ) || d.requests?.[0];

                     return (
                        <React.Fragment key={d.id}>
                           <TableRow 
                              onClick={() => toggleExpand(d.id)}
                              className={cn(
                                 "cursor-pointer group hover:bg-slate-50 border-b border-slate-50 transition-colors",
                                 isExpanded ? "bg-slate-50/80" : ""
                              )}
                           >
                              <TableCell className="pl-6 py-6">
                                 <div className="flex items-center gap-5">
                                    <div className="relative">
                                       <Avatar>
                                          {d.imageUrl ? (
                                             <AvatarImage src={d.imageUrl} alt={d.title} />
                                          ) : (
                                             <AvatarFallback><MdOutlineFastfood className="w-5 h-5 text-slate-300" /></AvatarFallback>
                                          )}
                                       </Avatar>
                                       <span
                                          className="border-white absolute -end-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px]"
                                          style={{ backgroundColor: statusInfo.color }}
                                       ></span>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="font-bold text-lg text-slate-950 tracking-tight leading-tight mb-0.5">{d.title}</span>
                                       <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{d.category}</span>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="py-6">
                                 <div className="flex items-center gap-2">
                                    <StatusIcon color={statusInfo.color} />
                                    <span style={{ color: statusInfo.color }} className="font-black uppercase tracking-wider text-[11px]">{d.status}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell py-6 font-bold text-slate-600">
                                 <div className="flex items-center gap-2">
                                    <UtensilsCrossed size={14} className="text-slate-300" />
                                    <span>{d.quantity} Units</span>
                                 </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell py-6 font-bold text-slate-600">
                                 <div className="flex items-center gap-2">
                                    <TrendingUp size={14} className="text-slate-300" />
                                    <span>{d.weight || 0} kg</span>
                                 </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell py-6 font-bold text-slate-400">
                                 <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tighter">
                                    <Calendar size={14} className="text-orange-300" />
                                    <span>{format(new Date(d.expiryTime), 'MMM dd, HH:mm')}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="pr-6 py-6 text-right">
                                 <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                                    {isExpanded ? (
                                       <ChevronUp className="w-4 h-4 text-slate-400" />
                                    ) : (
                                       <ChevronDown className="w-4 h-4 text-slate-400" />
                                    )}
                                 </div>
                              </TableCell>
                           </TableRow>
                           
                           <AnimatePresence>
                              {isExpanded && (
                                 <TableRow className="hover:bg-transparent border-0">
                                    <TableCell colSpan={6} className="p-0 border-0 overflow-hidden">
                                       <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                          className="bg-white"
                                       >
                                          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-0 border-b border-slate-100">
                                             {/* Analysis Briefing */}
                                             <div className="p-6 md:p-12 border-r border-slate-100 flex flex-col gap-8">
                                                <div className="space-y-4">
                                                   <div className="flex items-center justify-between">
                                                      <h3 className="text-2xl font-black tracking-tight text-slate-950 uppercase italic underline decoration-orange-600/10">Mission Analysis</h3>
                                                      <Badge className={cn("px-4 py-1 font-black text-[10px] uppercase tracking-widest shadow-lg", d.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100")}>
                                                         {d.status}
                                                      </Badge>
                                                   </div>
                                                   <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                                                      &quot;{d.description || "No tactical briefing provided for this share."}&quot;
                                                   </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                                         <MapPin className="w-3 h-3 text-orange-500" /> Location Sector
                                                      </p>
                                                      <p className="text-sm font-bold text-slate-800">{d.pickupLocation}</p>
                                                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight mt-1">{d.city}, {d.state}</p>
                                                   </div>
                                                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                                         <Calendar className="w-3 h-3 text-emerald-500" /> Created Log
                                                      </p>
                                                      <p className="text-sm font-bold text-slate-800">{format(new Date(d.createdAt), 'MMM dd, yyyy')}</p>
                                                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight mt-1">{format(new Date(d.createdAt), 'HH:mm')} Zulu</p>
                                                   </div>
                                                </div>

                                                {activeRequest && (
                                                   <div className="space-y-4 pt-4">
                                                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                         <History className="w-3.5 h-3.5" /> Logistical Chain
                                                      </h4>
                                                      <div className="space-y-3">
                                                         <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                               <Building2 size={18} />
                                                            </div>
                                                            <div className="flex-1">
                                                               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recipient NGO</p>
                                                               <p className="text-xs font-bold text-slate-900 truncate">{activeRequest.ngo.name}</p>
                                                            </div>
                                                         </div>
                                                         {activeRequest.rider && (
                                                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                                  <User size={18} />
                                                               </div>
                                                               <div className="flex-1">
                                                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Designated Rider</p>
                                                                  <p className="text-xs font-bold text-slate-900 truncate">{activeRequest.rider.name}</p>
                                                               </div>
                                                            </div>
                                                         )}
                                                      </div>
                                                   </div>
                                                )}

                                                {/* Community Feedback Section */}
                                                {d.reviews && d.reviews.length > 0 && (
                                                   <div className="space-y-4 pt-4 mt-2 border-t border-slate-50">
                                                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                                         <CheckCircle2 className="w-3.5 h-3.5" /> Community Feedback
                                                      </h4>
                                                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl shadow-sm italic relative overflow-hidden group/review">
                                                         <div className="flex items-center gap-1 mb-2">
                                                            {[...Array(5)].map((_, index) => (
                                                               <svg 
                                                                  key={index}
                                                                  className={cn("w-3 h-3 transition-colors", index < d.reviews[0].rating ? "text-amber-400 fill-current" : "text-slate-300")}
                                                                  viewBox="0 0 24 24" 
                                                                  fill="none" 
                                                                  stroke="currentColor" 
                                                                  strokeWidth="2" 
                                                                  strokeLinecap="round" 
                                                                  strokeLinejoin="round" 
                                                               >
                                                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                               </svg>
                                                            ))}
                                                            <span className="text-[10px] font-black text-emerald-700 ml-2 uppercase tracking-widest">{d.reviews[0].rating}.0 Sector Rating</span>
                                                         </div>
                                                         <p className="text-xs font-bold text-slate-800 leading-relaxed">&quot;{d.reviews[0].comment}&quot;</p>
                                                         <div className="mt-3 flex items-center gap-2 pb-1">
                                                            <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-[7px] font-black text-emerald-800 shrink-0 capitalize shadow-sm">
                                                               {d.reviews[0].reviewer?.name?.[0] || 'R'}
                                                            </div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Validated by {d.reviews[0].reviewer?.role} ({d.reviews[0].reviewer?.name})</p>
                                                         </div>
                                                      </div>
                                                   </div>
                                                )}

                                                {/* Deletion Option */}
                                                <div className="pt-6 mt-4 border-t border-slate-50 flex justify-end">
                                                   <button 
                                                      onClick={(e) => {
                                                         e.stopPropagation();
                                                         if(onDelete && window.confirm("Are you sure you want to permanently delete this mission record? This cannot be undone.")) {
                                                            onDelete(d.id);
                                                         }
                                                      }}
                                                      className="group flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                   >
                                                      <Trash2 className="w-3.5 h-3.5" /> Purge Mission Data
                                                   </button>
                                                </div>
                                             </div>

                                             {/* Visual Intelligence Grid */}
                                             <div className="bg-slate-50/50 p-6 md:p-12 flex flex-col gap-6 items-center justify-center">
                                                <div className="w-full space-y-6 max-w-sm">
                                                   <div className="space-y-3">
                                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                         <ImageIcon className="w-3.5 h-3.5" /> Food Intelligence
                                                      </p>
                                                      <div className="aspect-[4/3] rounded-[2rem] bg-white border-2 border-slate-100 overflow-hidden shadow-xl ring-8 ring-white/50">
                                                         {d.imageUrl ? (
                                                            <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                                                         ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                                                               <ImageIcon size={48} strokeWidth={1} />
                                                               <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No Image Link</p>
                                                            </div>
                                                         )}
                                                      </div>
                                                   </div>

                                                   {activeRequest?.deliveryImageUrl && (
                                                      <motion.div 
                                                         initial={{ y: 20, opacity: 0 }}
                                                         animate={{ y: 0, opacity: 1 }}
                                                         className="space-y-3"
                                                      >
                                                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                                            <Camera className="w-3.5 h-3.5" /> Delivery Proof Captured
                                                         </p>
                                                         <div className="aspect-video rounded-[1.5rem] bg-white border-2 border-emerald-100 overflow-hidden shadow-lg shadow-emerald-50 ring-4 ring-emerald-50">
                                                            <img src={activeRequest.deliveryImageUrl} alt="Proof" className="w-full h-full object-cover" />
                                                         </div>
                                                         <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Handover Verified Successfully</p>
                                                         </div>
                                                      </motion.div>
                                                   )}

                                                   {d.status === 'AVAILABLE' && (
                                                      <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm italic">
                                                         <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                                         <p className="text-[11px] font-bold text-orange-800 leading-tight">Waiting for a verified NGO to intercept this share. Signal is currently broadcasting.</p>
                                                      </div>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       </motion.div>
                                    </TableCell>
                                 </TableRow>
                              )}
                           </AnimatePresence>
                        </React.Fragment>
                     );
                  })
               ) : (
                  <TableRow>
                     <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                              <ContactRound className="w-10 h-10" />
                           </div>
                           <p className="text-slate-400 font-bold text-sm tracking-tight capitalize">No missions logged in this frequency.</p>
                        </div>
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
         </Table>
      </div>
   );
});

DonationList.displayName = 'DonationList';

export default DonationList;
