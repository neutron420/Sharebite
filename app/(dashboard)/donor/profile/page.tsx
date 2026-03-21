"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAward,
  FiClock,
  FiCompass,
  FiMapPin,
  FiShield,
  FiStar,
  FiTarget,
} from "react-icons/fi";
import { FaLeaf, FaMedal } from "react-icons/fa6";
import {
  BadgeCheck,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import DonorBadgesShowcase from "@/components/ui/donor-badges-showcase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/profile-card";
import { cn } from "@/lib/utils";

interface EarnedBadge {
  id: string;
  createdAt: string;
  badge: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string | null;
  };
}

interface DonorProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  district?: string | null;
  pincode?: string | null;
  imageUrl?: string | null;
  donorType?: string | null;
  isVerified: boolean;
  karmaPoints: number;
  level: number;
  strikeCount: number;
  createdAt: string;
  updatedAt: string;
  levelProgress: number;
  totalWeightDonated: number;
  totalDonations: number;
  totalReviews: number;
  totalBadgesAvailable: number;
  earnedBadgesCount: number;
  badges: EarnedBadge[];
}

const details = (
  profile: DonorProfileData,
): { label: string; value: string; icon: typeof Mail }[] => [
  {
    label: "Email",
    value: profile.email,
    icon: Mail,
  },
  {
    label: "Phone",
    value: profile.phoneNumber || "Add your phone number",
    icon: Phone,
  },
  {
    label: "City",
    value: profile.city || "City not added yet",
    icon: MapPin,
  },
  {
    label: "Address",
    value: profile.address || "Address not added yet",
    icon: MapPin,
  },
];

