'use client';

import React from 'react';
import { format } from 'date-fns';
import { ContactRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FaBoxOpen, FaClock, FaWeightHanging } from 'react-icons/fa';
import { MdOutlineFastfood } from 'react-icons/md';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const CompletedIcon: React.FC = () => {
   return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
         <circle cx="7" cy="7" r="6" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3.14 0" strokeDashoffset="-0.7" />
         <path d="M4.5 7L6.5 9L9.5 5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   );
};

export const statusColors: any = {
   AVAILABLE: { color: '#facc15', icon: InProgressIcon },
   REQUESTED: { color: '#0ea5e9', icon: InProgressIcon },
   RESERVED: { color: '#f97316', icon: InProgressIcon },
   PICKED_UP: { color: '#22c55e', icon: InProgressIcon },
   DELIVERED: { color: '#8b5cf6', icon: CompletedIcon },
   COMPLETED: { color: '#8b5cf6', icon: CompletedIcon },
   CANCELLED: { color: '#ec4899', icon: BacklogIcon },
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
}

const DonationList = React.forwardRef<HTMLDivElement, DonationListProps>(({ donations, className, ...props }, ref) => {
   const router = useRouter();

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
                  <TableHead className="pl-8 py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Donation Details</TableHead>
                  <TableHead className="py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Current Status</TableHead>
                  <TableHead className="py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Count</TableHead>
                  <TableHead className="py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Weight</TableHead>
                  <TableHead className="pr-8 py-5 text-[10px] uppercase tracking-widest font-black text-slate-400">Expires At</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {donations.length > 0 ? (
                  donations.map((d) => {
                     const statusInfo = statusColors[d.status] || statusColors['AVAILABLE'];
                     const StatusIcon = statusInfo.icon;
                     
                     return (
                        <TableRow 
                           key={d.id} 
                           onClick={() => router.push(`/donor/donations/${d.id}`)}
                           className="cursor-pointer group hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                           <TableCell className="pl-8 py-6">
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
                                 <StatusIcon />
                                 <span style={{ color: statusInfo.color }} className="font-black uppercase tracking-wider text-[11px]">{d.status}</span>
                              </div>
                           </TableCell>
                           <TableCell className="py-6">
                              <div className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest">
                                 <FaBoxOpen className="text-slate-300 w-4 h-4" />
                                 <span>{d.quantity} Units</span>
                              </div>
                           </TableCell>
                           <TableCell className="py-6">
                              <div className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest">
                                 <FaWeightHanging className="text-slate-300 w-4 h-4" />
                                 <span>{d.weight || 0} Kg</span>
                              </div>
                           </TableCell>
                           <TableCell className="pr-8 py-6">
                              <div className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest">
                                 <FaClock className="text-orange-300 w-4 h-4" />
                                 <span>{format(new Date(d.expiryTime), 'MMM dd, HH:mm')}</span>
                              </div>
                           </TableCell>
                        </TableRow>
                     );
                  })
               ) : (
                  <TableRow>
                     <TableCell colSpan={5} className="h-64 text-center">
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
