import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[2rem] border border-slate-100 bg-white/95 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.18)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 px-6 pt-6 pb-0", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 pb-6 pt-4", className)}
      {...props}
    />
  ),
);
CardBody.displayName = "CardBody";

export { Card, CardHeader, CardBody };
