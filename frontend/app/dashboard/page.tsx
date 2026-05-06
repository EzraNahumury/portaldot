"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Play,
  Ban,
  CircleAlert,
  ShieldCheck,
  Plus,
  Activity,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BentoGrid, BentoCell } from "@/components/ui/BentoGrid";
import { SecurityScore } from "@/components/ui/SecurityScore";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import { GlowCard } from "@/components/ui/GlowCard";
import { GuardianList } from "@/components/GuardianList";
import { RecoveryStatus } from "@/components/RecoveryStatus";
import { CountdownTimer } from "@/components/CountdownTimer";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import {
  buildRejectAnnouncementTx,
  buildBatchAddGuardiansTx,
  buildRemoveGuardianProxyTx,
  buildProxyAnnouncedTx,
  buildRecoveryInnerCall,
  readOwnerProxies,
  readGuardianAnnouncements,
  signAndSend,
  getCurrentBlock,
  loadRecoveryProposal,
  clearRecoveryProposal,
  type GuardianProxy,
  type AnnouncementInfo,
  type RecoveryProposal,
  BLOCK_TIME_MS,
} from "@/lib/multisig";
import { shortAddr, formatTimeRemaining } from "@/lib/format";

export default function DashboardPage() {
  const account = usePortalStore((s) => s.account);
  const vault = usePortalStore((s) => s.vault);
  const resetVault = usePortalStore((s) => s.resetVault);

  const [proxies, setProxies] = useState<GuardianProxy[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementInfo[]>([]);
  const [proposal, setProposal] = useState<RecoveryProposal | null>(null);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    if (!vault?.ownerAddress) return;
    setLoading(true);
    try {
      const api = await getApi();
      const block = await getCurrentBlock(api);
      setCurrentBlock(block);

      const px = await readOwnerProxies(api, vault.ownerAddress);
      setProxies(px);

      const all: AnnouncementInfo[] = [];
      for (const p of px) {
        if (!vault.guardians.includes(p.delegate)) continue;
        const annsForGuardian = await readGuardianAnnouncements(
          api,
          p.delegate,
          vault.ownerAddress,
          p.delay,
          block,
        );
        all.push(...annsForGuardian);
      }
      setAnnouncements(all);

      setProposal(loadRecoveryProposal(vault.ownerAddress));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [vault]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  async function handleRejectAnnouncement(ann: AnnouncementInfo) {
    if (!account || !vault) return;
    setActing(true);
    try {
      const api = await getApi();
      const tx = buildRejectAnnouncementTx(api, ann.guardian, ann.callHash);
      const signer = await getSigner(account.address);
      await signAndSend(tx, account.address, signer, (s) => toast.message(s));
      toast.success("Announcement rejected.");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }
  async function handleExecute(ann: AnnouncementInfo) {
    if (!account || !vault) return;
    if (!proposal?.newOwner)
      return toast.error("No proposal in cache. Re-create from /recover.");
    if (ann.remainingBlocks > 0)
      return toast.error(`Time-lock still active (${ann.remainingBlocks} blocks).`);
    setActing(true);
    try {
      const api = await getApi();
      const inner = buildRecoveryInnerCall(api, proposal.newOwner);
      const tx = buildProxyAnnouncedTx(api, ann.guardian, vault.ownerAddress, inner);
      const signer = await getSigner(account.address);
      await signAndSend(tx, account.address, signer, (s) => toast.message(s));
      toast.success("Recovery executed.");
      clearRecoveryProposal(vault.ownerAddress);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }
  async function handleAddMissingProxies() {
    if (!account || !vault) return;
    const missing = vault.guardians.filter(
      (g) => !proxies.some((p) => p.delegate === g),
    );
    if (missing.length === 0) return toast.message("Nothing missing.");
    setActing(true);
    try {
      const api = await getApi();
      const tx = buildBatchAddGuardiansTx(api, missing, vault.timelockBlocks);
      const signer = await getSigner(account.address);
      await signAndSend(tx, account.address, signer, (s) => toast.message(s));
      toast.success("Missing guardian proxies added.");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }
  async function handleDetach() {
    if (!account || !vault) return;
    setActing(true);
    try {
      const api = await getApi();
      const calls = vault.guardians.map((g) =>
        buildRemoveGuardianProxyTx(api, g, vault.timelockBlocks),
      );
      const batch = api.tx.utility.batchAll(calls);
      const signer = await getSigner(account.address);
      await signAndSend(batch, account.address, signer, (s) => toast.message(s));
      toast.success("All guardian proxies removed.");
      resetVault();
      clearRecoveryProposal(vault.ownerAddress);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  const proxiesAttached = useMemo(
    () =>
      vault
        ? vault.guardians.filter((g) => proxies.some((p) => p.delegate === g)).length
        : 0,
    [vault, proxies],
  );

  const status: "none" | "active" | "approved" | "executable" = useMemo(() => {
    if (announcements.length > 0) {
      return announcements[0].remainingBlocks === 0 ? "executable" : "approved";
    }
    if (proposal && vault && proposal.approvals.length < vault.threshold) return "active";
    return "none";
  }, [announcements, proposal, vault]);

  const readiness = useMemo(() => {
    if (!vault) return 0;
    let s = 0;
    if (proxiesAttached === vault.guardians.length && vault.guardians.length > 0) s += 0.5;
    if (vault.threshold > 1) s += 0.2;
    if (vault.timelockBlocks >= 10) s += 0.3;
    return Math.min(1, s);
  }, [vault, proxiesAttached]);

  const activity = useMemo(() => {
    if (!vault) return [];
    const items: Parameters<typeof ActivityFeed>[0]["items"] = [];
    announcements.forEach((a) => {
      items.push({
        id: `ann-${a.callHash}`,
        icon: <CircleAlert className="size-3.5" />,
        title: `Announce by ${shortAddr(a.guardian, 5, 4)}`,
        meta: `${a.remainingBlocks > 0 ? `${a.remainingBlocks} blocks left` : "executable now"}`,
        tone: a.remainingBlocks === 0 ? "warn" : "info",
      });
    });
    if (proposal) {
      items.push({
        id: `prop-${proposal.proposedAt}`,
        icon: <Activity className="size-3.5" />,
        title: `Proposal · ${proposal.approvals.length}/${vault.threshold} signed`,
        meta: `→ ${shortAddr(proposal.newOwner, 5, 4)}`,
        tone: "warn",
      });
    }
    if (proxiesAttached === vault.guardians.length && vault.guardians.length > 0) {
      items.push({
        id: "proxies-set",
        icon: <ShieldCheck className="size-3.5" />,
        title: `All ${proxiesAttached} guardian proxies attached`,
        meta: "via pallet_proxy",
        tone: "ok",
      });
    }
    return items;
  }, [vault, announcements, proposal, proxiesAttached]);

  if (!vault) return <EmptyState />;

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-12 space-y-8">
      {/* Hero strip */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10.5px] tracking-[0.16em] uppercase text-stone-500 font-medium">
            Vault
          </p>
          <h1 className="mt-3 font-display text-[34px] md:text-[42px] tracking-tight text-stone-100 leading-tight truncate">
            {shortAddr(vault.ownerAddress, 6, 6)}
          </h1>
          <button
            onClick={() => handleCopy(vault.ownerAddress)}
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-mono text-stone-500 hover:text-stone-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" /> copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> copy address
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <RecoveryStatus status={status} />
          <Button onClick={refresh} loading={loading} variant="secondary" size="sm">
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bento layout */}
      <BentoGrid>
        {/* Vault overview big tile */}
        <BentoCell colSpan={4} rowSpan={2} delay={0}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10.5px] tracking-[0.16em] uppercase text-stone-500 font-medium">
                Configuration
              </p>
              <h3 className="mt-2 text-[16px] font-medium text-stone-100 tracking-tight">
                Recovery topology
              </h3>
            </div>
            <Badge tone={proxiesAttached === vault.guardians.length ? "ok" : "warn"} dot>
              {proxiesAttached}/{vault.guardians.length} on chain
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Stat
              label="Threshold"
              value={`${vault.threshold} of ${vault.guardians.length}`}
            />
            <Stat
              label="Time-lock"
              value={formatTimeRemaining(vault.timelockBlocks * BLOCK_TIME_MS)}
            />
            <Stat label="Block" value={`#${currentBlock || "—"}`} mono />
          </div>
          <div className="mt-6 pt-5 border-t border-stone-900 flex flex-wrap items-center gap-2">
            {proxiesAttached < vault.guardians.length && (
              <Button onClick={handleAddMissingProxies} loading={acting} size="sm">
                <Plus className="size-3.5" />
                Add {vault.guardians.length - proxiesAttached} missing
              </Button>
            )}
            <Button onClick={handleDetach} loading={acting} variant="ghost" size="sm">
              <Trash2 className="size-3.5" />
              Detach all
            </Button>
            <Link
              href="/recover"
              className="ml-auto text-[12px] text-stone-400 hover:text-stone-100 underline underline-offset-4 decoration-stone-700"
            >
              start recovery →
            </Link>
          </div>
        </BentoCell>

        {/* Security score small */}
        <BentoCell colSpan={2} rowSpan={2} delay={0.05}>
          <p className="text-[10.5px] tracking-[0.16em] uppercase text-stone-500 font-medium">
            Readiness
          </p>
          <div className="mt-3 flex justify-center">
            <SecurityScore value={readiness} size={140} label="Readiness" />
          </div>
          <p className="mt-2 text-[11.5px] text-stone-500 text-center leading-relaxed">
            {readiness >= 0.9
              ? "Vault is fully prepared."
              : readiness >= 0.5
              ? "Almost there. Add missing proxies."
              : "Time-lock or proxies need work."}
          </p>
        </BentoCell>

        {/* Guardian roster medium */}
        <BentoCell colSpan={3} rowSpan={2} delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-stone-400" />
              <p className="text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                Guardian roster
              </p>
            </div>
            <span className="text-[11px] text-stone-500 font-mono tabular-nums">
              {vault.guardians.length}
            </span>
          </div>
          <GuardianList
            guardians={vault.guardians}
            approvals={proxies
              .filter((p) => vault.guardians.includes(p.delegate))
              .map((p) => p.delegate)}
            threshold={undefined}
          />
        </BentoCell>

        {/* Active recovery medium */}
        <BentoCell colSpan={3} rowSpan={2} delay={0.15}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
              Active recovery
            </p>
            <RecoveryStatus status={status} />
          </div>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <motion.div
                  key={`${ann.guardian}-${ann.callHash}`}
                  layout
                  className="rounded-md border border-stone-800 bg-stone-950/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <code className="font-mono text-[12px] text-stone-300">
                      {shortAddr(ann.guardian, 6, 4)}
                    </code>
                    <CountdownTimer
                      targetTimestampMs={Date.now() + ann.remainingBlocks * BLOCK_TIME_MS}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleExecute(ann)}
                      loading={acting}
                      variant="primary"
                      size="sm"
                      disabled={ann.remainingBlocks > 0}
                    >
                      <Play className="size-3.5" />
                      Execute
                    </Button>
                    <Button
                      onClick={() => handleRejectAnnouncement(ann)}
                      loading={acting}
                      variant="danger"
                      size="sm"
                    >
                      <Ban className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : proposal ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.04] p-4">
              <p className="text-[12px] text-amber-200/80">Off-chain proposal</p>
              <p className="mt-1 text-[13px] text-stone-200">
                Target:{" "}
                <code className="font-mono">{shortAddr(proposal.newOwner)}</code>
              </p>
              <p className="mt-1 text-[11.5px] text-amber-300/70">
                {proposal.approvals.length}/{vault.threshold} signed
              </p>
              <Link
                href="/recover"
                className="mt-3 inline-block text-[12px] text-violet-300 hover:text-violet-200"
              >
                manage proposal →
              </Link>
            </div>
          ) : (
            <div className="text-[12.5px] text-stone-500 italic flex flex-col items-center justify-center min-h-[120px]">
              <ShieldCheck className="size-7 text-stone-700 mb-2" />
              All clear. No recovery in progress.
            </div>
          )}
        </BentoCell>

        {/* Activity feed wide */}
        <BentoCell colSpan={6} rowSpan={1} delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-3.5 text-stone-400" />
              <p className="text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                Activity
              </p>
            </div>
          </div>
          <ActivityFeed items={activity} />
        </BentoCell>
      </BentoGrid>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        {label}
      </p>
      <p
        className={`mt-1.5 text-[18px] text-stone-100 tabular-nums leading-none ${
          mono ? "font-mono text-[14px]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md w-full px-6 py-32 text-center">
      <div className="mx-auto size-12 rounded-full border border-stone-800 bg-stone-900/40 flex items-center justify-center text-stone-500 mb-4">
        <ShieldCheck className="size-5" />
      </div>
      <h1 className="font-display text-2xl text-stone-100 tracking-tight mb-2">
        No vault loaded
      </h1>
      <p className="text-[13px] text-stone-500 mb-8">
        Connect a wallet, then create your vault.
      </p>
      <Link
        href="/setup"
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-stone-100 text-stone-950 text-[13px] font-medium hover:bg-white transition-colors"
      >
        Create vault
      </Link>
    </div>
  );
}
