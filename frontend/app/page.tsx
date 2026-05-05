"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 240, damping: 28 },
  },
};

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-14">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="md:col-span-7"
          >
            <motion.div variants={item}>
              <Badge tone="ok" dot pulse>
                <span className="font-mono text-[10.5px]">on portaldot · live</span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-7 font-display text-[64px] md:text-[88px] leading-[0.95] tracking-tight text-stone-50"
            >
              Lose your keys.
              <br />
              <span className="italic text-stone-400">Keep</span> your assets.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-7 max-w-xl text-[15px] text-stone-400 leading-[1.65]"
            >
              PortalGuard turns trusted friends into a programmable recovery key.
              When your seed phrase is gone, a guardian collective coordinates a
              time-locked transfer of your account — fully on chain, no custodian.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex items-center gap-3">
              <Link
                href="/setup"
                className="group inline-flex items-center gap-2 h-11 px-5 rounded-md bg-stone-100 text-stone-950 text-sm font-medium hover:bg-white transition-colors"
              >
                Create your vault
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how"
                className="text-sm text-stone-400 hover:text-stone-100 underline underline-offset-4 decoration-stone-800 hover:decoration-stone-500 transition-colors"
              >
                How it works
              </Link>
            </motion.div>

            <motion.dl
              variants={item}
              className="mt-14 grid grid-cols-3 gap-x-8 max-w-md border-t border-stone-900 pt-6"
            >
              <Metric label="Pallets used" value="3" />
              <Metric label="Contracts" value="0" />
              <Metric label="Custodians" value="0" />
            </motion.dl>
          </motion.div>

          {/* Right: editorial side panel */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 28 }}
            className="md:col-span-5 md:pt-2"
          >
            <div className="rounded-lg border border-stone-900 bg-stone-950/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 h-9 border-b border-stone-900 bg-stone-950/60">
                <span className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                  Sample vault
                </span>
                <Badge tone="ok" dot>
                  Healthy
                </Badge>
              </div>

              <div className="px-4 py-4 space-y-4 font-mono text-[12px]">
                <Row label="owner" value="5Grw…GKuq" />
                <Row label="guardians" value="3 of 3" />
                <Row label="threshold" value="2 of 3" />
                <Row label="time-lock" value="24h" />
                <Row label="balance" value="100 POT" highlight />
              </div>

              <div className="border-t border-stone-900 px-4 py-3.5 flex items-center gap-3 bg-stone-950/60">
                <div className="flex -space-x-1.5">
                  {["B", "C", "D"].map((c, i) => (
                    <div
                      key={i}
                      className="size-6 rounded-full bg-stone-800 border border-stone-950 text-stone-300 text-[10px] flex items-center justify-center font-medium"
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <span className="text-[11.5px] text-stone-500">
                  bound via pallet_proxy
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11.5px] text-stone-600">
              Real-time state preview. Every field is read directly from chain.
            </p>
          </motion.aside>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-stone-900 grid-bg">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-12">
            <div className="md:col-span-5">
              <p className="label">02 / mechanism</p>
              <h2 className="mt-4 font-display text-4xl md:text-[44px] leading-[1.05] text-stone-100 tracking-tight">
                A simple sequence,
                <br />
                <span className="italic text-stone-400">verifiable on chain.</span>
              </h2>
              <p className="mt-5 text-[14.5px] text-stone-400 leading-relaxed max-w-md">
                We compose three Portaldot pallets into a recovery flow that&apos;s
                inspectable end-to-end. No magic, no oracles.
              </p>
            </div>

            <ol className="md:col-span-7 divide-y divide-stone-900 border-y border-stone-900">
              {STEPS.map((s, i) => (
                <li key={s.title} className="py-5 grid grid-cols-12 gap-4 items-baseline">
                  <span className="col-span-1 font-mono text-[11px] text-stone-600 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="col-span-11">
                    <h3 className="text-[15px] text-stone-100 font-medium tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-[13.5px] text-stone-500 leading-relaxed">
                      {s.body}
                    </p>
                    {s.code && (
                      <code className="mt-3 inline-flex font-mono text-[11.5px] text-stone-300 bg-stone-950 border border-stone-800 px-2 py-1 rounded">
                        {s.code}
                      </code>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="border-t border-stone-900">
        <div className="mx-auto max-w-6xl px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-10">
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
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-t border-stone-900">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <p className="label">manifesto</p>
          <p className="mt-6 font-display text-3xl md:text-[40px] leading-[1.18] text-stone-200 max-w-3xl tracking-tight">
            Self-custody is freedom. Permanent loss isn&apos;t a feature, it&apos;s a
            design failure.{" "}
            <span className="italic text-stone-500">
              PortalGuard is the missing primitive — friends as the safety net,
              encoded into the chain itself.
            </span>
          </p>
          <Link
            href="/setup"
            className="mt-10 inline-flex items-center gap-2 text-stone-200 underline underline-offset-4 decoration-stone-700 hover:decoration-stone-300 transition-colors"
          >
            Start protecting an account
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-900">
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-2xl text-stone-100 tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={highlight ? "text-emerald-300" : "text-stone-200"}>
        {value}
      </span>
    </div>
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
    <div className="border-t border-stone-900 pt-6">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[11px] text-stone-600">{n}</span>
        <span className="text-stone-500">{icon}</span>
      </div>
      <h3 className="mt-5 text-[16px] text-stone-100 font-medium tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] text-stone-500 leading-relaxed">{body}</p>
    </div>
  );
}

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
