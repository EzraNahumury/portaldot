"use client";

import { Abi } from "@polkadot/api-contract";

let cached: Abi | null = null;

export async function loadVaultAbi(): Promise<Abi> {
  if (cached) return cached;
  const res = await fetch("/vault-abi.json");
  if (!res.ok) throw new Error(`Failed to load vault-abi.json: ${res.status}`);
  const json = await res.json();
  cached = new Abi(json);
  return cached;
}
