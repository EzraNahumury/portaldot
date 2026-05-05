"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardSection, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  const [status, setStatus] = useState("");

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
    setStatus("Connecting…");
    try {
      const api = await getApi();
      const inner = buildRecoveryInnerCall(api, proposal.newOwner);
      const tx = buildAnnounceTx(api, proposal.vaultOwner, inner);
      const signer = await getSigner(account.address);
      setStatus("Signing proxy.announce…");
      const { blockHash } = await signAndSend(tx, account.address, signer, (s) =>
        setStatus(s),
      );
      toast.success(`Announced — ${callHashOf(inner).slice(0, 12)}…`);
      console.log("announce tx:", blockHash);
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("");
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

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
      <section className="lg:col-span-7">
        <header>
          <p className="label">Recovery · in flight</p>
          <h1 className="mt-3 font-display text-[42px] leading-[1.05] tracking-tight text-stone-100">
            Coordinate{" "}
            <span className="italic text-stone-400">a recovery.</span>
          </h1>
          <p className="mt-3 text-[14.5px] text-stone-400 max-w-xl leading-relaxed">
            Each guardian opens this page, fills in the same details, and signs.
            We collect M-of-N off-chain — gas-free — then one of you submits the
            on-chain announce that starts the time-lock.
          </p>
        </header>

        <Card className="mt-8">
          <CardSection>
            <CardEyebrow>Step 1 · Compose</CardEyebrow>
            <CardTitle>Vault to recover</CardTitle>
            <CardDescription>
              The lost account whose balance must be rescued.
            </CardDescription>
            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Vault owner</Label>
                  {vault && (
                    <button
                      type="button"
                      onClick={fillOwnerFromVault}
                      className="text-[12px] text-stone-400 hover:text-stone-200 underline underline-offset-4 decoration-stone-700"
                    >
                      Use loaded vault
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
                  <Label>New owner (rescue target)</Label>
                  <button
                    type="button"
                    onClick={fillNewFromAccount}
                    className="text-[12px] text-stone-400 hover:text-stone-200 underline underline-offset-4 decoration-stone-700"
                  >
                    Use connected account
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
          </CardSection>
          <CardSection>
            <CardEyebrow>Step 2 · Sign off-chain</CardEyebrow>
            <CardTitle>Collect approvals</CardTitle>
            <CardDescription>
              {required > 0
                ? `${required} of ${vault?.guardians.length} guardians need to sign before any on-chain action.`
                : "Connect a vault to see required threshold."}
            </CardDescription>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={handleProposeOrApprove} disabled={!account}>
                {proposal ? "Add my approval" : "Create proposal"}
              </Button>
              {proposal && (
                <Button onClick={handleClear} variant="ghost" size="sm">
                  <Trash2 className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardSection>
          <CardSection>
            <CardEyebrow>Step 3 · Announce on-chain</CardEyebrow>
            <CardTitle>One guardian submits proxy.announce</CardTitle>
            <CardDescription>
              POT gas paid by the signer. Time-lock starts at the inclusion block.
            </CardDescription>
            <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[12px] font-mono text-stone-500 truncate">
                {status || (ready ? "ready when you are" : "waiting for approvals")}
              </p>
              <Button
                onClick={handleAnnounce}
                loading={submitting}
                disabled={!ready || !isGuardian}
              >
                <Send className="size-3.5" />
                Submit announce
              </Button>
            </div>
          </CardSection>
        </Card>
      </section>

      <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start">
        <p className="label">Proposal</p>

        <Card className="mt-3">
          <CardSection>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
                Status
              </span>
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
                    Proposed new owner
                  </p>
                  <p className="font-mono text-[13px] text-stone-200 break-all">
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
                        className="flex items-center gap-2 text-[13px] font-mono text-stone-200"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        {shortAddr(a, 8, 6)}
                        {a === proposal.proposedBy && (
                          <span className="ml-1 text-[10.5px] uppercase tracking-[0.12em] text-stone-500">
                            proposer
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-[11.5px] text-stone-500 font-mono">
                  proposed {new Date(proposal.proposedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-stone-800 bg-stone-950/40 p-5 text-center">
                <p className="text-[13.5px] text-stone-300">No proposal yet.</p>
                <p className="text-[12px] text-stone-500 mt-1">
                  Fill the form on the left to start one.
                </p>
              </div>
            )}
          </CardSection>
        </Card>

        <p className="mt-4 text-[11.5px] text-stone-600 leading-relaxed">
          The proposal lives in your local cache only. It vanishes the moment the
          on-chain announce is submitted.
        </p>
      </aside>
    </div>
  );
}
