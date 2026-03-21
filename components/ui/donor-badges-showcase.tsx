"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiClock,
  FiGift,
  FiLayers,
  FiLock,
  FiStar,
  FiTrendingUp,
  FiX,
  FiZap,
} from "react-icons/fi";
import {
  FaAward,
  FaBuilding,
  FaCalendarCheck,
  FaCheckCircle,
  FaCrown,
  FaFire,
  FaGem,
  FaGraduationCap,
  FaHandshake,
  FaHeart,
  FaLeaf,
  FaMedal,
  FaMoon,
  FaPalette,
  FaShieldAlt,
  FaSun,
} from "react-icons/fa";

type BadgeRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
type BadgeCategory = "MILESTONE" | "IMPACT" | "CONSISTENCY" | "SPECIALTY" | "LEGACY";
type BadgePalette =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "SAPPHIRE"
  | "RUBY"
  | "AMETHYST"
  | "SUNSET"
  | "TEAL";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

interface BadgeSystemData {
  karmaPoints: number;
  level: number;
  levelProgress: number;
  totalBadges: number;
  earnedCount: number;
  badges: BadgeData[];
}

type BadgeView = BadgeData & {
  rarity: BadgeRarity;
  category: BadgeCategory;
  palette: BadgePalette;
  icon: IconType;
};

const RARITY_LABELS: Record<BadgeRarity, string> = {
  COMMON: "Bronze",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  MILESTONE: "Milestones",
  IMPACT: "Impact",
  CONSISTENCY: "Consistency",
  SPECIALTY: "Food Style",
  LEGACY: "Legacy",
};

const CATEGORY_ICONS: Record<BadgeCategory, IconType> = {
  MILESTONE: FiAward,
  IMPACT: FiGift,
  CONSISTENCY: FiZap,
  SPECIALTY: FiLayers,
  LEGACY: FiStar,
};

const RARITY_STYLES: Record<
  BadgeRarity,
  {
    card: string;
    accent: string;
    outline: string;
    pill: string;
    text: string;
    dot: string;
    shadow: string;
    stopA: string;
    stopB: string;
    stopC: string;
    fillA: string;
    fillB: string;
    icon: string;
  }
> = {
  COMMON: {
    card: "from-amber-50 via-white to-orange-50",
    accent: "from-amber-500 via-orange-500 to-amber-700",
    outline: "border-amber-200/80",
    pill: "bg-amber-100 text-amber-800",
    text: "text-amber-700",
    dot: "bg-amber-500",
    shadow: "shadow-amber-100/80",
    stopA: "#a16207",
    stopB: "#f59e0b",
    stopC: "#b45309",
    fillA: "#fffaf0",
    fillB: "#fef3c7",
    icon: "text-amber-700",
  },
  UNCOMMON: {
    card: "from-emerald-50 via-white to-green-50",
    accent: "from-emerald-500 via-green-400 to-emerald-600",
    outline: "border-emerald-200/80",
    pill: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    shadow: "shadow-emerald-100/80",
    stopA: "#059669",
    stopB: "#34d399",
    stopC: "#10b981",
    fillA: "#f7fffb",
    fillB: "#d1fae5",
    icon: "text-emerald-700",
  },
  RARE: {
    card: "from-blue-50 via-white to-sky-50",
    accent: "from-blue-500 via-sky-400 to-blue-600",
    outline: "border-blue-200/80",
    pill: "bg-blue-100 text-blue-800",
    text: "text-blue-700",
    dot: "bg-blue-500",
    shadow: "shadow-blue-100/80",
    stopA: "#2563eb",
    stopB: "#60a5fa",
    stopC: "#1d4ed8",
    fillA: "#f8fbff",
    fillB: "#dbeafe",
    icon: "text-blue-700",
  },
  EPIC: {
    card: "from-fuchsia-50 via-white to-violet-50",
    accent: "from-fuchsia-500 via-violet-500 to-purple-600",
    outline: "border-violet-200/80",
    pill: "bg-violet-100 text-violet-800",
    text: "text-violet-700",
    dot: "bg-violet-500",
    shadow: "shadow-violet-100/80",
    stopA: "#7c3aed",
    stopB: "#a855f7",
    stopC: "#9333ea",
    fillA: "#fbf8ff",
    fillB: "#ede9fe",
    icon: "text-violet-700",
  },
  LEGENDARY: {
    card: "from-amber-50 via-yellow-50 to-orange-50",
    accent: "from-amber-400 via-orange-500 to-yellow-500",
    outline: "border-amber-300/80",
    pill: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800",
    text: "text-amber-700",
    dot: "bg-yellow-500",
    shadow: "shadow-amber-200/80",
    stopA: "#f59e0b",
    stopB: "#fbbf24",
    stopC: "#f97316",
    fillA: "#fffdf5",
    fillB: "#fef3c7",
    icon: "text-amber-700",
  },
};

