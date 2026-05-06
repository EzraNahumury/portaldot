"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RecoveryTimeline, type Stage } from "@/components/ui/RecoveryTimeline";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import {
  buildAnnounceTx,
  buildRecoveryInnerCall,
  callHashOf,
  loadRecoveryProposal,
  saveRecoveryProposal,
  clearRecoveryProposal,
  signAndSend,
  type RecoveryProposal,
} from "@/lib/multisig";
import { shortAddr } from "@/lib/format";

export default function RecoverPage() {
  const router = useRouter();
  const account = usePortalStore((s) => s.account);
  const vault = usePortalStore((s) => s.vault);

  const [ownerAddr, setOwnerAddr] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [proposal, setProposal] = useState<RecoveryProposal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(() => {
    const target = ownerAddr.trim() || vault?.ownerAddress || "";
    if (!target) return;
    setProposal(loadRecoveryProposal(target));
  }, [ownerAddr, vault]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function fillNewFromAccount() {
    if (!account) return toast.error("Connect a wallet first.");
    setNewOwner(account.address);
  }
  function fillOwnerFromVault() {
    if (!vault) return toast.error("No vault loaded.");
    setOwnerAddr(vault.ownerAddress);
  }
  function handleProposeOrApprove() {
    if (!account) return toast.error("Connect wallet first.");
    const owner = ownerAddr.trim();
    const next = newOwner.trim();
    if (!owner || !next) return toast.error("Both addresses required.");

    const existing = loadRecoveryProposal(owner);
    if (existing) {
      if (existing.newOwner !== next) {
        return toast.error(
          `Existing proposal targets ${shortAddr(existing.newOwner)}. Reject it first.`,
        );
      }
      if (existing.approvals.includes(account.address)) {
        toast.message("Already signed.");
        setProposal(existing);
        return;
      }
      const updated = { ...existing, approvals: [...existing.approvals, account.address] };
      saveRecoveryProposal(updated);
      setProposal(updated);
      toast.success("Approval recorded.");
      return;
    }

    const fresh: RecoveryProposal = {
      vaultOwner: owner,
      newOwner: next,
      proposedBy: account.address,
      proposedAt: Date.now(),
      approvals: [account.address],
    };
    saveRecoveryProposal(fresh);
    setProposal(fresh);
    toast.success("Proposal created.");
  }
  async function handleAnnounce() {
    if (!account || !proposal || !vault) return;
    if (proposal.approvals.length < vault.threshold)
      return toast.error(
        `Need ${vault.threshold} approvals, have ${proposal.approvals.length}.`,
      );
    if (!vault.guardians.includes(account.address))
      return toast.error("Connected account is not a guardian.");
    setSubmitting(true);
    try {
      const api = await getApi();
      const inner = buildRecoveryInnerCall(api, proposal.newOwner);
      const tx = buildAnnounceTx(api, proposal.vaultOwner, inner);
      const signer = await getSigner(account.address);
      const { blockHash } = await signAndSend(tx, account.address, signer, () => {});
      toast.success(`Announced — ${callHashOf(inner).slice(0, 12)}…`);
      console.log("announce tx:", blockHash);
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }
  function handleClear() {
    const owner = proposal?.vaultOwner ?? ownerAddr.trim();
    if (!owner) return;
    clearRecoveryProposal(owner);
    setProposal(null);
    toast.success("Cleared.");
  }

  const required = vault?.threshold ?? 0;
  const collected = proposal?.approvals.length ?? 0;
  const ready = !!proposal && collected >= required && required > 0;
  const isGuardian = !!account && !!vault && vault.guardians.includes(account.address);

  // Determine current stage
  const stages = useMemo<Stage[]>(() => {
    const composeDone = !!ownerAddr.trim() && !!newOwner.trim();
    const proposalCreated = !!proposal;
    return [
      {
        id: "compose",
        label: "Compose",
        description: "Enter the lost vault and the rescue keypair.",
        state: composeDone ? "done" : "active",
      },
      {
        id: "approvals",
        label: "Sign off-chain",
        description: `${collected}/${required || "?"} guardians signed.`,
        state: !composeDone
          ? "pending"
          : proposalCreated && ready
          ? "done"
          : "active",
      },
      {
        id: "announce",
        label: "Announce on-chain",
        description: "POT gas. Time-lock starts.",
        state: ready ? "active" : "pending",
      },
      {
        id: "execute",
        label: "Execute after time-lock",
        description: "Anyone can submit proxy.proxyAnnounced.",
        state: "pending",
      },
    ];
  }, [ownerAddr, newOwner, proposal, collected, required, ready]);

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-12">
      <header className="mb-10">
        <p className="text-[10.5px] tracking-[0.16em] uppercase text-stone-500 font-medium mb-3">
          Recovery
        </p>
        <h1 className="font-display text-[34px] md:text-[42px] tracking-tight text-stone-100 leading-tight">
          Coordinate <span className="italic text-stone-500">a recovery.</span>
        </h1>
        <p className="mt-3 max-w-md text-[13.5px] text-stone-500 leading-relaxed">
          Sign off-chain. Announce once. Time-lock protects the owner.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8">
        {/* LEFT: timeline */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
          <RecoveryTimeline stages={stages} />
        </aside>

        {/* RIGHT: form + proposal */}
        <section className="lg:col-span-8 space-y-6">
          <GlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                Compose
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Vault to recover</Label>
                  {vault && (
                    <button
                      type="button"
                      onClick={fillOwnerFromVault}
                      className="text-[11.5px] text-stone-400 hover:text-stone-200 underline underline-offset-4 decoration-stone-700"
                    >
                      use loaded vault
                    </button>
                  )}
                </div>
                <Input
                  placeholder="5… vault owner"
                  value={ownerAddr}
                  onChange={(e) => {
                    setOwnerAddr(e.target.value);
                    setProposal(loadRecoveryProposal(e.target.value.trim()));
                  }}
                  className="font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>New owner</Label>
                  <button
                    type="button"
                    onClick={fillNewFromAccount}
                    className="text-[11.5px] text-stone-400 hover:text-stone-200 underline underline-offset-4 decoration-stone-700"
                  >
                    use connected
                  </button>
                </div>
                <Input
                  placeholder="5… fresh keypair"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                Proposal
              </p>
              {proposal ? (
                ready ? (
                  <Badge tone="ok" dot>
                    threshold met
                  </Badge>
                ) : (
                  <Badge tone="warn" dot pulse>
                    {collected}/{required || "?"} signed
                  </Badge>
                )
              ) : (
                <Badge tone="neutral">empty</Badge>
              )}
            </div>

            {proposal ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium mb-1">
                    Target
                  </p>
                  <p className="font-mono text-[12.5px] text-stone-200 break-all">
                    {proposal.newOwner}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium mb-2">
                    Signers
                  </p>
                  <ul className="space-y-1.5">
                    {proposal.approvals.map((a) => (
                      <li
                        key={a}
                        className="flex items-center gap-2 text-[12.5px] font-mono text-stone-200"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        {shortAddr(a, 8, 6)}
                        {a === proposal.proposedBy && (
                          <span className="ml-1 text-[10px] uppercase tracking-[0.12em] text-stone-500">
                            proposer
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  proposed {new Date(proposal.proposedAt).toLocaleString()}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-900">
                  <Button onClick={handleProposeOrApprove} disabled={!account} size="sm">
                    {proposal.approvals.includes(account?.address ?? "")
                      ? "Already signed"
                      : "Add my approval"}
                  </Button>
                  <Button onClick={handleClear} variant="ghost" size="sm">
                    <Trash2 className="size-3.5" />
                    Clear
                  </Button>
                  <Button
                    onClick={handleAnnounce}
                    loading={submitting}
                    disabled={!ready || !isGuardian}
                    size="sm"
                    className="ml-auto"
                  >
                    <Send className="size-3.5" />
                    Submit announce
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[13px] text-stone-500 mb-4">
                  No proposal yet. Fill the form above, then create one.
                </p>
                <Button onClick={handleProposeOrApprove} disabled={!account} size="sm">
                  Create proposal
                </Button>
              </div>
            )}
          </GlowCard>
        </section>
      </div>
    </div>
  );
}
