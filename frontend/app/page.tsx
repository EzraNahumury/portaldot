"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Shield,
  Users,
  Clock,
  Sparkles,
  KeyRound,
  Lock,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spotlight } from "@/components/ui/Spotlight";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { TypeWriter } from "@/components/ui/TypeWriter";
import { Marquee } from "@/components/ui/Marquee";
import { LiveBlockClock } from "@/components/ui/LiveBlockClock";
import { Reveal, RevealItem } from "@/components/ui/ScrollReveal";

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 220, damping: 26 },
  },
};

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden">
        <Spotlight intensity={0.18} />
        {/* floating ambient orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.02) 40%, transparent 70%)",
          }}
          animate={{ y: [0, 26, 0], x: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-40 size-[460px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)",
          }}
          animate={{ y: [0, -22, 0], x: [0, -12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          style={{ y: heroY }}
          className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-14"
        >
          <motion.div
            variants={heroStagger}
            initial="hidden"
            animate="show"
            className="md:col-span-7"
          >
            <motion.div variants={heroItem}>
              <Badge tone="ok" dot pulse>
                <span className="font-mono text-[10.5px]">on portaldot · live</span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="mt-7 font-display text-[64px] md:text-[88px] leading-[0.95] tracking-tight text-stone-50"
            >
              Lose your keys.
              <br />
              <motion.span
                className="italic text-stone-400 inline-block"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                Keep
              </motion.span>{" "}
              your assets.
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mt-7 max-w-xl text-[15px] text-stone-400 leading-[1.65]"
            >
              PortalGuard turns trusted friends into a programmable recovery key.
              When your seed phrase is gone, a guardian collective coordinates a
              time-locked transfer of your account — fully on chain, no custodian.
            </motion.p>

            <motion.div variants={heroItem} className="mt-8 flex items-center gap-3">
              <Link
                href="/setup"
                className="group relative inline-flex items-center gap-2 h-11 px-5 rounded-md bg-stone-100 text-stone-950 text-sm font-medium overflow-hidden transition-shadow hover:shadow-[0_0_28px_rgba(52,211,153,0.35)]"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  Create your vault
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-stone-100"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </Link>
              <Link
                href="#how"
                className="text-sm text-stone-400 hover:text-stone-100 underline underline-offset-4 decoration-stone-800 hover:decoration-stone-500 transition-colors"
              >
                How it works
              </Link>
              <span className="ml-3 hidden md:inline-flex">
                <LiveBlockClock />
              </span>
            </motion.div>

            <motion.dl
              variants={heroItem}
              className="mt-14 grid grid-cols-3 gap-x-8 max-w-md border-t border-stone-900 pt-6"
            >
              <Metric label="Pallets used" value={3} />
              <Metric label="Contracts" value={0} />
              <Metric label="Custodians" value={0} />
            </motion.dl>
          </motion.div>

          {/* Right: live extrinsic preview */}
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 28 }}
            className="md:col-span-5 md:pt-2 relative"
          >
            <div className="relative rounded-lg border border-stone-900 bg-stone-950/60 backdrop-blur-sm overflow-hidden shadow-[0_24px_60px_-30px_rgba(52,211,153,0.18)]">
              {/* mini titlebar with traffic-light dots */}
              <div className="flex items-center justify-between px-4 h-9 border-b border-stone-900 bg-stone-950/80">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-stone-700" />
                  <span className="size-2 rounded-full bg-stone-700" />
                  <span className="size-2 rounded-full bg-stone-700" />
                </div>
                <span className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                  recover.tx
                </span>
                <Badge tone="ok" dot>
                  signed
                </Badge>
              </div>

              {/* code preview with typewriter */}
              <div className="px-4 py-4 font-mono text-[12.5px] text-stone-300 leading-[1.7] min-h-[170px]">
                <TypeWriter
                  text={`utility.batchAll([\n  proxy.addProxy(g1, "Any", 14400),\n  proxy.addProxy(g2, "Any", 14400),\n  proxy.addProxy(g3, "Any", 14400),\n])`}
                  speed={18}
                  delay={700}
                  className="whitespace-pre"
                />
              </div>

              {/* footer with avatars */}
              <div className="border-t border-stone-900 px-4 py-3.5 flex items-center justify-between gap-3 bg-stone-950/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    {["B", "C", "D"].map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6 + i * 0.12, type: "spring" }}
                        className="size-6 rounded-full bg-stone-800 border-2 border-stone-950 text-stone-300 text-[10px] flex items-center justify-center font-medium ring-1 ring-stone-700"
                      >
                        {c}
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-[11.5px] text-stone-500">
                    3 guardians bound
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 tabular-nums">
                  +21.7 POT gas
                </span>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-stone-900 bg-stone-950/40">
        <Marquee speed={32} className="py-4 text-stone-500">
          {MARQUEE_ITEMS.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-[12.5px]">
              {it.icon}
              <span>{it.label}</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* HOW */}
      <section id="how" className="border-b border-stone-900 grid-bg">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-12">
            <div className="md:col-span-5">
              <RevealItem>
                <p className="label">02 / mechanism</p>
              </RevealItem>
              <RevealItem as="h2" className="mt-4 font-display text-4xl md:text-[44px] leading-[1.05] text-stone-100 tracking-tight">
                A simple sequence,
                <br />
                <span className="italic text-stone-400">verifiable on chain.</span>
              </RevealItem>
              <RevealItem as="p" className="mt-5 text-[14.5px] text-stone-400 leading-relaxed max-w-md">
                We compose three Portaldot pallets into a recovery flow that&apos;s
                inspectable end-to-end. No magic, no oracles.
              </RevealItem>
            </div>

            <ol className="md:col-span-7 divide-y divide-stone-900 border-y border-stone-900">
              {STEPS.map((s, i) => (
                <Step key={s.title} index={i} {...s} />
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* WHY */}
      <section className="border-b border-stone-900">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Pillar
              n="01"
              icon={<Users className="size-4" />}
              title="M-of-N guardians"
              body="Pick the trust topology that fits your life — family, co-founders, three friends in different cities."
            />
            <Pillar
              n="02"
              icon={<Clock className="size-4" />}
              title="Time-lock by design"
              body="Every announce is followed by a configurable block delay. You stay in control during the window."
            />
            <Pillar
              n="03"
              icon={<Shield className="size-4" />}
              title="Native primitives"
              body="proxy + utility + balances. Audited code paths the runtime already exposes — nothing custom on chain."
            />
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-stone-900 bg-stone-950/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="grid grid-cols-2 md:grid-cols-4 gap-8" amount={0.3}>
            <BigStat label="Block time" value={6} suffix="s" />
            <BigStat label="Threshold range" value={32} prefix="1–" />
            <BigStat label="Active recoveries" value={0} />
            <BigStat label="POT decimals" value={14} />
          </Reveal>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="relative border-b border-stone-900 overflow-hidden">
        <Spotlight intensity={0.12} color="168, 85, 247" />
        <div className="relative mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <RevealItem>
              <p className="label">manifesto</p>
            </RevealItem>
            <RevealItem as="p" className="mt-6 font-display text-3xl md:text-[40px] leading-[1.18] text-stone-200 max-w-3xl tracking-tight">
              Self-custody is freedom. Permanent loss isn&apos;t a feature, it&apos;s
              a design failure.{" "}
              <span className="italic text-stone-500">
                PortalGuard is the missing primitive — friends as the safety net,
                encoded into the chain itself.
              </span>
            </RevealItem>
            <RevealItem>
              <Link
                href="/setup"
                className="mt-10 group inline-flex items-center gap-2 text-stone-200 underline underline-offset-4 decoration-stone-700 hover:decoration-emerald-400 transition-colors"
              >
                Start protecting an account
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealItem>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="mx-auto max-w-6xl px-6 h-16 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-stone-500">
          <span>
            PortalGuard · Mini Hackathon S1 ·{" "}
            <span className="text-stone-600">MIT</span>
          </span>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/EzraNahumury/portaldot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-200 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://portaldot-dev.readthedocs.io/en/latest/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-200 transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-2xl text-stone-100 tabular-nums">
        <AnimatedNumber value={value} />
      </dd>
    </div>
  );
}

