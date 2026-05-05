"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Send, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
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

  function fillNewOwnerFromAccount() {
    if (!account) {
      toast.error("Connect a wallet first.");
      return;
    }
    setNewOwner(account.address);
  }

  function fillVaultOwnerFromVault() {
    if (!vault) {
      toast.error("No vault loaded.");
      return;
    }
    setOwnerAddr(vault.ownerAddress);
  }

  function handleProposeOrApprove() {
    if (!account) {
      toast.error("Connect wallet first.");
      return;
    }
    const owner = ownerAddr.trim();
    const newOwnerTrim = newOwner.trim();
    if (!owner || !newOwnerTrim) {
      toast.error("Vault owner + new owner required.");
      return;
    }

    const existing = loadRecoveryProposal(owner);
    if (existing) {
      if (existing.newOwner !== newOwnerTrim) {
        toast.error(
          `Proposal already exists for ${shortAddr(existing.newOwner)}. Reject it first.`,
        );
        return;
      }
      if (existing.approvals.includes(account.address)) {
        toast.message("You have already approved this proposal.");
        setProposal(existing);
        return;
      }
      const updated: RecoveryProposal = {
        ...existing,
        approvals: [...existing.approvals, account.address],
      };
      saveRecoveryProposal(updated);
      setProposal(updated);
      toast.success("Approval recorded (off-chain).");
      return;
    }

    const proposal: RecoveryProposal = {
      vaultOwner: owner,
      newOwner: newOwnerTrim,
      proposedBy: account.address,
      proposedAt: Date.now(),
      approvals: [account.address],
    };
    saveRecoveryProposal(proposal);
    setProposal(proposal);
    toast.success("Proposal created. Other guardians can approve.");
  }

  async function handleAnnounce() {
    if (!account || !proposal) return;
    if (!vault) {
      toast.error("Load the vault first (run setup or paste vault info).");
      return;
    }
    if (proposal.approvals.length < vault.threshold) {
      toast.error(`Need ${vault.threshold} approvals, have ${proposal.approvals.length}.`);
      return;
    }
    if (!vault.guardians.includes(account.address)) {
      toast.error("Connected account is not a guardian — it cannot announce.");
      return;
    }
    setSubmitting(true);
    setStatus("Connecting...");
    try {
      const api = await getApi();
      const inner = buildRecoveryInnerCall(api, proposal.newOwner);
      const tx = buildAnnounceTx(api, proposal.vaultOwner, inner);
      const signer = await getSigner(account.address);
      setStatus("Submitting proxy.announce ...");
      const { blockHash } = await signAndSend(tx, account.address, signer, (s) =>
        setStatus(s),
      );
      toast.success(`Announced. callHash ${callHashOf(inner).slice(0, 10)}…`);
      console.log("Announce tx:", blockHash);
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClearProposal() {
    const owner = proposal?.vaultOwner ?? ownerAddr.trim();
    if (!owner) return;
    clearRecoveryProposal(owner);
    setProposal(null);
    toast.success("Proposal cleared.");
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/5 px-3 py-1 text-xs text-rose-300 mb-4">
          <AlertTriangle className="size-3" />
          Emergency
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
          Coordinate recovery
        </h1>
        <p className="mt-3 text-zinc-400 max-w-2xl">
          Guardians collect M-of-N approvals off-chain. Once threshold is met, one
          guardian submits the on-chain announcement and the time-lock starts.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recovery proposal</CardTitle>
          <CardDescription>
            All guardians fill these the same way; the local cache acts as the
            shared off-chain state.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label>Vault owner address</Label>
              {vault && (
                <button
                  type="button"
                  onClick={fillVaultOwnerFromVault}
                  className="text-xs text-violet-400 hover:text-violet-300 mb-2"
                >
                  Use loaded vault
                </button>
              )}
            </div>
            <Input
              placeholder="5..."
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
              <Label>New owner address</Label>
              <button
                type="button"
                onClick={fillNewOwnerFromAccount}
                className="text-xs text-violet-400 hover:text-violet-300 mb-2"
              >
                Use connected account
              </button>
            </div>
            <Input
              placeholder="5..."
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className="font-mono"
            />
          </div>
        </CardBody>
      </Card>

      {proposal && (
        <Card className="mb-6 border-amber-500/40">
          <CardHeader>
            <CardTitle>Open proposal</CardTitle>
            <CardDescription>
              {proposal.approvals.length}/{vault?.threshold ?? "?"} guardian
              approvals collected
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="space-y-1">
              {proposal.approvals.map((g) => (
                <div key={g} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <code className="font-mono text-xs text-zinc-200">
                    {shortAddr(g, 8, 6)}
                  </code>
                  {g === proposal.proposedBy && (
                    <span className="text-xs text-zinc-500">(proposer)</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {vault &&
              proposal.approvals.length >= vault.threshold &&
              vault.guardians.includes(account?.address ?? "") ? (
                <Button onClick={handleAnnounce} loading={submitting}>
                  <Send className="size-4" />
                  Submit on-chain announce
                </Button>
              ) : null}
              <Button onClick={handleClearProposal} variant="ghost" size="sm">
                <Trash2 className="size-4" />
                Clear proposal
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 p-4 text-sm text-amber-200/90 mb-6">
        <p className="font-medium">What happens next</p>
        <ol className="mt-2 space-y-1 list-decimal list-inside text-amber-200/70">
          <li>Each guardian opens this page, fills in the same details, hits Approve</li>
          <li>Once {vault?.threshold ?? "M"} guardians approve, the button below activates</li>
          <li>One guardian signs `proxy.announce(owner, transferAllHash)` — POT gas</li>
          <li>After {vault?.timelockBlocks ?? "N"} blocks elapse, anyone can `proxy.proxy_announced` to execute</li>
          <li>Owner can `proxy.reject_announcement` at any time before execute</li>
        </ol>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 font-mono truncate max-w-md">{status}</p>
        <Button onClick={handleProposeOrApprove} size="lg" disabled={!account}>
          {proposal ? "Approve proposal" : "Create proposal"}
        </Button>
      </div>
    </div>
  );
}
