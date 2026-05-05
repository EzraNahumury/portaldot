"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardSection, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldHint } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import {
  buildBatchAddGuardiansTx,
  secondsToBlocks,
  signAndSend,
} from "@/lib/multisig";

const TIMELOCK_PRESETS: { label: string; seconds: number }[] = [
  { label: "1 min", seconds: 60 },
  { label: "10 min", seconds: 600 },
  { label: "1 hr", seconds: 3600 },
  { label: "24 hr", seconds: 86400 },
];

const itemMotion = {
  hidden: { opacity: 0, y: 6, scale: 0.99 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.18 } },
};

export default function SetupPage() {
  const router = useRouter();
  const account = usePortalStore((s) => s.account);
  const setVault = usePortalStore((s) => s.setVault);

  const [guardians, setGuardians] = useState<string[]>(["", "", ""]);
  const [threshold, setThreshold] = useState(2);
  const [timelockSeconds, setTimelockSeconds] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  const cleaned = guardians.map((g) => g.trim()).filter(Boolean);

  function updateGuardian(i: number, v: string) {
    setGuardians((arr) => arr.map((g, idx) => (idx === i ? v : g)));
  }
  function addGuardian() {
    if (guardians.length < 32) setGuardians([...guardians, ""]);
  }
  function removeGuardian(i: number) {
    if (guardians.length <= 1) return;
    setGuardians(guardians.filter((_, idx) => idx !== i));
    if (threshold > guardians.length - 1) setThreshold(guardians.length - 1);
  }

  async function handleProtect() {
    if (!account) return toast.error("Connect wallet first.");
    if (cleaned.length === 0) return toast.error("Add at least one guardian.");
    if (new Set(cleaned).size !== cleaned.length)
      return toast.error("Duplicate guardian addresses.");
    if (threshold < 1 || threshold > cleaned.length)
      return toast.error(`Threshold must be 1..${cleaned.length}.`);

    setSubmitting(true);
    setStatus("Connecting to Portaldot…");
    try {
      const api = await getApi();
      const delayBlocks = secondsToBlocks(timelockSeconds);
      const tx = buildBatchAddGuardiansTx(api, cleaned, delayBlocks);
      setStatus("Loading signer…");
      const signer = await getSigner(account.address);
      setStatus(`Signing utility.batchAll(${cleaned.length} × proxy.add_proxy)…`);
      const { blockHash } = await signAndSend(tx, account.address, signer, (s) =>
        setStatus(s),
      );
      setVault({
        ownerAddress: account.address,
        guardians: cleaned,
        threshold,
        timelockBlocks: delayBlocks,
        guardianMultisig: "",
      });
      toast.success(`Vault protected — ${blockHash.slice(0, 10)}…`);
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
      {/* LEFT: form */}
      <section className="lg:col-span-7 space-y-8">
        <header>
          <p className="label">Setup · 01 of 01</p>
          <h1 className="mt-3 font-display text-[42px] leading-[1.05] tracking-tight text-stone-100">
            Protect your account.
          </h1>
          <p className="mt-3 text-stone-400 text-[14.5px] max-w-xl leading-relaxed">
            Bind a roster of trusted addresses to your account. Each one becomes a
            delayed proxy. Recovery only fires after your time-lock — and only on
            the inner call your guardians collectively approved.
          </p>
        </header>

        <Card>
          <CardSection>
            <CardEyebrow>Guardian list</CardEyebrow>
            <CardTitle>Who do you trust?</CardTitle>
            <CardDescription>
              Add 1 to 32 SS58 addresses. Family, co-founders, three friends in
              different timezones — your topology, your call.
            </CardDescription>
            <div className="mt-6 space-y-2">
              <AnimatePresence initial={false}>
                {guardians.map((g, i) => (
                  <motion.div
                    key={i}
                    variants={itemMotion}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layout
                    className="flex gap-2"
                  >
                    <span className="flex items-center justify-center size-10 rounded-md border border-stone-800 bg-stone-950 text-[11px] font-mono text-stone-500 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Input
                      placeholder="5G…"
                      value={g}
                      onChange={(e) => updateGuardian(i, e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => removeGuardian(i)}
                      disabled={guardians.length <= 1}
                      aria-label="Remove guardian"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button variant="ghost" size="sm" onClick={addGuardian}>
                <Plus className="size-3.5" />
                Add guardian
              </Button>
            </div>
          </CardSection>

          <CardSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label>Threshold (M of N)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(1, cleaned.length || 1)}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="max-w-[6rem]"
                  />
                  <span className="text-sm text-stone-500">
                    of <span className="text-stone-300 tabular-nums">{cleaned.length || 0}</span>{" "}
                    guardians
                  </span>
                </div>
                <FieldHint>
                  Enforced in the UX layer — guardians collect off-chain approvals
                  before any on-chain announce.
                </FieldHint>
              </div>

              <div>
                <Label>Time-lock</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {TIMELOCK_PRESETS.map((p) => {
                    const active = p.seconds === timelockSeconds;
                    return (
                      <button
                        key={p.seconds}
                        onClick={() => setTimelockSeconds(p.seconds)}
                        className={`h-8 px-2.5 rounded-md text-[12.5px] border transition-colors ${
                          active
                            ? "bg-stone-100/[0.06] border-stone-700/60 text-stone-100"
                            : "bg-stone-950 border-stone-900 text-stone-500 hover:text-stone-200 hover:border-stone-800"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <FieldHint>
                  ~{secondsToBlocks(timelockSeconds)} block delay (~6s/block).
                </FieldHint>
              </div>
            </div>
          </CardSection>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-stone-500 font-mono truncate max-w-md">
            {status || " "}
          </p>
          <Button onClick={handleProtect} loading={submitting} disabled={!account} size="lg">
            Protect account
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </section>

      {/* RIGHT: summary preview */}
      <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start space-y-5">
        <p className="label">What happens on chain</p>

        <Card>
          <CardSection>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-stone-500">EXTRINSIC</span>
              <Badge tone="ok" dot>
                ready
              </Badge>
            </div>
            <code className="block font-mono text-[12.5px] text-stone-200 leading-relaxed">
              utility.batchAll([
              <br />
              {cleaned.length === 0 ? (
                <>
                  <span className="ml-4 text-stone-600">// add guardians to populate</span>
                  <br />
                </>
              ) : (
                cleaned.map((g, i) => (
                  <span key={i} className="block ml-4 text-stone-300">
                    proxy.addProxy(<span className="text-emerald-300">{g.slice(0, 6)}…{g.slice(-4)}</span>, &quot;Any&quot;,{" "}
                    <span className="text-stone-200 tabular-nums">{secondsToBlocks(timelockSeconds)}</span>),
                  </span>
                ))
              )}
              ])
            </code>
          </CardSection>

          <CardSection>
            <CardEyebrow>Receipts you&apos;ll see</CardEyebrow>
            <ul className="mt-2 space-y-2.5 text-[13px] text-stone-400">
              <li className="flex gap-3">
                <span className="font-mono text-stone-600 shrink-0">→</span>
                <span>
                  <span className="text-stone-200">{cleaned.length || "N"}× ProxyAdded</span>{" "}
                  events emitted under your account
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-stone-600 shrink-0">→</span>
                <span>
                  POT deposit reserved per proxy{" "}
                  <span className="text-stone-500">(refunded on remove)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-stone-600 shrink-0">→</span>
                <span>One Utility::BatchCompleted event for the whole call</span>
              </li>
            </ul>
          </CardSection>
        </Card>

        <p className="text-[11.5px] text-stone-600 leading-relaxed">
          Nothing is broadcast until you sign. The list above updates live as you
          edit the form so you always see exactly what you&apos;re committing to.
        </p>
      </aside>
    </div>
  );
}
