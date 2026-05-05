"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Ban,
  Trash2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

      const allAnnouncements: AnnouncementInfo[] = [];
      for (const p of px) {
        if (!vault.guardians.includes(p.delegate)) continue;
        const annsForGuardian = await readGuardianAnnouncements(
          api,
          p.delegate,
          vault.ownerAddress,
          p.delay,
          block,
        );
        allAnnouncements.push(...annsForGuardian);
      }
      setAnnouncements(allAnnouncements);

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
    if (!proposal?.newOwner) {
      toast.error("No proposal in cache. Have a guardian re-create from /recover.");
      return;
    }
    if (ann.remainingBlocks > 0) {
      toast.error(`Time-lock still active (${ann.remainingBlocks} blocks).`);
      return;
    }
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
    if (missing.length === 0) {
      toast.message("Nothing missing.");
      return;
    }
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

  const guardianProxiesAttached = vault
    ? vault.guardians.filter((g) => proxies.some((p) => p.delegate === g)).length
    : 0;

  let status: "none" | "active" | "approved" | "executable" = "none";
  if (announcements.length > 0) {
    const ann = announcements[0];
    status = ann.remainingBlocks === 0 ? "executable" : "approved";
  } else if (proposal && proposal.approvals.length < (vault?.threshold ?? 99)) {
    status = "active";
  }

  if (!vault) {
    return (
      <div className="mx-auto max-w-2xl w-full px-6 py-32 text-center">
        <ShieldCheck className="size-12 mx-auto text-zinc-700 mb-4" />
        <h1 className="text-2xl font-semibold text-zinc-100 mb-2">No vault loaded</h1>
        <p className="text-zinc-400 mb-8">
          <Link href="/setup" className="text-violet-400 hover:text-violet-300 underline">
            Create a vault
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-12 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>Your vault</CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <code className="font-mono text-xs text-zinc-400 truncate">
                {vault.ownerAddress}
              </code>
              <button
                onClick={() => handleCopy(vault.ownerAddress)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
          <RecoveryStatus status={status} />
        </CardHeader>
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-zinc-900">
          <Stat
            label="Guardians on chain"
            value={`${guardianProxiesAttached}/${vault.guardians.length}`}
          />
          <Stat
            label="Threshold (UX)"
            value={`${vault.threshold}-of-${vault.guardians.length}`}
          />
          <Stat
            label="Time-lock"
            value={formatTimeRemaining(vault.timelockBlocks * BLOCK_TIME_MS)}
          />
          <Stat label="Block" value={`#${currentBlock}`} />
        </CardBody>
        <CardBody className="border-t border-zinc-900 pt-4 flex flex-wrap items-center gap-3">
          <Button onClick={refresh} loading={loading} variant="secondary" size="sm">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          {guardianProxiesAttached < vault.guardians.length && (
            <Button onClick={handleAddMissingProxies} loading={acting} size="sm">
              Add missing proxies (
              {vault.guardians.length - guardianProxiesAttached})
            </Button>
          )}
          <Button onClick={handleDetach} loading={acting} variant="ghost" size="sm">
            <Trash2 className="size-4" />
            Detach all
          </Button>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Guardian roster</CardTitle>
            <CardDescription>
              Each guardian holds a delayed proxy on your account.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <GuardianList
              guardians={vault.guardians}
              approvals={proxies
                .filter((p) => vault.guardians.includes(p.delegate))
                .map((p) => p.delegate)}
              threshold={undefined}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active recovery</CardTitle>
            <CardDescription>
              {announcements.length > 0
                ? "An announcement is on chain — time-lock counting down."
                : proposal
                ? "Off-chain proposal in flight."
                : "Vault healthy."}
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-5">
            {announcements.map((ann) => (
              <div
                key={`${ann.guardian}-${ann.callHash}`}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Announced by
                  </p>
                  <code className="font-mono text-sm text-zinc-200">
                    {shortAddr(ann.guardian, 8, 6)}
                  </code>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <CountdownTimer
                    targetTimestampMs={Date.now() + ann.remainingBlocks * BLOCK_TIME_MS}
                  />
                  <span className="text-sm text-zinc-500">
                    Block #{ann.executableAt}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleExecute(ann)}
                    loading={acting}
                    variant="secondary"
                    size="sm"
                    disabled={ann.remainingBlocks > 0}
                  >
                    <Play className="size-4" />
                    Execute
                  </Button>
                  <Button
                    onClick={() => handleRejectAnnouncement(ann)}
                    loading={acting}
                    variant="danger"
                    size="sm"
                  >
                    <Ban className="size-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}

            {announcements.length === 0 && proposal && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-amber-200/70">
                  Off-chain proposal
                </p>
                <p className="text-sm text-amber-100">
                  New owner: <code className="font-mono">{shortAddr(proposal.newOwner)}</code>
                </p>
                <p className="text-xs text-amber-200/70">
                  {proposal.approvals.length}/{vault.threshold} guardian approvals
                  collected · proposed by {shortAddr(proposal.proposedBy)}
                </p>
                <Link
                  href="/recover"
                  className="text-xs text-violet-300 hover:text-violet-200 inline-flex items-center"
                >
                  Manage proposal →
                </Link>
              </div>
            )}

            {announcements.length === 0 && !proposal && (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">No recovery pending.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">{label}</p>
      <p className="text-base font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
