"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Copy, Check, ExternalLink, Ban } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { GuardianList } from "@/components/GuardianList";
import { RecoveryStatus } from "@/components/RecoveryStatus";
import { CountdownTimer } from "@/components/CountdownTimer";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import {
  getVaultContract,
  readVaultState,
  callCancelRecovery,
  callExecuteRecovery,
  type VaultState,
} from "@/lib/contract";
import { shortAddr, formatTimeRemaining } from "@/lib/format";

export default function DashboardPage() {
  const account = usePortalStore((s) => s.account);
  const vaultAddress = usePortalStore((s) => s.vaultAddress);
  const setVaultAddress = usePortalStore((s) => s.setVaultAddress);

  const [vaultInput, setVaultInput] = useState(vaultAddress);
  const [state, setState] = useState<VaultState | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    if (!vaultAddress) return;
    setLoading(true);
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, vaultAddress);
      const s = await readVaultState(contract, account?.address ?? vaultAddress);
      setState(s);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function loadVault() {
    const v = vaultInput.trim();
    if (!v) return;
    setVaultAddress(v);
    setState(null);
  }

  async function handleCopy() {
    if (!vaultAddress) return;
    await navigator.clipboard.writeText(vaultAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleExecute() {
    if (!account || !state?.activeRecovery) return;
    setActing(true);
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, vaultAddress);
      const signer = await getSigner(account.address);
      await callExecuteRecovery(
        contract,
        account.address,
        signer,
        state.activeRecovery.id,
        (s) => toast.message(s),
      );
      toast.success("Recovery executed.");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    if (!account || !state?.activeRecovery) return;
    setActing(true);
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, vaultAddress);
      const signer = await getSigner(account.address);
      await callCancelRecovery(
        contract,
        account.address,
        signer,
        state.activeRecovery.id,
        (s) => toast.message(s),
      );
      toast.success("Recovery cancelled.");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  // Derive recovery status
  let status: "none" | "active" | "approved" | "executable" = "none";
  let timelockTargetMs = 0;
  if (state?.activeRecovery) {
    const requestedAtMs = Number(state.activeRecovery.requestedAt);
    const timelockMs = Number(state.timelockSeconds) * 1000;
    timelockTargetMs = requestedAtMs + timelockMs;
    const approvalsMet = state.activeRecovery.approvals.length >= state.threshold;
    if (!approvalsMet) status = "active";
    else if (Date.now() < timelockTargetMs) status = "approved";
    else status = "executable";
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-12 space-y-8">
      {/* Vault address loader */}
      <Card>
        <CardBody className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <Label>Vault address</Label>
            <Input
              placeholder="5... (deployed contract address)"
              value={vaultInput}
              onChange={(e) => setVaultInput(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button onClick={loadVault} variant="secondary">
            Load
          </Button>
          <Button onClick={refresh} loading={loading} disabled={!vaultAddress}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </CardBody>
      </Card>

      {!vaultAddress && (
        <Card>
          <CardBody className="py-16 text-center">
            <ShieldCheck className="size-10 mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-400">
              No vault loaded. Paste a vault address above, or{" "}
              <Link href="/setup" className="text-violet-400 hover:text-violet-300 underline">
                create one
              </Link>
              .
            </p>
          </CardBody>
        </Card>
      )}

      {vaultAddress && state && (
        <>
          {/* Vault summary */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>Vault</CardTitle>
                <div className="mt-2 flex items-center gap-2">
                  <code className="font-mono text-xs text-zinc-400 truncate">
                    {vaultAddress}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="text-zinc-500 hover:text-zinc-200 transition-colors"
                    aria-label="Copy address"
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
              <Stat label="Owner" value={shortAddr(state.owner, 6, 4)} mono />
              <Stat
                label="Threshold"
                value={`${state.threshold}-of-${state.guardians.length}`}
              />
              <Stat
                label="Time-lock"
                value={formatTimeRemaining(Number(state.timelockSeconds) * 1000)}
              />
              <Stat
                label="Recovery"
                value={state.activeRecovery ? `#${state.activeRecovery.id}` : "—"}
              />
            </CardBody>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Guardians */}
            <Card>
              <CardHeader>
                <CardTitle>Guardians</CardTitle>
                <CardDescription>
                  Trusted accounts that can collectively recover this vault.
                </CardDescription>
              </CardHeader>
              <CardBody>
                <GuardianList
                  guardians={state.guardians}
                  approvals={state.activeRecovery?.approvals ?? []}
                  threshold={
                    state.activeRecovery ? state.threshold : undefined
                  }
                />
              </CardBody>
            </Card>

            {/* Active recovery */}
            <Card>
              <CardHeader>
                <CardTitle>Active recovery</CardTitle>
                <CardDescription>
                  {state.activeRecovery
                    ? "A recovery is in progress."
                    : "No recovery requested."}
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-5">
                {state.activeRecovery ? (
                  <>
                    <div>
                      <Label>Proposed new owner</Label>
                      <code className="block font-mono text-sm text-zinc-200 break-all">
                        {state.activeRecovery.proposedOwner}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      <CountdownTimer targetTimestampMs={timelockTargetMs} />
                      <span className="text-sm text-zinc-500">
                        {state.activeRecovery.approvals.length}/{state.threshold} approved
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleExecute}
                        loading={acting}
                        disabled={status !== "executable"}
                      >
                        Execute Recovery
                      </Button>
                      <Button
                        onClick={handleCancel}
                        loading={acting}
                        variant="danger"
                        disabled={
                          !account || account.address !== state.owner
                        }
                      >
                        <Ban className="size-4" />
                        Cancel (Owner only)
                      </Button>
                      <Link
                        href={`/approve/${state.activeRecovery.id}`}
                        className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-200 text-sm font-medium transition-colors"
                      >
                        Approve view
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500">
                      Vault is healthy. No recovery pending.
                    </p>
                    <Link
                      href="/recover"
                      className="mt-4 inline-flex text-sm text-violet-400 hover:text-violet-300"
                    >
                      Need to recover? →
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
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
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </p>
      <p
        className={`text-zinc-100 ${
          mono ? "font-mono text-sm" : "text-base font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
