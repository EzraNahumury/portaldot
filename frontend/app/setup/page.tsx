"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { usePortalStore } from "@/lib/store";
import { getApi } from "@/lib/portaldot";
import { getSigner } from "@/lib/wallet";
import { deployVault } from "@/lib/contract";

export default function SetupPage() {
  const router = useRouter();
  const account = usePortalStore((s) => s.account);
  const setVaultAddress = usePortalStore((s) => s.setVaultAddress);

  const [guardians, setGuardians] = useState<string[]>(["", "", ""]);
  const [threshold, setThreshold] = useState(2);
  const [timelock, setTimelock] = useState(60);
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<string>("");

  function updateGuardian(i: number, value: string) {
    setGuardians((arr) => arr.map((g, idx) => (idx === i ? value : g)));
  }

  function addGuardian() {
    if (guardians.length >= 32) return;
    setGuardians([...guardians, ""]);
  }

  function removeGuardian(i: number) {
    if (guardians.length <= 1) return;
    setGuardians(guardians.filter((_, idx) => idx !== i));
    if (threshold > guardians.length - 1) setThreshold(guardians.length - 1);
  }

  async function handleDeploy() {
    if (!account) {
      toast.error("Connect wallet first.");
      return;
    }
    const cleaned = guardians.map((g) => g.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      toast.error("Add at least one guardian.");
      return;
    }
    if (threshold < 1 || threshold > cleaned.length) {
      toast.error(`Threshold must be 1..${cleaned.length}.`);
      return;
    }
    if (new Set(cleaned).size !== cleaned.length) {
      toast.error("Duplicate guardian addresses.");
      return;
    }

    setDeploying(true);
    setStatus("Connecting to Portaldot...");
    try {
      const api = await getApi();
      setStatus("Loading wallet signer...");
      const signer = await getSigner(account.address);
      setStatus("Submitting deploy transaction...");
      const { address, hash } = await deployVault(
        api,
        account.address,
        signer,
        cleaned,
        threshold,
        timelock,
        (s) => setStatus(s),
      );
      setVaultAddress(address);
      toast.success(`Vault deployed at ${address.slice(0, 10)}…`);
      console.log("Vault deploy hash:", hash);
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-3 py-1 text-xs text-violet-300 mb-4">
          <Sparkles className="size-3" />
          Step 1
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
          Create your vault
        </h1>
        <p className="mt-3 text-zinc-400">
          Pick guardians you trust. They never see your funds — only help you regain
          access if you lose your keys.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guardian list</CardTitle>
          <CardDescription>
            SS58 addresses of your guardians. 1–32 supported.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-3">
          {guardians.map((g, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Guardian ${i + 1} address (5...)`}
                  value={g}
                  onChange={(e) => updateGuardian(i, e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={() => removeGuardian(i)}
                disabled={guardians.length <= 1}
                aria-label="Remove guardian"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addGuardian}>
            <Plus className="size-4" />
            Add guardian
          </Button>
        </CardBody>
        <CardFooter className="grid grid-cols-2 gap-4">
          <div>
            <Label>Threshold (M of N)</Label>
            <Input
              type="number"
              min={1}
              max={Math.max(1, guardians.length)}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <p className="mt-2 text-xs text-zinc-500">
              {threshold}-of-{guardians.length} guardians needed to recover.
            </p>
          </div>
          <div>
            <Label>Time-lock (seconds)</Label>
            <Input
              type="number"
              min={0}
              value={timelock}
              onChange={(e) => setTimelock(Number(e.target.value))}
            />
            <p className="mt-2 text-xs text-zinc-500">
              Use 86400 for 24h prod default. Demo can be 60.
            </p>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-zinc-500 font-mono truncate max-w-md">
          {status}
        </p>
        <Button onClick={handleDeploy} loading={deploying} size="lg">
          Deploy Vault
        </Button>
      </div>
    </div>
  );
}