function BigStat({
  label,
  value,
  suffix,
  prefix,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <RevealItem className="border-l border-stone-900 pl-6">
      <p className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        {label}
      </p>
      <p className="mt-3 font-display text-[44px] md:text-[56px] leading-none tracking-tight text-stone-100 tabular-nums">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} duration={1.4} />
      </p>
    </RevealItem>
  );
}

function Step({
  title,
  body,
  code,
  index,
}: {
  title: string;
  body: string;
  code?: string;
  index: number;
}) {
  return (
    <RevealItem
      as="li"
      className="py-5 grid grid-cols-12 gap-4 items-baseline group hover:bg-stone-950/40 transition-colors px-2 -mx-2 rounded-md"
    >
      <span className="col-span-1 font-mono text-[11px] text-stone-600 tabular-nums group-hover:text-emerald-400 transition-colors">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="col-span-11">
        <h3 className="text-[15px] text-stone-100 font-medium tracking-tight">
          {title}
        </h3>
        <p className="mt-1 text-[13.5px] text-stone-500 leading-relaxed">{body}</p>
        {code && (
          <code className="mt-3 inline-flex font-mono text-[11.5px] text-stone-300 bg-stone-950 border border-stone-800 px-2 py-1 rounded">
            {code}
          </code>
        )}
      </div>
    </RevealItem>
  );
}

