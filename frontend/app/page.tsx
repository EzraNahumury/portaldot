"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Clock,
  ArrowRight,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { fadeIn, fadeUp, popIn, stagger } from "@/lib/motion";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated gradient orb */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(217,70,239,0.05) 40%, transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-32">
          <motion.div
            variants={stagger(0.05, 0.12)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center text-center"
          >
            <motion.div
              variants={popIn}
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-4 py-1.5 text-xs font-medium text-violet-300 mb-8"
            >
              <Sparkles className="size-3" />
              Built native on Portaldot
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-semibold tracking-tight text-zinc-50 leading-[1.05] max-w-4xl"
            >
              Lose your keys.
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Keep your assets.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl text-lg text-zinc-400 leading-relaxed"
            >
              PortalGuard is a social recovery wallet for Portaldot. Designate
              trusted friends as guardians — if you ever lose access, they can
              collectively restore your account. No custodian. No backdoor. On-chain.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-3">
              <Link
                href="/setup"
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-medium transition-all shadow-[0_8px_30px_rgb(124,58,237,0.35)]"
              >
                Create your vault
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl border border-zinc-800 hover:bg-zinc-900 text-zinc-200 font-medium transition-colors"
              >
                Open dashboard
              </Link>
            </motion.div>

            <motion.p variants={fadeIn} className="mt-6 text-xs text-zinc-600">
              Hackathon prototype · MIT licensed · Don&apos;t use in production
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.div
            variants={stagger(0.05, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <Feature
              icon={<Users className="size-5" />}
              title="M-of-N guardians"
              body="Choose 2-of-3 family, 3-of-5 colleagues, or any threshold that fits your trust model."
            />
            <Feature
              icon={<Clock className="size-5" />}
              title="Time-lock safety"
              body="Every recovery has a configurable block-level delay. Owner can cancel a hostile takeover before execution."
            />
            <Feature
              icon={<KeyRound className="size-5" />}
              title="Native primitives"
              body="No custom contract — pallet_proxy, pallet_utility, and pallet_balances do the heavy lifting."
            />
          </motion.div>
        </div>
      </section>

      {/* Flow */}
      <section className="border-t border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-semibold text-zinc-100 max-w-2xl"
          >
            How a recovery actually works
          </motion.h2>
          <motion.div
            variants={stagger(0.05, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            className="mt-16 grid md:grid-cols-4 gap-6"
          >
            <Step
              n={1}
              title="Lose access"
              body="Phone gone, seed phrase lost. You generate a fresh keypair on a new device."
            />
            <Step
              n={2}
              title="Coordinate off-chain"
              body="Guardians collect M-of-N approvals through PortalGuard's UX (no chain spam)."
            />
            <Step
              n={3}
              title="Announce on-chain"
              body="One guardian submits proxy.announce — POT gas paid — the time-lock starts."
            />
            <Step
              n={4}
              title="Execute after delay"
              body="When time-lock elapses, anyone can call proxy.proxyAnnounced — funds move."
            />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-violet-400" />
            <span>PortalGuard · Mini Hackathon S1</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/EzraNahumury/portaldot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://portaldot-dev.readthedocs.io/en/latest/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              Portaldot Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 300 } }}
      className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-6 hover:border-zinc-800 transition-colors"
    >
      <div className="size-10 rounded-xl bg-violet-500/10 text-violet-300 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{body}</p>
    </motion.div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <motion.div variants={fadeUp} className="relative">
      <div className="text-7xl font-semibold text-zinc-900 leading-none">
        {String(n).padStart(2, "0")}
      </div>
      <h3 className="mt-2 text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{body}</p>
    </motion.div>
  );
}
