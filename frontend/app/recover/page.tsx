"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import { getVaultContract, callRequestRecovery } from "@/lib/contract";

export default function RecoverPage() {
  const router = useRouter();
  const account = usePortalStore((s) => s.account);
  const setVaultAddress = usePortalStore((s) => s.setVaultAddress);

  const [vaultAddr, setVaultAddr] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    if (!account) {
      toast.error("Connect wallet first.");
      return;
    }
    const va = vaultAddr.trim();
    const no = newOwner.trim();
    if (!va || !no) {
      toast.error("Vault address and new owner address required.");
      return;
    }

    setLoading(true);
    setStatus("Connecting...");
    try {
      const api = await getApi();
      const contract = await getVaultContract(api, va);
      const signer = await getSigner(account.address);
      setStatus("Submitting request_recovery...");
      const hash = await callRequestRecovery(
        contract,
        account.address,
        signer,
        no,
        (s) => setStatus(s),
      );
      toast.success("Recovery requested.");
      console.log("Recovery tx:", hash);
      setVaultAddress(va);
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  function fillNewOwnerFromAccount() {
    if (!account) {
      toast.error("Connect a new wallet first to use its address.");
      return;
    }
    setNewOwner(account.address);
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/5 px-3 py-1 text-xs text-rose-300 mb-4">
          <AlertTriangle className="size-3" />
          Emergency
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
          Recover your vault
        </h1>
        <p className="mt-3 text-zinc-400 max-w-2xl">
          Lost access to your old key? Submit a recovery request from your new
          keypair. Your guardians will need to approve, then a time-lock passes
          before execution.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recovery request</CardTitle>
          <CardDescription>
            This signs from your <em>new</em> account, not the lost one.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <Label>Vault address</Label>
            <Input
              placeholder="5... (the existing vault you want to recover)"
              value={vaultAddr}
              onChange={(e) => setVaultAddr(e.target.value)}
              className="font-mono"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Proposed new owner address</Label>
              <button
                type="button"
                onClick={fillNewOwnerFromAccount}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors mb-2"
              >
                Use connected account
              </button>
            </div>
            <Input
              placeholder="5... (your new keypair)"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 p-4 text-sm text-amber-200/90">
            <p className="font-medium">What happens next</p>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-amber-200/70">
              <li>Recovery request published on-chain.</li>
              <li>Guardians review and approve from their wallets.</li>
              <li>After threshold is met, time-lock starts.</li>
              <li>Once time-lock elapses, execute → ownership transfers.</li>
            </ol>
          </div>
        </CardBody>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-zinc-500 font-mono truncate max-w-md">
          {status}
        </p>
        <Button onClick={handleSubmit} loading={loading} size="lg">
          <Send className="size-4" />
          Submit recovery
        </Button>
      </div>
    </div>
  );
}