const PALETTE_STYLES: Record<
  BadgePalette,
  {
    card: string;
    accent: string;
    outline: string;
    pill: string;
    text: string;
    dot: string;
    shadow: string;
    stopA: string;
    stopB: string;
    stopC: string;
    fillA: string;
    fillB: string;
    icon: string;
  }
> = {
  BRONZE: {
    card: "from-amber-50 via-white to-orange-50",
    accent: "from-amber-700 via-orange-500 to-amber-700",
    outline: "border-amber-200/80",
    pill: "bg-amber-100 text-amber-800",
    text: "text-amber-700",
    dot: "bg-amber-500",
    shadow: "shadow-amber-100/80",
    stopA: "#92400e",
    stopB: "#f59e0b",
    stopC: "#b45309",
    fillA: "#fffaf2",
    fillB: "#fef3c7",
    icon: "text-amber-700",
  },
  SILVER: {
    card: "from-slate-50 via-white to-zinc-100",
    accent: "from-slate-400 via-zinc-300 to-slate-500",
    outline: "border-slate-200/90",
    pill: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    dot: "bg-slate-400",
    shadow: "shadow-slate-100/90",
    stopA: "#94a3b8",
    stopB: "#d4d4d8",
    stopC: "#64748b",
    fillA: "#ffffff",
    fillB: "#f1f5f9",
    icon: "text-slate-700",
  },
  GOLD: {
    card: "from-amber-50 via-yellow-50 to-orange-50",
    accent: "from-amber-400 via-yellow-400 to-orange-500",
    outline: "border-amber-300/80",
    pill: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800",
    text: "text-amber-700",
    dot: "bg-yellow-500",
    shadow: "shadow-amber-200/80",
    stopA: "#f59e0b",
    stopB: "#fbbf24",
    stopC: "#f97316",
    fillA: "#fffdf5",
    fillB: "#fef3c7",
    icon: "text-amber-700",
  },
  PLATINUM: {
    card: "from-cyan-50 via-white to-slate-100",
    accent: "from-slate-400 via-cyan-300 to-sky-400",
    outline: "border-cyan-200/80",
    pill: "bg-cyan-100 text-cyan-800",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
    shadow: "shadow-cyan-100/80",
    stopA: "#64748b",
    stopB: "#67e8f9",
    stopC: "#38bdf8",
    fillA: "#f9feff",
    fillB: "#e0f2fe",
    icon: "text-cyan-700",
  },
  EMERALD: {
    card: "from-emerald-50 via-white to-green-50",
    accent: "from-emerald-500 via-green-400 to-emerald-600",
    outline: "border-emerald-200/80",
    pill: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    shadow: "shadow-emerald-100/80",
    stopA: "#059669",
    stopB: "#34d399",
    stopC: "#10b981",
    fillA: "#f7fffb",
    fillB: "#d1fae5",
    icon: "text-emerald-700",
  },
  SAPPHIRE: {
    card: "from-blue-50 via-white to-sky-50",
    accent: "from-blue-600 via-sky-400 to-blue-500",
    outline: "border-blue-200/80",
    pill: "bg-blue-100 text-blue-800",
    text: "text-blue-700",
    dot: "bg-blue-500",
    shadow: "shadow-blue-100/80",
    stopA: "#2563eb",
    stopB: "#38bdf8",
    stopC: "#1d4ed8",
    fillA: "#f8fbff",
    fillB: "#dbeafe",
    icon: "text-blue-700",
  },
  RUBY: {
    card: "from-rose-50 via-white to-red-50",
    accent: "from-rose-500 via-red-400 to-rose-600",
    outline: "border-rose-200/80",
    pill: "bg-rose-100 text-rose-800",
    text: "text-rose-700",
    dot: "bg-rose-500",
    shadow: "shadow-rose-100/80",
    stopA: "#e11d48",
    stopB: "#fb7185",
    stopC: "#dc2626",
    fillA: "#fff7f8",
    fillB: "#ffe4e6",
    icon: "text-rose-700",
  },
  AMETHYST: {
    card: "from-fuchsia-50 via-white to-violet-50",
    accent: "from-fuchsia-500 via-violet-500 to-purple-600",
    outline: "border-violet-200/80",
    pill: "bg-violet-100 text-violet-800",
    text: "text-violet-700",
    dot: "bg-violet-500",
    shadow: "shadow-violet-100/80",
    stopA: "#a21caf",
    stopB: "#8b5cf6",
    stopC: "#7c3aed",
    fillA: "#fcfaff",
    fillB: "#ede9fe",
    icon: "text-violet-700",
  },
  SUNSET: {
    card: "from-orange-50 via-white to-pink-50",
    accent: "from-orange-500 via-amber-400 to-rose-500",
    outline: "border-orange-200/80",
    pill: "bg-orange-100 text-orange-800",
    text: "text-orange-700",
    dot: "bg-orange-500",
    shadow: "shadow-orange-100/80",
    stopA: "#f97316",
    stopB: "#fb923c",
    stopC: "#f43f5e",
    fillA: "#fffaf5",
    fillB: "#ffedd5",
    icon: "text-orange-700",
  },
  TEAL: {
    card: "from-teal-50 via-white to-cyan-50",
    accent: "from-teal-500 via-cyan-400 to-teal-600",
    outline: "border-teal-200/80",
    pill: "bg-teal-100 text-teal-800",
    text: "text-teal-700",
    dot: "bg-teal-500",
    shadow: "shadow-teal-100/80",
    stopA: "#0f766e",
    stopB: "#22d3ee",
    stopC: "#14b8a6",
    fillA: "#f5fffe",
    fillB: "#ccfbf1",
    icon: "text-teal-700",
  },
};

