"use client";

import { ApiPromise } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import type { Signer } from "@polkadot/api/types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import { loadVaultAbi } from "./abi";

const DEFAULT_GAS_LIMIT = {
  refTime: 1_000_000_000_000n,
  proofSize: 1_000_000n,
};
const STORAGE_DEPOSIT_LIMIT = null;

export async function getVaultContract(
  api: ApiPromise,
  address: string,
): Promise<ContractPromise> {
  const abi = await loadVaultAbi();
  return new ContractPromise(api, abi, address);
}

export type RecoveryRequest = {
  id: string;
  proposedOwner: string;
  approvals: string[];
  requestedAt: bigint;
};

export type VaultState = {
  owner: string;
  guardians: string[];
  threshold: number;
  timelockSeconds: bigint;
  activeRecovery: RecoveryRequest | null;
};

function buildOpts(api: ApiPromise) {
  return {
    gasLimit: api.registry.createType("WeightV2", DEFAULT_GAS_LIMIT) as WeightV2,
    storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
  };
}

type ResultLike<T> = T | { ok?: T } | null | undefined;

function unwrap<T>(value: ResultLike<T>): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "ok" in (value as Record<string, unknown>)) {
    return (value as { ok?: T }).ok ?? null;
  }
  return value as T;
}

export async function readVaultState(
  contract: ContractPromise,
  caller: string,
): Promise<VaultState> {
  const api = contract.api as ApiPromise;
  const opts = buildOpts(api);

  const [ownerRes, guardiansRes, thresholdRes, timelockRes, activeRes] = await Promise.all([
    contract.query.getOwner(caller, opts),
    contract.query.getGuardians(caller, opts),
    contract.query.getThreshold(caller, opts),
    contract.query.getTimelockSeconds(caller, opts),
    contract.query.getActiveRecovery(caller, opts),
  ]);

  const owner = (unwrap<string>(ownerRes.output?.toJSON() as ResultLike<string>) ??
    ownerRes.output?.toString() ??
    "") as string;

  const guardians = (unwrap<string[]>(guardiansRes.output?.toJSON() as ResultLike<string[]>) ??
    []) as string[];

  const threshold = Number(
    unwrap<number | string>(thresholdRes.output?.toJSON() as ResultLike<number | string>) ?? 0,
  );

  const timelockRaw =
    unwrap<number | string>(timelockRes.output?.toJSON() as ResultLike<number | string>) ?? 0;
  const timelockSeconds = BigInt(timelockRaw as number | string);

  const active = unwrap<{
    id: string | number;
    proposedOwner: string;
    approvals: string[];
    requestedAt: string | number;
  }>(
    activeRes.output?.toJSON() as ResultLike<{
      id: string | number;
      proposedOwner: string;
      approvals: string[];
      requestedAt: string | number;
    }>,
  );

  const activeRecovery: RecoveryRequest | null = active
    ? {
        id: String(active.id),
        proposedOwner: active.proposedOwner,
        approvals: active.approvals ?? [],
        requestedAt: BigInt(active.requestedAt),
      }
    : null;

  return {
    owner,
    guardians,
    threshold,
    timelockSeconds,
    activeRecovery,
  };
}

export type TxStatusCb = (status: string) => void;

type SignAndSendCb = {
  signAndSend: (
    addr: string,
    options: { signer: Signer },
    cb: (result: {
      status: {
        isInBlock: boolean;
        isFinalized: boolean;
        asInBlock?: { toString(): string };
        asFinalized?: { toString(): string };
      };
      dispatchError?: { toString(): string };
    }) => void,
  ) => Promise<() => void>;
};

async function signAndSend(
  contract: ContractPromise,
  signerAddr: string,
  signer: Signer,
  method: string,
  args: unknown[],
  onStatus?: TxStatusCb,
): Promise<string> {
  const api = contract.api as ApiPromise;
  const txMap = contract.tx as unknown as Record<
    string,
    (opts: unknown, ...a: unknown[]) => SignAndSendCb
  >;
  const txFn = txMap[method];
  if (!txFn) throw new Error(`Contract method not found: ${method}`);

  const opts = {
    gasLimit: api.registry.createType("WeightV2", DEFAULT_GAS_LIMIT) as WeightV2,
    storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
    value: 0,
  };
  const extrinsic = txFn(opts, ...args);

  return new Promise((resolve, reject) => {
    extrinsic
      .signAndSend(signerAddr, { signer }, (result) => {
        if (result.dispatchError) {
          reject(new Error(result.dispatchError.toString()));
          return;
        }
        if (result.status.isInBlock) {
          onStatus?.(`In block: ${result.status.asInBlock?.toString() ?? ""}`);
        } else if (result.status.isFinalized) {
          const hash = result.status.asFinalized?.toString() ?? "";
          onStatus?.(`Finalized: ${hash}`);
          resolve(hash);
        }
      })
      .catch(reject);
  });
}

