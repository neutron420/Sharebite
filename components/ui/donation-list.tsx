'use client';

import React from 'react';
import { format } from 'date-fns';
import { ContactRound } from 'lucide-react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FaBoxOpen, FaClock, FaWeightHanging } from 'react-icons/fa';
import { MdOutlineFastfood } from 'react-icons/md';

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
         className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full border border-slate-100', className)}
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

interface DonationLineProps {
   donation: any;
}

function DonationLine({ donation }: DonationLineProps) {
   const statusInfo = statusColors[donation.status] || statusColors['AVAILABLE'];
   const StatusIcon = statusInfo.icon;

   return (
      <div className="w-full flex items-center py-4 px-6 border-b hover:bg-slate-50 border-slate-100 text-sm last:border-b-0 cursor-pointer transition-colors bg-white">
         <div className="flex-grow flex items-center gap-4 overflow-hidden">
            <div className="relative">
               <Avatar>
                  {donation.imageUrl ? (
                     <AvatarImage src={donation.imageUrl} alt={donation.title} />
                  ) : (
                     <AvatarFallback><MdOutlineFastfood className="w-5 h-5 text-slate-300" /></AvatarFallback>
                  )}
               </Avatar>
               <span
                  className="border-white absolute -end-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px]"
                  style={{ backgroundColor: statusInfo.color }}
               ></span>
            </div>
            <div className="flex flex-col items-start overflow-hidden pt-1">
               <span className="font-black text-slate-900 truncate w-full tracking-tight">{donation.title}</span>
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate w-full flex gap-1 items-center mt-0.5">
                  {donation.category} 
               </span>
            </div>
         </div>

         <div className="w-40 flex shrink-0 items-center justify-start gap-2 text-xs font-bold text-slate-600">
            <StatusIcon />
            <span style={{ color: statusInfo.color }} className="font-black uppercase tracking-widest text-[9px]">{donation.status}</span>
         </div>
         
         <div className="w-32 shrink-0 flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <FaBoxOpen className="text-slate-300" />
            <span className="text-[10px] uppercase tracking-wider">{donation.quantity} units</span>
         </div>

         <div className="w-32 shrink-0 flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <FaWeightHanging className="text-slate-300" />
            <span className="text-[10px] uppercase tracking-wider">{donation.weight || 0} kg</span>
         </div>

         <div className="w-40 shrink-0 flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <FaClock className="text-orange-300" />
            <span className="text-[10px] uppercase tracking-wider">{format(new Date(donation.expiryTime), 'MMM dd, HH:mm')}</span>
         </div>
      </div>
   );
}

interface DonationListProps extends React.HTMLAttributes<HTMLDivElement> {
   donations: any[];
}

const DonationList = React.forwardRef<HTMLDivElement, DonationListProps>(({ donations, className, ...props }, ref) => (
   <div
      ref={ref}
      className={cn(
         'w-full h-full bg-white text-slate-900 transition-colors duration-300 border border-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50',
         className
      )}
      {...props}
   >
      <div className="bg-slate-50/50 px-6 py-3 text-[10px] uppercase tracking-widest font-black flex items-center text-slate-400 border-b border-slate-100 sticky top-0 z-10">
         <div className="flex-grow pl-14">Donation Details</div>
         <div className="w-40 shrink-0">Current Status</div>
         <div className="w-32 shrink-0">Count</div>
         <div className="w-32 shrink-0">Weight</div>
         <div className="w-40 shrink-0">Expires At</div>
      </div>
      <div className="w-full flex flex-col divide-y divide-slate-50">
         {donations.length > 0 ? (
            donations.map((d) => (
               <DonationLine key={d.id} donation={d} />
            ))
         ) : (
            <div className="py-20 text-center flex flex-col items-center border-b-0">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <ContactRound className="w-8 h-8" />
               </div>
               <p className="text-slate-500 font-bold text-sm">No logistics logged yet.</p>
            </div>
         )}
      </div>
   </div>
));
DonationList.displayName = 'DonationList';

export default DonationList;
