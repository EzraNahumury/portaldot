"use client";

import { useState, useEffect, useCallback, use } from "react";
import { CheckCircle2, Shield, Play } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GuardianList } from "@/components/GuardianList";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import {
  getVaultContract,
  readVaultState,
  callApproveRecovery,
  callExecuteRecovery,
  type VaultState,
} from "@/lib/contract";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApprovePage({ params }: PageProps) {
  const { id } = use(params);
  const account = usePortalStore((s) => s.account);
  const storedVault = usePortalStore((s) => s.vaultAddress);
  const setStoredVault = usePortalStore((s) => s.setVaultAddress);

  const [vaultAddr, setVaultAddr] = useState(storedVault);
  const [state, setState] = useState<VaultState | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    const va = vaultAddr.trim();
    if (!va) return;
    setLoading(true);
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, va);
      const s = await readVaultState(contract, account?.address ?? va);
      setState(s);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [vaultAddr, account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleApprove() {
    if (!account || !state?.activeRecovery) return;
    setActing(true);
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, vaultAddr);
      const signer = await getSigner(account.address);
      await callApproveRecovery(
        contract,
        account.address,
        signer,
        state.activeRecovery.id,
        (s) => toast.message(s),
      );
      toast.success("Approval recorded.");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleExecute() {
    if (!account || !state?.activeRecovery) return;
    setActing(true);
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, vaultAddr);
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

  const matchesId =
    state?.activeRecovery && String(state.activeRecovery.id) === String(id);
  const isGuardian =
    !!account &&
    !!state?.guardians.includes(account.address);
  const alreadyApproved =
    !!account &&
    !!state?.activeRecovery?.approvals.includes(account.address);
  const thresholdMet =
    !!state?.activeRecovery &&
    state.activeRecovery.approvals.length >= state.threshold;
  const requestedAtMs = state?.activeRecovery
    ? Number(state.activeRecovery.requestedAt)
    : 0;
  const timelockMs = state ? Number(state.timelockSeconds) * 1000 : 0;
  const targetMs = requestedAtMs + timelockMs;
  const timelockElapsed = Date.now() >= targetMs;

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-3 py-1 text-xs text-violet-300 mb-4">
          <Shield className="size-3" />
          Guardian view
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
          Recovery request <span className="text-zinc-500">#{id}</span>
        </h1>
        <p className="mt-3 text-zinc-400">
          Review carefully — only approve if you recognize this is a legitimate
          recovery from the vault owner.
        </p>
      </div>

      <Card className="mb-6">
        <CardBody className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <Label>Vault address</Label>
            <Input
              placeholder="5..."
              value={vaultAddr}
              onChange={(e) => setVaultAddr(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button
            onClick={() => {
              setStoredVault(vaultAddr);
              void refresh();
            }}
            loading={loading}
          >
            Load
          </Button>
        </CardBody>
      </Card>

      {state && state.activeRecovery && matchesId ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Request details</CardTitle>
              <CardDescription>
                Verify the proposed new owner before approving.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-5">
              <div>
                <Label>Proposed new owner</Label>
                <code className="block font-mono text-sm text-zinc-200 break-all bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
                  {state.activeRecovery.proposedOwner}
                </code>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <CountdownTimer targetTimestampMs={targetMs} />
                <span className="text-sm text-zinc-500">
                  {state.activeRecovery.approvals.length}/{state.threshold} guardians approved
                </span>
                {alreadyApproved && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    You have approved
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleApprove}
                  loading={acting}
                  disabled={!isGuardian || alreadyApproved || thresholdMet}
                >
                  <CheckCircle2 className="size-4" />
                  Approve recovery
                </Button>
                <Button
                  onClick={handleExecute}
                  loading={acting}
                  variant="secondary"
                  disabled={!thresholdMet || !timelockElapsed}
                >
                  <Play className="size-4" />
                  Execute recovery
                </Button>
              </div>

              {!isGuardian && account && (
                <p className="text-xs text-amber-300">
                  Connected account is not in the guardian list of this vault.
                </p>
              )}
              {!account && (
                <p className="text-xs text-zinc-500">
                  Connect a guardian wallet to approve.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardian roster</CardTitle>
              <CardDescription>
                Who else needs to approve? Status updates after each transaction.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <GuardianList
                guardians={state.guardians}
                approvals={state.activeRecovery.approvals}
                threshold={state.threshold}
              />
            </CardBody>
          </Card>
        </>
      ) : (
        <Card>
          <CardBody className="py-16 text-center text-zinc-400">
            {state
              ? `No active recovery with id #${id} for this vault.`
              : "Load a vault to see request details."}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
