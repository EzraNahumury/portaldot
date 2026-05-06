"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, ShieldCheck } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { GuardianNetwork } from "@/components/ui/GuardianNetwork";
import { Spotlight } from "@/components/ui/Spotlight";
import { Reveal, RevealItem } from "@/components/ui/ScrollReveal";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-stone-900/80">
        <Spotlight color="52, 211, 153" intensity={0.12} />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="md:col-span-7"
          >
            <h1 className="font-display text-[56px] md:text-[80px] leading-[0.95] tracking-[-0.03em] text-stone-50">
              Lose your keys.
              <br />
              <span className="italic text-stone-400">Not</span> your assets.
            </h1>

            <p className="mt-6 max-w-md text-[14px] text-stone-400 leading-[1.7]">
              Your friends become your recovery layer. No custodian. No oracle.
              Fully on-chain.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/setup"
                className="group relative inline-flex items-center gap-2 h-11 px-5 rounded-md bg-stone-100 text-stone-950 text-[13px] font-medium tracking-tight overflow-hidden hover:bg-white transition-colors"
              >
                <span className="relative">Create Vault</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#flow"
                className="inline-flex items-center gap-1.5 h-11 px-4 text-[13px] text-stone-400 hover:text-stone-100 transition-colors"
              >
                See how it works
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 24 }}
            className="md:col-span-5 relative"
          >
            <GuardianNetwork className="w-full max-w-[420px] mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* FLOW — three glow cards */}
      <section
        id="flow"
        className="relative border-b border-stone-900/80 bg-stone-950/30"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-xl mb-12">
            <RevealItem className="text-[11px] tracking-[0.16em] uppercase text-stone-500 font-medium">
              How it works
            </RevealItem>
            <RevealItem
              as="h2"
              className="mt-4 font-display text-3xl md:text-4xl text-stone-100 tracking-tight leading-tight"
            >
              Three steps to recovery.
            </RevealItem>
          </Reveal>

          <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-4" gap={0.08}>
            <FlowCard
              n={1}
              icon={<Users className="size-4" />}
              title="Add guardians"
              body="Pick trusted friends. Each becomes a delayed proxy."
            />
            <FlowCard
              n={2}
              icon={<ShieldCheck className="size-4" />}
              title="Collect approvals"
              body="Threshold of guardians sign off-chain. Zero gas."
            />
            <FlowCard
              n={3}
              icon={<Clock className="size-4" />}
              title="Recover safely"
              body="Time-lock window. Owner can cancel. Then funds move."
            />
          </Reveal>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="relative border-b border-stone-900/80 overflow-hidden">
        <Spotlight color="139, 92, 246" intensity={0.08} size={800} />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[28px] md:text-[40px] leading-[1.18] text-stone-100 tracking-tight max-w-3xl mx-auto"
          >
            Self-custody is freedom.{" "}
            <span className="italic text-stone-500">
              Permanent loss is a design failure.
            </span>
          </motion.p>
          <Link
            href="/setup"
            className="mt-10 inline-flex items-center gap-2 text-[13px] text-stone-200 hover:text-white transition-colors group"
          >
            <span className="border-b border-stone-700 group-hover:border-stone-300 pb-0.5 transition-colors">
              Start protecting an account
            </span>
            <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-900/80">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between text-[11px] text-stone-500 font-mono">
          <span>PortalGuard · MIT</span>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/EzraNahumury/portaldot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-200 transition-colors"
            >
              github
            </a>
            <a
              href="https://portaldot-dev.readthedocs.io/en/latest/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-200 transition-colors"
            >
              docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FlowCard({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <RevealItem>
      <GlowCard className="p-6 h-full">
        <div className="flex items-start justify-between mb-8">
          <span className="size-9 rounded-md bg-stone-900/80 border border-stone-800 flex items-center justify-center text-stone-300 group-hover:text-emerald-300 transition-colors">
            {icon}
          </span>
          <span className="font-mono text-[11px] text-stone-600">
            {String(n).padStart(2, "0")}
          </span>
        </div>
        <h3 className="text-[15px] font-medium text-stone-100 tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-[12.5px] text-stone-500 leading-relaxed">
          {body}
        </p>
      </GlowCard>
    </RevealItem>
  );
}