export async function callRequestRecovery(
  contract: ContractPromise,
  signerAddr: string,
  signer: Signer,
  proposedOwner: string,
  onStatus?: TxStatusCb,
): Promise<string> {
  return signAndSend(contract, signerAddr, signer, "requestRecovery", [proposedOwner], onStatus);
}

export async function callApproveRecovery(
  contract: ContractPromise,
  signerAddr: string,
  signer: Signer,
  requestId: string | bigint,
  onStatus?: TxStatusCb,
): Promise<string> {
  return signAndSend(contract, signerAddr, signer, "approveRecovery", [requestId], onStatus);
}

export async function callExecuteRecovery(
  contract: ContractPromise,
  signerAddr: string,
  signer: Signer,
  requestId: string | bigint,
  onStatus?: TxStatusCb,
): Promise<string> {
  return signAndSend(contract, signerAddr, signer, "executeRecovery", [requestId], onStatus);
}

export async function callCancelRecovery(
  contract: ContractPromise,
  signerAddr: string,
  signer: Signer,
  requestId: string | bigint,
  onStatus?: TxStatusCb,
): Promise<string> {
  return signAndSend(contract, signerAddr, signer, "cancelRecovery", [requestId], onStatus);
}

export async function deployVault(
  api: ApiPromise,
  signerAddr: string,
  signer: Signer,
  guardians: string[],
  threshold: number,
  timelockSeconds: number,
  onStatus?: TxStatusCb,
): Promise<{ address: string; hash: string }> {
  const abi = await loadVaultAbi();
  const codeRes = await fetch("/vault-abi.json");
  if (!codeRes.ok) throw new Error("Failed to load ABI for deploy.");

  const wasmRes = await fetch("/vault.wasm");
  if (!wasmRes.ok) {
    throw new Error(
      "vault.wasm not present in /public — copy contracts/guardian_vault/target/ink/guardian_vault.wasm there.",
    );
  }
  const wasmBytes = new Uint8Array(await wasmRes.arrayBuffer());

  const code = api.tx.contracts.instantiateWithCode;
  const opts = {
    gasLimit: api.registry.createType("WeightV2", DEFAULT_GAS_LIMIT),
    storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
  };

  const ctor = abi.constructors.find((c) => c.method === "new");
  if (!ctor) throw new Error("Constructor 'new' not found in ABI.");
  const data = ctor.toU8a([guardians, threshold, timelockSeconds]);

  const extrinsic = code(0, opts.gasLimit, opts.storageDepositLimit, wasmBytes, data, "0x");

  return new Promise((resolve, reject) => {
    extrinsic
      .signAndSend(signerAddr, { signer }, (result: {
        status: { isInBlock: boolean; isFinalized: boolean; asFinalized?: { toString(): string } };
        events: Array<{ event: { method: string; data: { toJSON(): unknown }[] } }>;
        dispatchError?: { toString(): string };
      }) => {
        if (result.dispatchError) {
          reject(new Error(result.dispatchError.toString()));
          return;
        }
        if (result.status.isInBlock) {
          onStatus?.("Tx in block, waiting for finalization...");
        }
        if (result.status.isFinalized) {
          const instantiated = result.events.find((e) => e.event.method === "Instantiated");
          if (!instantiated) {
            reject(new Error("Instantiated event not found."));
            return;
          }
          const eventData = instantiated.event.data;
          const address = String(eventData[1]?.toJSON() ?? "");
          const hash = result.status.asFinalized?.toString() ?? "";
          onStatus?.(`Deployed: ${address}`);
          resolve({ address, hash });
        }
      })
      .catch(reject);
  });
}
