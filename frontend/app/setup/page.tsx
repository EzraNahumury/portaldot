"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Stepper } from "@/components/ui/Stepper";
import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SuccessCheck } from "@/components/ui/SuccessCheck";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import {
  buildBatchAddGuardiansTx,
  secondsToBlocks,
  signAndSend,
} from "@/lib/multisig";
import { shortAddr } from "@/lib/format";

const STEPS = [
  { id: "guardians", label: "Guardians" },
  { id: "threshold", label: "Threshold" },
  { id: "timelock", label: "Time-lock" },
  { id: "review", label: "Review" },
];

const TIMELOCK_PRESETS = [
  { label: "1 minute", seconds: 60, hint: "Demo / testing" },
  { label: "10 minutes", seconds: 600, hint: "Quick recovery" },
  { label: "1 hour", seconds: 3600, hint: "Balanced" },
  { label: "24 hours", seconds: 86400, hint: "Maximum safety" },
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

  const [step, setStep] = useState(0);
  const [guardians, setGuardians] = useState<string[]>(["", "", ""]);
  const [threshold, setThreshold] = useState(2);
  const [timelockSeconds, setTimelockSeconds] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const cleaned = useMemo(
    () => guardians.map((g) => g.trim()).filter(Boolean),
    [guardians],
  );

  function next() {
    if (step === 0) {
      if (cleaned.length === 0) return toast.error("Add at least one guardian.");
      if (new Set(cleaned).size !== cleaned.length)
        return toast.error("Duplicate guardian addresses.");
    }
    if (step === 1) {
      if (threshold < 1 || threshold > cleaned.length)
        return toast.error(`Threshold must be 1..${cleaned.length}.`);
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleProtect() {
    if (!account) return toast.error("Connect wallet first.");
    setSubmitting(true);
    try {
      const api = await getApi();
      const delayBlocks = secondsToBlocks(timelockSeconds);
      const tx = buildBatchAddGuardiansTx(api, cleaned, delayBlocks);
      const signer = await getSigner(account.address);
      const { blockHash } = await signAndSend(tx, account.address, signer, () => {});
      setVault({
        ownerAddress: account.address,
        guardians: cleaned,
        threshold,
        timelockBlocks: delayBlocks,
        guardianMultisig: "",
      });
      setDone(true);
      toast.success(`Vault protected — ${blockHash.slice(0, 10)}…`);
      setTimeout(() => router.push("/dashboard"), 1400);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md w-full px-6 py-32 text-center">
        <div className="flex justify-center">
          <SuccessCheck size={72} />
        </div>
        <h1 className="mt-6 font-display text-3xl text-stone-100 tracking-tight">
          Vault protected.
        </h1>
        <p className="mt-3 text-[13px] text-stone-500">
          Routing to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-12">
      <header className="mb-10">
        <p className="text-[10.5px] tracking-[0.16em] uppercase text-stone-500 font-medium mb-3">
          Setup
        </p>
        <h1 className="font-display text-[34px] md:text-[42px] tracking-tight text-stone-100 leading-tight">
          Protect your account.
        </h1>
      </header>

      <Stepper steps={STEPS} current={step} className="mb-10" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {step === 0 && (
            <GlowCard className="p-6">
              <div className="mb-5">
                <h2 className="text-[16px] text-stone-100 font-medium tracking-tight">
                  Who do you trust?
                </h2>
                <p className="mt-1 text-[12.5px] text-stone-500">
                  Add SS58 addresses. 1 to 32 entries.
                </p>
              </div>
              <div className="space-y-2">
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
                        onChange={(e) =>
                          setGuardians((arr) =>
                            arr.map((x, idx) => (idx === i ? e.target.value : x)),
                          )
                        }
                        className="font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          if (guardians.length <= 1) return;
                          setGuardians(guardians.filter((_, idx) => idx !== i));
                          if (threshold > guardians.length - 1)
                            setThreshold(guardians.length - 1);
                        }}
                        disabled={guardians.length <= 1}
                        aria-label="Remove guardian"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => guardians.length < 32 && setGuardians([...guardians, ""])}
                >
                  <Plus className="size-3.5" />
                  Add guardian
                </Button>
              </div>
            </GlowCard>
          )}

          {step === 1 && (
            <GlowCard className="p-6">
              <div className="mb-5">
                <h2 className="text-[16px] text-stone-100 font-medium tracking-tight">
                  How many signatures to recover?
                </h2>
                <p className="mt-1 text-[12.5px] text-stone-500">
                  Threshold of {cleaned.length} guardians.
                </p>
              </div>

              <div className="flex items-center gap-4 my-8">
                <span className="font-display text-[64px] text-stone-100 tabular-nums leading-none">
                  {threshold}
                </span>
                <span className="text-stone-600 text-2xl">/</span>
                <span className="font-display text-[28px] text-stone-500 tabular-nums leading-none">
                  {cleaned.length}
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={Math.max(1, cleaned.length)}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />

              <div className="mt-2 flex items-center justify-between text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                <span>Lenient</span>
                <span>Strict</span>
              </div>
            </GlowCard>
          )}

          {step === 2 && (
            <GlowCard className="p-6">
              <div className="mb-5">
                <h2 className="text-[16px] text-stone-100 font-medium tracking-tight">
                  Time-lock window
                </h2>
                <p className="mt-1 text-[12.5px] text-stone-500">
                  How long you have to cancel a recovery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TIMELOCK_PRESETS.map((p) => {
                  const active = p.seconds === timelockSeconds;
                  return (
                    <button
                      key={p.seconds}
                      onClick={() => setTimelockSeconds(p.seconds)}
                      className={`relative text-left p-4 rounded-lg border transition-all ${
                        active
                          ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                          : "border-stone-800 bg-stone-950/50 hover:border-stone-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[14px] font-medium ${
                            active ? "text-stone-100" : "text-stone-300"
                          }`}
                        >
                          {p.label}
                        </span>
                        {active && (
                          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        )}
                      </div>
                      <p className="text-[11.5px] text-stone-500">{p.hint}</p>
                      <p className="mt-2 text-[10.5px] text-stone-600 font-mono">
                        ~{secondsToBlocks(p.seconds)} blocks
                      </p>
                    </button>
                  );
                })}
              </div>
            </GlowCard>
          )}

          {step === 3 && (
            <GlowCard className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-[16px] text-stone-100 font-medium tracking-tight">
                    Review &amp; sign
                  </h2>
                  <p className="mt-1 text-[12.5px] text-stone-500">
                    One batched extrinsic. Owner pays the gas.
                  </p>
                </div>
                <Badge tone="ok" dot pulse>
                  ready
                </Badge>
              </div>

              <div className="space-y-3">
                <ReviewRow label="Guardians" value={`${cleaned.length}`} />
                <ReviewRow
                  label="Threshold"
                  value={`${threshold}-of-${cleaned.length}`}
                />
                <ReviewRow
                  label="Time-lock"
                  value={`${
                    TIMELOCK_PRESETS.find((p) => p.seconds === timelockSeconds)?.label ??
                    `${timelockSeconds}s`
                  }`}
                />
                <ReviewRow
                  label="Owner"
                  value={
                    account ? (
                      <code className="font-mono text-[12px] text-stone-300">
                        {shortAddr(account.address, 6, 6)}
                      </code>
                    ) : (
                      <span className="text-amber-300 text-[12px]">
                        Connect wallet
                      </span>
                    )
                  }
                />
              </div>

              <div className="mt-5 rounded-md bg-stone-900/40 border border-stone-800 p-3">
                <code className="block text-[11.5px] font-mono text-stone-400 leading-relaxed">
                  utility.batchAll([
                  <br />
                  {cleaned.slice(0, 3).map((g, i) => (
                    <span key={i} className="block ml-3 text-stone-300">
                      proxy.addProxy(
                      <span className="text-emerald-300">
                        {g.slice(0, 6)}…{g.slice(-4)}
                      </span>
                      ,{" "}
                      <span className="tabular-nums">
                        {secondsToBlocks(timelockSeconds)}
                      </span>
                      ),
                    </span>
                  ))}
                  {cleaned.length > 3 && (
                    <span className="block ml-3 text-stone-600">
                      // …{cleaned.length - 3} more
                    </span>
                  )}
                  ])
                </code>
              </div>
            </GlowCard>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          size="md"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} size="md">
            Continue
            <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <Button
            onClick={handleProtect}
            loading={submitting}
            disabled={!account}
            size="md"
          >
            <ShieldCheck className="size-3.5" />
            Protect account
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-stone-900 pb-2.5 last:border-b-0">
      <span className="text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        {label}
      </span>
      <span className="text-[13.5px] text-stone-100 tabular-nums">{value}</span>
    </div>
  );
}