function Pillar({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <RevealItem className="group relative border-t border-stone-900 pt-6 cursor-default">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[11px] text-stone-600">{n}</span>
        <span className="text-stone-500 group-hover:text-emerald-400 transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="mt-5 text-[16px] text-stone-100 font-medium tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] text-stone-500 leading-relaxed">{body}</p>
      <motion.span
        aria-hidden
        className="absolute -top-px left-0 h-px bg-emerald-400/60"
        initial={{ width: 0 }}
        whileInView={{ width: "30%" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </RevealItem>
  );
}

const MARQUEE_ITEMS = [
  { icon: <Sparkles className="size-3.5 text-emerald-400" />, label: "Native pallet primitives" },
  { icon: <Lock className="size-3.5 text-emerald-400" />, label: "On-chain time-lock" },
  { icon: <KeyRound className="size-3.5 text-emerald-400" />, label: "M-of-N off-chain coordination" },
  { icon: <Zap className="size-3.5 text-emerald-400" />, label: "POT used as gas at every step" },
  { icon: <Shield className="size-3.5 text-emerald-400" />, label: "MIT licensed, open source" },
  { icon: <Users className="size-3.5 text-emerald-400" />, label: "Up to 32 guardians per vault" },
];

const STEPS = [
  {
    title: "Owner attaches the guardian collective",
    body: "A single batched extrinsic adds each guardian as a delayed proxy on the owner's account. POT pays gas; a small POT deposit per proxy is reserved (refunded on remove).",
    code: "utility.batchAll([proxy.addProxy(...)])",
  },
  {
    title: "Guardians coordinate off-chain",
    body: "Through PortalGuard's UX, the guardian collective collects M-of-N approvals locally. Nothing is broadcast to the network during this phase — saving gas and signal.",
  },
  {
    title: "One guardian announces on chain",
    body: "When threshold is reached, one guardian signs proxy.announce(owner, callHash). The on-chain announcement starts the time-lock countdown.",
    code: "proxy.announce(owner, callHash)",
  },
  {
    title: "Owner has the cancel window",
    body: "During the configured block delay, the original owner — if they still have access — can cancel the announcement and stop the recovery dead.",
    code: "proxy.rejectAnnouncement(...)",
  },
  {
    title: "Anyone executes after the time-lock",
    body: "Once the delay elapses, anyone can submit proxy.proxyAnnounced. The inner balances.transferAll moves the vault's free balance to the new owner.",
    code: "proxy.proxyAnnounced(...)",
  },
];
