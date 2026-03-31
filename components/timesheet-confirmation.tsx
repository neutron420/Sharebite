"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming shadcn button is in this path
import { Separator } from "@/components/ui/separator"; // Assuming shadcn separator
import { cn } from "@/lib/utils"; // Assuming shadcn utility

// --- TYPE DEFINITIONS ---
interface TimeEntry {
  date: string;
  duration: string;
}

interface FinancialDetail {
  label: string;
  value: number;
  isCommission?: boolean;
}

interface TimesheetConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  taskName: string;
  timeEntries: TimeEntry[];
  financials: FinancialDetail[];
  totalHours: string;
  takeHomeAmount: number;
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  actionNode?: React.ReactNode;
}


// --- CURRENCY FORMATTER ---
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

// --- MAIN COMPONENT ---
export function TimesheetConfirmation({
  isOpen,
  onClose,
  clientName,
  taskName,
  timeEntries = [],
  financials = [],
  totalHours,
  takeHomeAmount,
  className,
  actionLabel = "Claim Rewards",
  onAction,
  showAction = true,
  actionNode,
}: TimesheetConfirmationProps) {
  const [dismissedKey, setDismissedKey] = React.useState<string | null>(null);
  const [isActing, setIsActing] = React.useState(false);

  const modalKey = React.useMemo(
    () => `${clientName}::${taskName}::${takeHomeAmount}`,
    [clientName, taskName, takeHomeAmount]
  );

  React.useEffect(() => {
    if (dismissedKey && dismissedKey !== modalKey) {
      setDismissedKey(null);
    }
  }, [dismissedKey, modalKey]);

  const handleClose = React.useCallback(() => {
    setDismissedKey(modalKey);
    onClose();
  }, [modalKey, onClose]);

  const handleAction = React.useCallback(async () => {
    if (isActing) return;
    setIsActing(true);
    handleClose();

    if (onAction) {
      try {
        await onAction();
      } finally {
        setIsActing(false);
      }
      return;
    }

    setIsActing(false);
  }, [handleClose, isActing, onAction]);

  return (
    <AnimatePresence>
      {isOpen && dismissedKey !== modalKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "relative m-4 w-full max-w-4xl overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg",
              className
            )}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Panel: Confirmation */}
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center bg-background/50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, transition: { delay: 0.2, type: "spring", stiffness: 200, damping: 15 } }}
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </motion.div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Mission Verified</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  The rider secured the perimeter and delivered the food. Release their bounty to conclude the grid log.
                </p>

                <div className="mt-4 flex flex-col w-full max-w-xs gap-2">
                  {actionNode ? (
                    actionNode
                  ) : showAction ? (
                    <Button 
                      onClick={handleAction}
                      disabled={isActing}
                      size="lg" 
                      className="bg-slate-950 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest py-6 rounded-2xl shadow-xl shadow-slate-200"
                    >
                      {actionLabel}
                    </Button>
                  ) : null}
                  <Button onClick={handleClose} variant="ghost" className="font-black uppercase text-[10px] tracking-widest text-slate-400">Archive Log</Button>
                </div>

              </div>

              {/* Right Panel: Summary */}
              <div className="relative p-8">
                <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={handleClose}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
                <h3 className="text-xl font-black italic uppercase tracking-tight mb-6 underline decoration-orange-600/20 underline-offset-8">Mission Summary</h3>
                
                {/* Client & Task Details */}
                <div className="space-y-4 text-xs font-black uppercase tracking-widest">
                  <div>
                    <p className="text-slate-400 mb-1">Rendezvous NGO</p>
                    <p className="text-slate-900">{clientName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Cargo Details</p>
                    <p className="text-slate-900">{taskName}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Time Entries */}
                <div className="space-y-3">
                  {timeEntries.map((entry, index) => (
                    <motion.div
                      key={index}
                      className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + index * 0.1 } }}
                    >
                      <p className="text-muted-foreground">{entry.date}</p>
                      <p className="font-mono">{entry.duration}</p>
                    </motion.div>
                  ))}
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest pt-2">
                    <p>Total Points</p>
                    <p className="font-mono">{totalHours}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Financial Summary */}
                <div className="space-y-3 text-sm">
                  {financials.map((item, index) => (
                    <motion.div
                      key={index}
                      className={`flex justify-between items-center text-[10px] font-black uppercase tracking-widest ${item.isCommission ? "text-orange-600" : ""}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.5 + index * 0.1 } }}
                    >
                      <p>{item.label}</p>
                      <p className="font-mono">{item.isCommission ? "-" : ""}{currencyFormatter.format(item.value)}</p>
                    </motion.div>
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.8 } }}
                >
                  <p className="font-black uppercase tracking-widest text-xs">Total Earnings</p>
                  <p className="text-3xl font-black text-orange-600 italic tracking-tighter">{currencyFormatter.format(takeHomeAmount)}</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
