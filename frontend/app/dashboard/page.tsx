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
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardSection, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Stat } from "@/components/ui/Stat";
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

type TabId = "overview" | "guardians" | "activity";

export default function DashboardPage() {
  const account = usePortalStore((s) => s.account);
  const vault = usePortalStore((s) => s.vault);
  const resetVault = usePortalStore((s) => s.resetVault);

  const [tab, setTab] = useState<TabId>("overview");
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

  if (!vault) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-12">
      {/* HEADER STRIP */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <p className="label">Vault</p>
          <h1 className="mt-3 font-display text-[34px] leading-tight tracking-tight text-stone-100">
            {shortAddr(vault.ownerAddress, 6, 6)}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => handleCopy(vault.ownerAddress)}
              className="inline-flex items-center gap-1.5 text-[12px] font-mono text-stone-500 hover:text-stone-300 transition-colors"
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
            <span className="text-stone-700">·</span>
            <span className="text-[12px] font-mono text-stone-500">
              block #{currentBlock}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RecoveryStatus status={status} />
          <Button onClick={refresh} loading={loading} variant="secondary" size="sm">
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 border-y border-stone-900 py-6 mb-10">
        <Stat
          label="Guardians on chain"
          value={
            <span>
              <span className="text-stone-100">{proxiesAttached}</span>
              <span className="text-stone-500">/{vault.guardians.length}</span>
            </span>
          }
        />
        <Stat label="Threshold" value={`${vault.threshold} of ${vault.guardians.length}`} />
        <Stat
          label="Time-lock"
          value={formatTimeRemaining(vault.timelockBlocks * BLOCK_TIME_MS)}
        />
        <Stat
          label="Pending recoveries"
          value={announcements.length + (proposal ? 1 : 0)}
        />
      </div>

      {/* TABS */}
      <div className="flex items-center justify-between mb-6">
        <Tabs
          items={[
            { id: "overview", label: "Overview" },
            { id: "guardians", label: "Guardians", count: vault.guardians.length },
            { id: "activity", label: "Activity", count: announcements.length },
          ]}
          active={tab}
          onChange={(t) => setTab(t as TabId)}
        />
        <div className="hidden md:flex items-center gap-2">
          {proxiesAttached < vault.guardians.length && (
            <Button onClick={handleAddMissingProxies} loading={acting} size="sm">
              Add missing ({vault.guardians.length - proxiesAttached})
            </Button>
          )}
          <Button onClick={handleDetach} loading={acting} variant="ghost" size="sm">
            <Trash2 className="size-3.5" />
            Detach all
          </Button>
        </div>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {tab === "overview" && (
          <>
            <Card className="lg:col-span-7">
              <CardSection>
                <CardEyebrow>Active recovery</CardEyebrow>
                {announcements.length > 0 ? (
                  <CardDescription>
                    A guardian has announced. Time-lock is counting down.
                  </CardDescription>
                ) : proposal ? (
                  <CardDescription>
                    Off-chain proposal in flight — collecting approvals.
                  </CardDescription>
                ) : (
                  <CardDescription>
                    No recovery is in progress. Vault is healthy.
                  </CardDescription>
                )}

                {announcements.map((ann) => (
                  <div
                    key={`${ann.guardian}-${ann.callHash}`}
                    className="mt-5 rounded-md border border-stone-800 bg-stone-950 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                        Announced by
                      </span>
                      <span className="font-mono text-[12px] text-stone-300">
                        {shortAddr(ann.guardian, 8, 6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CountdownTimer
                        targetTimestampMs={
                          Date.now() + ann.remainingBlocks * BLOCK_TIME_MS
                        }
                      />
                      <span className="text-[12px] font-mono text-stone-500 tabular-nums">
                        executable @ #{ann.executableAt}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
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
                  </div>
                ))}

                {announcements.length === 0 && proposal && (
                  <div className="mt-5 rounded-md border border-stone-800 bg-stone-950 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                        Proposal
                      </span>
                      <Badge tone="warn" dot>
                        {proposal.approvals.length}/{vault.threshold} signed
                      </Badge>
                    </div>
                    <p className="text-[13px] text-stone-300 leading-relaxed">
                      New owner:{" "}
                      <code className="font-mono text-stone-100">
                        {shortAddr(proposal.newOwner, 6, 6)}
                      </code>
                    </p>
                    <p className="text-[12px] text-stone-500 mt-1">
                      Started by {shortAddr(proposal.proposedBy)} ·{" "}
                      {new Date(proposal.proposedAt).toLocaleTimeString()}
                    </p>
                    <Link
                      href="/recover"
                      className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-stone-200 underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400 transition-colors"
                    >
                      Manage proposal →
                    </Link>
                  </div>
                )}

                {announcements.length === 0 && !proposal && (
                  <div className="mt-6 flex items-center gap-3 rounded-md border border-dashed border-stone-800 bg-stone-950/40 p-5">
                    <div className="size-8 rounded-md bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
                      <Check className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13.5px] text-stone-200">All clear.</p>
                      <p className="text-[12px] text-stone-500">
                        No recovery is pending against your account.
                      </p>
                    </div>
                  </div>
                )}
              </CardSection>
            </Card>

            <Card className="lg:col-span-5">
              <CardSection>
                <CardEyebrow>Setup integrity</CardEyebrow>
                <CardTitle>
                  {proxiesAttached === vault.guardians.length
                    ? "All guardians are bound."
                    : `${vault.guardians.length - proxiesAttached} guardian(s) missing.`}
                </CardTitle>
                <CardDescription>
                  Each guardian must hold a delayed proxy on this account for
                  recovery to be possible.
                </CardDescription>
                {proxiesAttached < vault.guardians.length && (
                  <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/[0.04] p-3.5">
                    <CircleAlert className="size-4 text-amber-300 shrink-0 mt-0.5" />
                    <div className="text-[13px] text-amber-100/90 leading-relaxed">
                      Recovery will fail until all guardians are bound. Submit the
                      missing proxies to fix.
                    </div>
                  </div>
                )}
              </CardSection>
              <CardSection>
                <CardEyebrow>Guardian roster</CardEyebrow>
                <GuardianList
                  guardians={vault.guardians}
                  approvals={proxies
                    .filter((p) => vault.guardians.includes(p.delegate))
                    .map((p) => p.delegate)}
                />
              </CardSection>
            </Card>
          </>
        )}

        {tab === "guardians" && (
          <Card className="lg:col-span-12">
            <CardSection>
              <CardEyebrow>Guardian roster</CardEyebrow>
              <CardTitle>{vault.guardians.length} guardian(s)</CardTitle>
              <CardDescription>
                {vault.threshold}-of-{vault.guardians.length} threshold · time-lock{" "}
                {formatTimeRemaining(vault.timelockBlocks * BLOCK_TIME_MS)}
              </CardDescription>
              <div className="mt-5">
                <GuardianList
                  guardians={vault.guardians}
                  approvals={proxies
                    .filter((p) => vault.guardians.includes(p.delegate))
                    .map((p) => p.delegate)}
                />
              </div>
            </CardSection>
          </Card>
        )}

        {tab === "activity" && (
          <Card className="lg:col-span-12">
            <CardSection>
              <CardEyebrow>Activity</CardEyebrow>
              <CardTitle>On-chain announcements</CardTitle>
              <CardDescription>
                Live read of {`proxy.announcements(guardian)`} for each bound
                guardian.
              </CardDescription>
              {announcements.length === 0 ? (
                <p className="mt-5 text-[13px] text-stone-500">
                  No announcements pending. The activity feed will populate once a
                  guardian submits proxy.announce.
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-stone-900 border-y border-stone-900">
                  {announcements.map((ann) => (
                    <li
                      key={`${ann.guardian}-${ann.callHash}`}
                      className="py-4 grid grid-cols-12 gap-3 items-baseline"
                    >
                      <span className="col-span-1 font-mono text-[11px] text-stone-600">
                        #{ann.height}
                      </span>
                      <div className="col-span-7">
                        <p className="text-[13.5px] text-stone-200">
                          announce by{" "}
                          <span className="font-mono">{shortAddr(ann.guardian)}</span>
                        </p>
                        <p className="text-[12px] text-stone-500 font-mono truncate">
                          {ann.callHash}
                        </p>
                      </div>
                      <div className="col-span-4 flex justify-end">
                        <CountdownTimer
                          targetTimestampMs={
                            Date.now() + ann.remainingBlocks * BLOCK_TIME_MS
                          }
                          size="sm"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardSection>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="label">Vault</p>
      <h1 className="mt-4 font-display text-[40px] leading-tight tracking-tight text-stone-100">
        Nothing loaded.
      </h1>
      <p className="mt-3 text-stone-400 text-[14.5px] max-w-md mx-auto leading-relaxed">
        Either create a fresh vault or open an existing one — your wallet account
        is the vault address.
      </p>
      <Link
        href="/setup"
        className="mt-8 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-stone-100 text-stone-950 text-sm font-medium hover:bg-white transition-colors"
      >
        Create your vault
      </Link>
    </div>
  );
}