const BADGE_META: Record<
  string,
  {
    rarity: BadgeRarity;
    category: BadgeCategory;
    palette: BadgePalette;
    icon: IconType;
  }
> = {
  "First Spark": { rarity: "COMMON", category: "MILESTONE", palette: "SUNSET", icon: FaFire },
  "The Feeding Hand": { rarity: "UNCOMMON", category: "IMPACT", palette: "RUBY", icon: FaHeart },
  "Good Samaritan": { rarity: "RARE", category: "IMPACT", palette: "EMERALD", icon: FaHandshake },
  "Community Pillar": { rarity: "RARE", category: "LEGACY", palette: "SAPPHIRE", icon: FaBuilding },
  "Humanitarian Legend": { rarity: "LEGENDARY", category: "LEGACY", palette: "GOLD", icon: FaCrown },
  "Bronze Lifesaver": { rarity: "COMMON", category: "MILESTONE", palette: "BRONZE", icon: FaMedal },
  "Silver Lifesaver": { rarity: "UNCOMMON", category: "MILESTONE", palette: "SILVER", icon: FaAward },
  "Gold Lifesaver": { rarity: "RARE", category: "MILESTONE", palette: "GOLD", icon: FiAward },
  "Diamond Giver": { rarity: "EPIC", category: "LEGACY", palette: "PLATINUM", icon: FaGem },
  "Seven-Day Streak": { rarity: "RARE", category: "CONSISTENCY", palette: "AMETHYST", icon: FiZap },
  "Monthly Master": { rarity: "EPIC", category: "CONSISTENCY", palette: "AMETHYST", icon: FaCalendarCheck },
  "Early Bird": { rarity: "UNCOMMON", category: "CONSISTENCY", palette: "SUNSET", icon: FaSun },
  "Midnight Hero": { rarity: "UNCOMMON", category: "CONSISTENCY", palette: "SAPPHIRE", icon: FaMoon },
  "Veggie Pioneer": { rarity: "UNCOMMON", category: "SPECIALTY", palette: "EMERALD", icon: FaLeaf },
  "Zero Waste Champ": { rarity: "RARE", category: "SPECIALTY", palette: "TEAL", icon: FaShieldAlt },
  "Karma Apprentice": { rarity: "COMMON", category: "MILESTONE", palette: "SAPPHIRE", icon: FiTrendingUp },
  "Karma Sensei": { rarity: "EPIC", category: "LEGACY", palette: "AMETHYST", icon: FaGraduationCap },
  "Grandmaster of Generosity": { rarity: "LEGENDARY", category: "LEGACY", palette: "GOLD", icon: FaCrown },
  "Diverse Giver": { rarity: "RARE", category: "SPECIALTY", palette: "RUBY", icon: FaPalette },
  "ShareBite OG": { rarity: "EPIC", category: "LEGACY", palette: "PLATINUM", icon: FaCheckCircle },
};

