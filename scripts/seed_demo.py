#!/usr/bin/env python3
"""
Seed a local demo vault: deploy GuardianVault for Alice with 3 dev guardians.

Run against ws://127.0.0.1:9944 (portaldot_dev --dev --alice).
Prints the contract address — paste into the frontend env to start the demo.
"""

import json
import sys
from pathlib import Path

try:
    from substrateinterface import SubstrateInterface, Keypair, ContractCode
except ImportError:
    sys.exit("substrate-interface not installed. Run: pip install substrate-interface")


PORTALDOT_SS58 = 42
WS = "ws://127.0.0.1:9944"
GAS_LIMIT = 1_000_000_000_000

ROOT = Path(__file__).resolve().parent.parent
WASM = ROOT / "contracts" / "guardian_vault" / "target" / "ink" / "guardian_vault.wasm"
META = ROOT / "contracts" / "guardian_vault" / "target" / "ink" / "guardian_vault.json"


def main() -> int:
    if not WASM.is_file() or not META.is_file():
        sys.exit(
            f"Build artifacts missing.\n"
            f"  expected: {WASM}\n"
            f"  expected: {META}\n"
            f"Run `cargo contract build --release` first."
        )

    substrate = SubstrateInterface(
        url=WS,
        ss58_format=PORTALDOT_SS58,
        type_registry_preset="default",
    )

    alice = Keypair.create_from_uri("//Alice", ss58_format=PORTALDOT_SS58)
    bob = Keypair.create_from_uri("//Bob", ss58_format=PORTALDOT_SS58)
    charlie = Keypair.create_from_uri("//Charlie", ss58_format=PORTALDOT_SS58)
    dave = Keypair.create_from_uri("//Dave", ss58_format=PORTALDOT_SS58)

    code = ContractCode.create_from_contract_files(
        metadata_file=str(META), wasm_file=str(WASM), substrate=substrate
    )

    contract = code.deploy(
        keypair=alice,
        endowment=0,
        gas_limit=GAS_LIMIT,
        constructor="new",
        args={
            "guardians": [bob.ss58_address, charlie.ss58_address, dave.ss58_address],
            "threshold": 2,
            "timelock_seconds": 60,
        },
        upload_code=True,
    )

    out = {
        "vault_address": contract.contract_address,
        "owner": alice.ss58_address,
        "guardians": {
            "bob": bob.ss58_address,
            "charlie": charlie.ss58_address,
            "dave": dave.ss58_address,
        },
        "threshold": 2,
        "timelock_seconds": 60,
        "frontend_env": {
            "NEXT_PUBLIC_PORTALDOT_WS": WS,
            "NEXT_PUBLIC_VAULT_ADDRESS": contract.contract_address,
        },
    }
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
