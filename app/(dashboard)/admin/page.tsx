"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const heroStats = [
  {
    value: "24,860",
    label: "Meals redirected",
    note: "+12.8% this week",
  },
  {
    value: "178",
    label: "Active partner NGOs",
    note: "+9 this month",
  },
  {
    value: "98.4%",
    label: "Fulfillment success",
    note: "Last 30 days",
  },
];

const pipelineCards = [
  {
    title: "Pending NGO verification",
    value: "08",
    tint: "from-amber-500/30 via-orange-500/25 to-transparent",
  },
  {
    title: "Priority donation requests",
    value: "14",
    tint: "from-sky-500/30 via-cyan-500/25 to-transparent",
  },
  {
    title: "Escalation tickets",
    value: "03",
    tint: "from-rose-500/30 via-pink-500/25 to-transparent",
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 30 },
  show: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: index * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function AdminPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-[#ff7f50]/35 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-[#4da2ff]/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#42c7a4]/25 blur-3xl animate-pulse" />
      </div>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-14 sm:py-18 lg:min-h-screen lg:flex-row lg:items-center lg:gap-16 lg:px-12">
        <motion.div
          className="w-full max-w-2xl space-y-7"
          initial="hidden"
          animate="show"
          variants={revealUp}
          custom={0}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur"
            variants={revealUp}
            custom={1}
          >
            <Sparkles className="h-4 w-4 text-[#ff7f50]" />
            Premium Admin Experience
          </motion.div>

          <motion.h1
            className="text-balance text-4xl leading-tight font-black sm:text-5xl lg:text-6xl"
            variants={revealUp}
            custom={2}
          >
            Control every donation flow from one
            <span className="bg-linear-to-r from-[#ff7f50] via-[#ff5d5d] to-[#f59e0b] bg-clip-text text-transparent">
              {" "}
              powerful admin hub
            </span>
            .
          </motion.h1>

          <motion.p
            className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
            variants={revealUp}
            custom={3}
          >
            Track NGOs, moderate users, and monitor real-time operations with a
            dashboard built for speed, trust, and crystal-clear visibility.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-3"
            variants={revealUp}
            custom={4}
          >
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open Admin Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/register"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Create Admin Account
            </Link>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-3"
            variants={revealUp}
            custom={5}
          >
            {heroStats.map((item, index) => (
              <motion.article
                key={item.label}
                className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.75)] backdrop-blur"
                variants={revealUp}
                custom={index + 6}
              >
                <p className="text-xl font-bold text-slate-900">{item.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.note}</p>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative w-full max-w-2xl flex-1"
          initial="hidden"
          animate="show"
          variants={revealUp}
          custom={2}
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_35px_90px_-35px_rgba(15,23,42,0.55)] backdrop-blur-md sm:p-8">
            <div className="rounded-3xl bg-linear-to-r from-[#1f2937] via-[#111827] to-[#0f172a] p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Operations overview
                  </p>
                  <p className="mt-2 text-xl font-semibold sm:text-2xl">
                    Today&apos;s command center
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs">
                  <BellRing className="h-3.5 w-3.5" />
                  Live
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-white/10 p-3">
                  <ChartNoAxesCombined className="h-4 w-4 text-[#42c7a4]" />
                  <p className="mt-2 text-[11px] text-slate-300">Donation velocity</p>
                  <p className="text-base font-semibold text-white">+28%</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <Users className="h-4 w-4 text-[#7dd3fc]" />
                  <p className="mt-2 text-[11px] text-slate-300">New users today</p>
                  <p className="text-base font-semibold text-white">+186</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <ShieldCheck className="h-4 w-4 text-[#fbbf24]" />
                  <p className="mt-2 text-[11px] text-slate-300">Risk alerts</p>
                  <p className="text-base font-semibold text-white">2 open</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {pipelineCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.6 + index * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-linear-to-r ${card.tint}`}
                  />
                  <div className="relative flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{card.title}</p>
                    <p className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {card.value}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          <motion.div
            className="absolute -left-5 -top-6 hidden rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl sm:block"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Pending actions
            </p>
            <p className="text-lg font-bold text-slate-900">25 total</p>
          </motion.div>

          <motion.div
            className="absolute -bottom-5 right-4 hidden rounded-2xl border border-white/80 bg-slate-900 px-4 py-3 text-white shadow-xl sm:block"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <p className="text-[11px] font-medium tracking-wide text-slate-300 uppercase">
              Avg response
            </p>
            <p className="text-lg font-bold">06m 40s</p>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