function getBadgeMeta(name: string) {
  return (
    BADGE_META[name] || {
      rarity: "COMMON" as BadgeRarity,
      category: "MILESTONE" as BadgeCategory,
      palette: "SILVER" as BadgePalette,
      icon: FiAward,
    }
  );
}

function formatEarnedDate(value: string | null) {
  if (!value) {
    return "Freshly unlocked";
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortBadges(left: BadgeView, right: BadgeView) {
  if (left.earned !== right.earned) {
    return left.earned ? -1 : 1;
  }

  const rarityOrder: Record<BadgeRarity, number> = {
    LEGENDARY: 0,
    EPIC: 1,
    RARE: 2,
    UNCOMMON: 3,
    COMMON: 4,
  };

  if (rarityOrder[left.rarity] !== rarityOrder[right.rarity]) {
    return rarityOrder[left.rarity] - rarityOrder[right.rarity];
  }

  return left.name.localeCompare(right.name);
}

function BadgeGlyph({
  badge,
  size = "md",
}: {
  badge: BadgeView;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = badge.icon;
  const style = PALETTE_STYLES[badge.palette];
  const reactId = useId();
  const gradientId = `badge-gradient-${badge.id}-${reactId.replace(/:/g, "")}`;
  const innerId = `badge-inner-${badge.id}-${reactId.replace(/:/g, "")}`;
  const shineId = `badge-shine-${badge.id}-${reactId.replace(/:/g, "")}`;

  const sizeConfig = {
    sm: { wrap: "h-14 w-14", icon: "text-xl" },
    md: { wrap: "h-[72px] w-[72px]", icon: "text-2xl" },
    lg: { wrap: "h-24 w-24", icon: "text-3xl" },
  } as const;

  const config = sizeConfig[size];
  const mutedOuter = "#d7dee9";
  const mutedInner = "#f3f4f6";

  return (
    <motion.div
      whileHover={badge.earned ? { scale: 1.05, y: -2 } : { scale: 1.01 }}
      className={cn("relative shrink-0", config.wrap)}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={badge.earned ? style.stopA : mutedOuter} />
            <stop offset="50%" stopColor={badge.earned ? style.stopB : "#e2e8f0"} />
            <stop offset="100%" stopColor={badge.earned ? style.stopC : mutedOuter} />
          </linearGradient>
          <linearGradient id={innerId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={badge.earned ? style.fillA : "#ffffff"} />
            <stop offset="100%" stopColor={badge.earned ? style.fillB : mutedInner} />
          </linearGradient>
          <linearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d="M50 3 L90 26 L90 74 L50 97 L10 74 L10 26 Z" fill={`url(#${gradientId})`} />
        <path d="M50 12 L82 30 L82 70 L50 88 L18 70 L18 30 Z" fill={`url(#${innerId})`} />
        {badge.earned && (
          <path d="M50 12 L82 30 L82 70 L50 88 L18 70 L18 30 Z" fill={`url(#${shineId})`} />
        )}
      </svg>

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <Icon className={cn(config.icon, badge.earned ? style.icon : "text-slate-400")} />
      </div>

      {!badge.earned && (
        <div className="absolute -bottom-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <FiLock className="h-2.5 w-2.5 text-slate-400" />
        </div>
      )}
    </motion.div>
  );
}

function BadgeCard({
  badge,
  onClick,
}: {
  badge: BadgeView;
  onClick: () => void;
}) {
  const style = PALETTE_STYLES[badge.palette];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={badge.earned ? { y: -4 } : { y: -2 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-5 text-left transition-all duration-300",
        badge.earned
          ? cn(
              "bg-gradient-to-br shadow-xl hover:shadow-2xl",
              style.card,
              style.outline,
              style.shadow,
            )
          : "border-slate-200/80 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#eef2f7_100%)] shadow-lg shadow-slate-200/40 hover:border-slate-300/80",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          badge.earned ? cn("bg-gradient-to-b", style.accent) : "bg-slate-200",
        )}
      />
      <div
        className={cn(
          "absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl",
          badge.earned ? "bg-white/70" : "bg-slate-100/80",
        )}
      />

      <div className="relative flex h-full gap-4">
        <BadgeGlyph badge={badge} size="md" />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("text-lg font-black tracking-tight", badge.earned ? "text-slate-950" : "text-slate-500")}>
              {badge.name}
            </h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                badge.earned ? style.pill : "bg-slate-100 text-slate-500",
              )}
            >
              {RARITY_LABELS[badge.rarity]}
            </span>
          </div>

          <p className={cn("mt-2 text-sm leading-relaxed", badge.earned ? "text-slate-600" : "text-slate-400")}>
            {badge.description}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs font-semibold">
            <span className={cn("inline-flex items-center gap-2", badge.earned ? "text-slate-600" : "text-slate-400")}>
              <span className={cn("h-2 w-2 rounded-full", badge.earned ? style.dot : "bg-slate-300")} />
              {badge.earned ? `Earned ${formatEarnedDate(badge.earnedAt)}` : "Keep donating to unlock this badge."}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                badge.earned ? "bg-white/80 text-slate-600" : "bg-slate-100 text-slate-500",
              )}
            >
              {React.createElement(CATEGORY_ICONS[badge.category], { className: "h-3 w-3" })}
              {CATEGORY_LABELS[badge.category]}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function DonorBadgesShowcase() {
  const [data, setData] = useState<BadgeSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeView | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "ALL">("ALL");

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/donor/badges");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const badges = useMemo<BadgeView[]>(
    () =>
      data?.badges.map((badge) => ({
        ...badge,
        ...getBadgeMeta(badge.name),
      })) ?? [],
    [data],
  );

  const filteredBadges = useMemo(() => {
    const list =
      selectedCategory === "ALL"
        ? badges
        : badges.filter((badge) => badge.category === selectedCategory);

    return [...list].sort(sortBadges);
  }, [badges, selectedCategory]);

  const progressPercent = useMemo(() => {
    if (!data || data.totalBadges === 0) {
      return 0;
    }

    return Math.round((data.earnedCount / data.totalBadges) * 100);
  }, [data]);

  const rarityStats = useMemo(() => {
    return (Object.keys(RARITY_LABELS) as BadgeRarity[]).map((rarity) => ({
      rarity,
      earned: badges.filter((badge) => badge.rarity === rarity && badge.earned).length,
      total: badges.filter((badge) => badge.rarity === rarity).length,
    }));
  }, [badges]);

  const categoryStats = useMemo(
    () =>
      (Object.keys(CATEGORY_LABELS) as BadgeCategory[]).map((category) => ({
        category,
        earned: badges.filter((badge) => badge.category === category && badge.earned).length,
        total: badges.filter((badge) => badge.category === category).length,
      })),
    [badges],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-16 shadow-xl shadow-slate-200/50">
        <FiAward className="h-10 w-10 animate-pulse text-orange-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          Loading Badge Cabinet
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.25rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/45 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200/70">
                <FiAward className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">All Badges</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {data.earnedCount} of {data.totalBadges} achievements earned so far.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-[1.4rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-3 shadow-lg shadow-orange-100/60">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Karma</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{data.karmaPoints}</p>
              </div>
              <div className="rounded-[1.4rem] border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3 shadow-lg shadow-blue-100/60">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Level</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{data.level}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-100 bg-[linear-gradient(135deg,#fffaf3_0%,#ffffff_52%,#fff4e6_100%)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">Collection Progress</p>
              <p className="text-sm font-black text-slate-900">{progressPercent}%</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {rarityStats.map((entry) => {
                const style = RARITY_STYLES[entry.rarity];
                return (
                  <div key={entry.rarity} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                    <span>{RARITY_LABELS[entry.rarity]}</span>
                    <span className="font-black text-slate-700">
                      {entry.earned}/{entry.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all",
                selectedCategory === "ALL"
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-300/60"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              <FiAward className="h-4 w-4" />
              All
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", selectedCategory === "ALL" ? "bg-white/15" : "bg-white text-slate-500")}>
                {data.earnedCount}/{data.totalBadges}
              </span>
            </button>

            {categoryStats.map((entry) => {
              const Icon = CATEGORY_ICONS[entry.category];
              return (
                <button
                  key={entry.category}
                  type="button"
                  onClick={() => setSelectedCategory(entry.category)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all",
                    selectedCategory === entry.category
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-200/70"
                      : "bg-orange-50 text-slate-600 hover:bg-orange-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {CATEGORY_LABELS[entry.category]}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      selectedCategory === entry.category ? "bg-white/15" : "bg-white text-slate-500",
                    )}
                  >
                    {entry.earned}/{entry.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
        ))}
      </div>

      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedBadge(null)} />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="absolute right-4 top-4 z-20 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <FiX className="h-4 w-4" />
              </button>

              {(() => {
                const style = PALETTE_STYLES[selectedBadge.palette];
                const CategoryIcon = CATEGORY_ICONS[selectedBadge.category];

                return (
                  <div className="relative p-6 sm:p-8">
                    <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", style.accent)} />

                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                      <div className="mx-auto sm:mx-0">
                        <BadgeGlyph badge={selectedBadge} size="lg" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]", style.pill)}>
                            {RARITY_LABELS[selectedBadge.rarity]}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <CategoryIcon className="h-3 w-3" />
                            {CATEGORY_LABELS[selectedBadge.category]}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-3xl font-black tracking-tight text-slate-950">{selectedBadge.name}</h3>
                          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                            {selectedBadge.description}
                          </p>
                        </div>

                        <div className={cn("rounded-[1.5rem] border p-4", style.outline, `bg-gradient-to-br ${style.card}`)}>
                          {selectedBadge.earned ? (
                            <div className="space-y-2">
                              <p className={cn("text-[10px] font-black uppercase tracking-[0.25em]", style.text)}>
                                Achievement unlocked
                              </p>
                              <p className="text-sm font-semibold text-slate-700">
                                Added to your cabinet on {formatEarnedDate(selectedBadge.earnedAt)}.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Locked for now
                              </p>
                              <p className="text-sm font-semibold text-slate-500">
                                Keep donating and stay active to unlock this reward next.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                            <FiClock className="h-3.5 w-3.5" />
                            {selectedBadge.earned ? `Earned ${formatEarnedDate(selectedBadge.earnedAt)}` : "Waiting to unlock"}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-orange-600">
                            <FiTrendingUp className="h-3.5 w-3.5" />
                            Level {data.level} donor track
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
