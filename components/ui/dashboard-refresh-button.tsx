"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardRefreshButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export default function DashboardRefreshButton({
  className,
  disabled,
  label = "Refresh",
  onClick,
  ...props
}: DashboardRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || disabled || isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.location.reload();
      });
    });
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50",
        "disabled:cursor-wait disabled:opacity-60",
        className,
      )}
      disabled={disabled || isRefreshing}
      onClick={handleClick}
      {...props}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      <span>{label}</span>
    </button>
  );
}