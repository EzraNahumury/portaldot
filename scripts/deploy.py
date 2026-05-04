#!/usr/bin/env python3
"""
Deploy GuardianVault ink! contract to Portaldot.

Usage:
    python deploy.py \
        --wasm ../contracts/guardian_vault/target/ink/guardian_vault.wasm \
        --metadata ../contracts/guardian_vault/target/ink/guardian_vault.json \
        --suri "//Alice" \
        --guardians "5G...Bob,5G...Charlie,5G...Dave" \
        --threshold 2 \
        --timelock 86400 \
        --ws ws://127.0.0.1:9944

Notes:
    - Default ws://127.0.0.1:9944 connects to local --dev node.
    - For mainnet/testnet, pass --ws wss://mainnet.portaldot.io.
    - SS58 prefix Portaldot = 42.
    - POT decimals = 14.
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from substrateinterface import SubstrateInterface, Keypair, ContractCode
except ImportError:
    sys.exit("substrate-interface not installed. Run: pip install substrate-interface")


PORTALDOT_SS58 = 42
DEFAULT_WS = "ws://127.0.0.1:9944"
DEFAULT_GAS_LIMIT = 1_000_000_000_000


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Deploy GuardianVault to Portaldot.")
    p.add_argument("--wasm", required=True, type=Path, help="Path to .wasm file.")
    p.add_argument("--metadata", required=True, type=Path, help="Path to metadata.json.")
    p.add_argument("--suri", default="//Alice", help="Deployer keypair SURI.")
    p.add_argument(
        "--guardians",
        required=True,
        help="Comma-separated SS58 guardian addresses.",
    )
    p.add_argument("--threshold", type=int, required=True, help="Approval threshold M.")
    p.add_argument(
        "--timelock",
        type=int,
        default=86_400,
        help="Time-lock seconds before execute_recovery (default 24h).",
    )
    p.add_argument("--ws", default=DEFAULT_WS, help="Portaldot RPC WebSocket URL.")
    p.add_argument(
        "--endowment",
        type=int,
        default=0,
        help="POT endowment for the contract (smallest unit).",
    )
    p.add_argument(
        "--gas-limit",
        type=int,
        default=DEFAULT_GAS_LIMIT,
        help="Gas limit for deploy + init.",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()

    if not args.wasm.is_file():
        sys.exit(f"WASM not found: {args.wasm}")
    if not args.metadata.is_file():
        sys.exit(f"Metadata not found: {args.metadata}")

    guardians = [g.strip() for g in args.guardians.split(",") if g.strip()]
    if not guardians:
        sys.exit("--guardians cannot be empty.")
    if args.threshold < 1 or args.threshold > len(guardians):
        sys.exit(f"--threshold must be in [1, {len(guardians)}].")

    print(f"[1/5] Connecting to {args.ws} ...")
    substrate = SubstrateInterface(
        url=args.ws,
        ss58_format=PORTALDOT_SS58,
        type_registry_preset="default",
    )
    print(f"      chain: {substrate.chain}, version: {substrate.runtime_version}")

    print(f"[2/5] Loading deployer keypair from SURI ...")
    deployer = Keypair.create_from_uri(args.suri, ss58_format=PORTALDOT_SS58)
    print(f"      address: {deployer.ss58_address}")

    print(f"[3/5] Loading contract code ...")
    code = ContractCode.create_from_contract_files(
        metadata_file=str(args.metadata),
        wasm_file=str(args.wasm),
        substrate=substrate,
    )

    print(f"[4/5] Deploying GuardianVault ...")
    print(f"      guardians: {guardians}")
    print(f"      threshold: {args.threshold}")
    print(f"      timelock:  {args.timelock}s")
    contract = code.deploy(
        keypair=deployer,
        endowment=args.endowment,
        gas_limit=args.gas_limit,
        constructor="new",
        args={
            "guardians": guardians,
            "threshold": args.threshold,
            "timelock_seconds": args.timelock,
        },
        upload_code=True,
    )

    print(f"[5/5] Deployed.")
    print(json.dumps(
        {
            "contract_address": contract.contract_address,
            "deployer": deployer.ss58_address,
            "guardians": guardians,
            "threshold": args.threshold,
            "timelock_seconds": args.timelock,
        },
        indent=2,
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
