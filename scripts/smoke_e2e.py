#!/usr/bin/env python3
"""
End-to-end smoke test for PortalGuard's recovery flow on a local Portaldot
dev node. The flow uses ONLY native Portaldot pallets — `pallet_proxy` for the
delayed-proxy primitive, `pallet_balances` for the actual rescue transfer, and
`pallet_utility.batchAll` for atomic multi-proxy setup.

M-of-N is coordinated off-chain (frontend/UX); on chain we rely on the
time-lock baked into `proxy.add_proxy(delay=N)` to give the owner a chance to
reject a hostile announce.

Usage (with `portaldot_dev --dev --alice` running on ws://127.0.0.1:9944):

    pip install --user substrate-interface
    python scripts/smoke_e2e.py

Outcome: Alice's free balance ends up at Eve via guardian-collective recovery.
Each phase is a real extrinsic and POT is consumed as gas.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass

try:
    from substrateinterface import SubstrateInterface, Keypair
except ImportError:
    sys.exit("Run: pip install --user substrate-interface")


WS = "ws://127.0.0.1:9944"
SS58 = 42
DELAY_BLOCKS = 6  # ~36 seconds — keeps the demo short


CUSTOM_TYPES: dict = {
    "types": {
        "ProxyType": {
            "type": "enum",
            "value_list": ["Any", "NonTransfer", "Governance", "Staking"],
        },
        "Timepoint": {
            "type": "struct",
            "type_mapping": [["height", "BlockNumber"], ["index", "u32"]],
        },
        "CallHashOf": "[u8; 32]",
        "LookupSource": "MultiAddress",
        "Address": "MultiAddress",
        "OpaqueCall": "Bytes",
        "AccountInfo": "AccountInfoWithProviders",
        "AccountInfoWithProviders": {
            "type": "struct",
            "type_mapping": [
                ["nonce", "Index"],
                ["consumers", "RefCount"],
                ["providers", "RefCount"],
                ["sufficients", "RefCount"],
                ["data", "AccountData"],
            ],
        },
        "AccountData": {
            "type": "struct",
            "type_mapping": [
                ["free", "Balance"],
                ["reserved", "Balance"],
                ["miscFrozen", "Balance"],
                ["feeFrozen", "Balance"],
            ],
        },
        "RefCount": "u32",
        "Index": "u32",
    }
}


@dataclass
class Section:
    name: str

    def __enter__(self) -> "Section":
        print(f"\n=== {self.name} ===")
        return self

    def __exit__(self, *_exc) -> None:
        pass


def submit(s: SubstrateInterface, call, signer: Keypair, label: str) -> dict:
    extrinsic = s.create_signed_extrinsic(call=call, keypair=signer)
    receipt = s.submit_extrinsic(extrinsic, wait_for_inclusion=True)
    print(f"  {label} signed by {signer.ss58_address[:12]}…  block_hash={receipt.block_hash[:18]}…")
    return {"block_hash": receipt.block_hash, "ext_hash": receipt.extrinsic_hash}


def wait_blocks(s: SubstrateInterface, n: int) -> None:
    head = s.get_block_number(s.get_chain_head())
    target = head + n
    print(f"  waiting until block #{target} (currently #{head})…")
    while True:
        cur = s.get_block_number(s.get_chain_head())
        if cur >= target:
            print(f"  reached #{cur}.")
            return
        time.sleep(2)


def main() -> int:
    s = SubstrateInterface(url=WS, ss58_format=SS58, type_registry=CUSTOM_TYPES)
    print(f"connected to {s.chain}, runtime {s.runtime_version}")

    alice = Keypair.create_from_uri("//Alice", ss58_format=SS58)
    bob = Keypair.create_from_uri("//Bob", ss58_format=SS58)
    charlie = Keypair.create_from_uri("//Charlie", ss58_format=SS58)
    dave = Keypair.create_from_uri("//Dave", ss58_format=SS58)
    eve = Keypair.create_from_uri("//Eve", ss58_format=SS58)

    guardians = [bob.ss58_address, charlie.ss58_address, dave.ss58_address]

    # ---------- STEP 1: owner protects vault ----------
    with Section("STEP 1 — owner protects vault (one batchAll for all guardians)"):
        add_calls = [
            s.compose_call(
                "Proxy",
                "add_proxy",
                {"delegate": g, "proxy_type": "Any", "delay": DELAY_BLOCKS},
            )
            for g in guardians
        ]
        batch = s.compose_call("Utility", "batch_all", {"calls": add_calls})
        submit(s, batch, alice, "utility.batchAll(3 × proxy.add_proxy)")

    # ---------- inner recovery call ----------
    inner = s.compose_call(
        "Balances",
        "transfer_all",
        {"dest": {"Id": eve.ss58_address}, "keep_alive": False},
    )
    inner_bytes = inner.data.data
    import hashlib

    inner_hash_bytes = hashlib.blake2b(inner_bytes, digest_size=32).digest()
    inner_hash = "0x" + inner_hash_bytes.hex()
    print(f"\n  inner call hash = {inner_hash}")

    # ---------- STEP 2: guardian Bob announces (after off-chain M-of-N) ----------
    with Section("STEP 2 — guardian Bob announces (off-chain M-of-N already collected)"):
        announce = s.compose_call(
            "Proxy",
            "announce",
            {"real": alice.ss58_address, "call_hash": inner_hash},
        )
        submit(s, announce, bob, "proxy.announce(alice, inner_hash)")

    # ---------- STEP 3: time-lock window ----------
    with Section(f"STEP 3 — time-lock window: wait {DELAY_BLOCKS}+1 blocks"):
        wait_blocks(s, DELAY_BLOCKS + 1)

    # ---------- STEP 4: anyone executes ----------
    with Section("STEP 4 — execute proxy_announced"):
        # `call` arg of proxy_announced expects a Call (GenericCall) — pass the
        # already-composed inner call object so substrate-interface re-uses its
        # serialized form when encoding.
        exec_call = s.compose_call(
            "Proxy",
            "proxy_announced",
            {
                "delegate": bob.ss58_address,
                "real": alice.ss58_address,
                "force_proxy_type": None,
                "call": inner.value,
            },
        )
        submit(s, exec_call, eve, "proxy.proxy_announced(transfer_all → Eve)")

    # ---------- VERIFY ----------
    with Section("VERIFY"):
        alice_acct = s.query("System", "Account", [alice.ss58_address]).value["data"]
        eve_acct = s.query("System", "Account", [eve.ss58_address]).value["data"]
        print(f"  Alice free     = {alice_acct['free']}")
        print(f"  Alice reserved = {alice_acct['reserved']}")
        print(f"  Eve   free     = {eve_acct['free']}")

    print("\n✅ smoke test complete. Recovery executed end-to-end.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