export default function DonorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DonorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/donor/profile", { credentials: "include" });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Unable to load donor profile.");
        }

        const data = (await response.json()) as DonorProfileData;
        if (isMounted) {
          setProfile(data);
        }
      } catch (fetchError: any) {
        if (isMounted) {
          setError(fetchError?.message || "Unable to load donor profile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const recentBadges = useMemo(() => profile?.badges.slice(0, 3) ?? [], [profile]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-14 w-14 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
          Loading Profile Deck...
        </p>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="w-full">
        <div className="rounded-[2.5rem] border border-red-100 bg-red-50 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Profile unavailable</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {error || "We couldn't load your donor profile right now."}
          </p>
        </div>
      </div>
    );
  }

  const joinedDate = format(new Date(profile.createdAt), "dd MMM yyyy");
  const lastUpdated = formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true });
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const statCards = [
    {
      label: "Total Donations",
      value: profile.totalDonations.toLocaleString(),
      helper: "Food shares completed",
      icon: FiTarget,
      cardClass: "border-orange-100 bg-[linear-gradient(135deg,#ffffff_0%,#fff7ed_55%,#ffedd5_100%)]",
      iconClass: "bg-orange-100 text-orange-600",
      chipClass: "bg-orange-100 text-orange-600",
      accentClass: "from-orange-500 to-amber-400",
    },
    {
      label: "Food Rescued",
      value: `${profile.totalWeightDonated.toLocaleString()} kg`,
      helper: "Collected donation weight",
      icon: FaLeaf,
      cardClass: "border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdf4_55%,#dcfce7_100%)]",
      iconClass: "bg-emerald-100 text-emerald-600",
      chipClass: "bg-emerald-100 text-emerald-600",
      accentClass: "from-emerald-500 to-lime-400",
    },
    {
      label: "Badges Earned",
      value: `${profile.earnedBadgesCount}/${profile.totalBadgesAvailable}`,
      helper: "Achievement cabinet",
      icon: FaMedal,
      cardClass: "border-amber-100 bg-[linear-gradient(135deg,#ffffff_0%,#fffaf0_55%,#fef3c7_100%)]",
      iconClass: "bg-amber-100 text-amber-600",
      chipClass: "bg-amber-100 text-amber-600",
      accentClass: "from-amber-500 to-yellow-400",
    },
    {
      label: "Community Reviews",
      value: profile.totalReviews.toLocaleString(),
      helper: "Trust signals received",
      icon: FiStar,
      cardClass: "border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#e0f2fe_100%)]",
      iconClass: "bg-sky-100 text-sky-600",
      chipClass: "bg-sky-100 text-sky-600",
      accentClass: "from-sky-500 to-blue-500",
    },
  ];

  const identityItems: Array<{ label: string; value: string; icon: IconType }> = [
    { label: "District", value: profile.district || "Not shared yet", icon: FiMapPin },
    { label: "State", value: profile.state || "Not shared yet", icon: FiCompass },
    { label: "Postal Code", value: profile.pincode || "Not shared yet", icon: FiTarget },
    { label: "Role", value: profile.role, icon: FiShield },
  ];

  const unlockStyles = [
    {
      cardClass: "border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_52%,#fef3c7_100%)]",
      iconClass: "bg-amber-100 text-amber-600",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      timeClass: "text-amber-600",
      kicker: "Bronze Unlock",
    },
    {
      cardClass: "border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#ffedd5_100%)]",
      iconClass: "bg-orange-100 text-orange-600",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
      timeClass: "text-orange-600",
      kicker: "Fresh Unlock",
    },
    {
      cardClass: "border-emerald-200 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_52%,#dcfce7_100%)]",
      iconClass: "bg-emerald-100 text-emerald-600",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
      timeClass: "text-emerald-600",
      kicker: "Impact Unlock",
    },
  ];

  return (
    <div className="w-full space-y-10">
      <section className="relative overflow-hidden rounded-[3rem] border border-orange-100 bg-[linear-gradient(135deg,#ffffff_0%,#fff7ed_42%,#ffedd5_100%)] p-8 md:p-10 text-slate-950 shadow-2xl shadow-orange-100/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(251,191,36,0.18),_transparent_38%)]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border-4 border-white shadow-2xl shadow-orange-200/60">
                <AvatarImage src={profile.imageUrl || undefined} alt={profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-400 text-2xl font-black text-white">
                  {initials || "SB"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-orange-100 bg-white text-slate-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                    {profile.donorType || "Community Donor"}
                  </Badge>
                  <Badge className="border-orange-200 bg-orange-100 text-orange-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    Level {profile.level}
                  </Badge>
                  {profile.isVerified && (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                      Verified Donor
                    </Badge>
                  )}
                </div>

                <div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight">{profile.name}</h1>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Donor command center with badges, impact stats, and account identity in one place.
                  </p>
                </div>

                <div className="flex flex-wrap gap-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-orange-500" />
                    Joined {joinedDate}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-orange-500" />
                    Last updated {lastUpdated}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {details(profile).map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[2rem] border border-orange-100 bg-white/80 px-5 py-4 shadow-lg shadow-orange-100/20 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {item.label}
                    </p>
                    <div className="mt-2 flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-orange-50 p-2 text-orange-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-orange-100 bg-white/75 p-6 shadow-xl shadow-orange-100/30 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Karma Overview
            </p>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Current Karma</p>
                <p className="text-5xl font-black tracking-tight">{profile.karmaPoints.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 px-4 py-3 text-right text-white shadow-lg shadow-orange-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                  Next milestone
                </p>
                <p className="text-2xl font-black">{profile.levelProgress}%</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span>Level Progress</span>
                <span>Level {profile.level}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-700"
                  style={{ width: `${profile.levelProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trust</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {profile.isVerified ? "Verified account" : "Verification pending"}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Health</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {profile.strikeCount === 0 ? "Clean record" : `${profile.strikeCount} active strike(s)`}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-orange-200 bg-gradient-to-r from-orange-500 to-amber-400 p-5 text-white shadow-lg shadow-orange-200">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-white" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    Badge Progress
                  </p>
                  <p className="text-sm font-semibold">
                    {profile.earnedBadgesCount} achievements unlocked so far.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.label}
              className={cn("overflow-hidden py-4", card.cardClass)}
            >
              <CardHeader className="flex-row items-start justify-between px-5 pt-2">
                <div className={cn("rounded-[1.35rem] p-3 shadow-sm", card.iconClass)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                    card.chipClass,
                  )}
                >
                  Snapshot
                </span>
              </CardHeader>
              <CardBody className="px-5 pb-5 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{card.value}</p>
                <div className={cn("mt-4 h-1.5 w-20 rounded-full bg-gradient-to-r", card.accentClass)} />
                <p className="mt-4 text-sm font-medium text-slate-500">{card.helper}</p>
              </CardBody>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
        <Card className="overflow-hidden border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#fbfcff_50%,#f5f7fb_100%)] py-4">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-[1.35rem] bg-slate-950 p-3 text-white shadow-lg shadow-slate-200/80">
                <FiCompass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Profile Card
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Identity Snapshot</h2>
                <p className="text-sm font-medium text-slate-500">
                  Core account details and donation-region coverage.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Live
            </span>
          </CardHeader>

          <CardBody className="pt-6">
            <div className="space-y-3">
              {identityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100 bg-white/80 px-4 py-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 text-right">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-orange-100 bg-[linear-gradient(135deg,#ffffff_0%,#fffaf2_48%,#fff1df_100%)] py-4">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-[1.35rem] bg-gradient-to-br from-orange-500 to-amber-400 p-3 text-white shadow-lg shadow-orange-200/80">
                <FiAward className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">
                  Fresh Feed
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Recent Unlocks</h2>
                <p className="text-sm font-medium text-slate-500">
                  Your newest achievements appear here before they roll into the full gallery.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
              {recentBadges.length} New
            </span>
          </CardHeader>

          <CardBody className="pt-6">
            <div className="space-y-4">
              {recentBadges.length > 0 ? (
                recentBadges.map((badgeEntry, index) => {
                  const style = unlockStyles[index % unlockStyles.length];

                  return (
                    <div
                      key={badgeEntry.id}
                      className={cn(
                        "rounded-[1.75rem] border px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5",
                        style.cardClass,
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("rounded-2xl p-3 shadow-sm", style.iconClass)}>
                            <FiAward className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", style.timeClass)}>
                              {style.kicker}
                            </p>
                            <p className="mt-1 text-lg font-black tracking-tight text-slate-950">
                              {badgeEntry.badge.name}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {badgeEntry.badge.description}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                            style.badgeClass,
                          )}
                        >
                          Unlocked
                        </span>
                      </div>
                      <div className={cn("mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]", style.timeClass)}>
                        <FiClock className="h-3.5 w-3.5" />
                        Earned {formatDistanceToNow(new Date(badgeEntry.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/80 px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <FiActivity className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-black tracking-tight text-slate-950">Your first badge is close.</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Keep donating and your latest achievement will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      <section id="badges-gallery" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
              Achievement Wall
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
              Full Badge Collection
            </h2>
          </div>
          <p className="max-w-xl text-sm font-medium text-slate-500">
            Inspired by the kind of gamified profile experience you pointed to, but matched to
            ShareBite’s donor dashboard styling and existing badge rules.
          </p>
        </div>

        <DonorBadgesShowcase />
      </section>
    </div>
  );
}
