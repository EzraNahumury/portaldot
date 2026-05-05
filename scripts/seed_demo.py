#!/usr/bin/env python3
"""
Seed a local demo vault: deploy GuardianVault for Alice with 3 dev guardians.

Run against ws://127.0.0.1:9944 (portaldot_dev --dev --alice).
Prints the contract address — paste into the frontend env to start the demo.

Note: Portaldot's contracts pallet uses the legacy extrinsic shape
(endowment + u64 gas_limit + no storage_deposit_limit), so we compose
the call manually instead of using ContractCode.deploy().
"""

import json
import sys
from pathlib import Path

try:
    from substrateinterface import SubstrateInterface, Keypair, ContractMetadata
    from scalecodec.utils.ss58 import ss58_encode
except ImportError:
    sys.exit("substrate-interface not installed. Run: pip install substrate-interface")


PORTALDOT_SS58 = 42
WS = "ws://127.0.0.1:9944"
ENDOWMENT = 0
GAS_LIMIT = 500_000_000_000  # legacy u64 gas limit

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

    substrate = SubstrateInterface(url=WS, ss58_format=PORTALDOT_SS58)

    alice = Keypair.create_from_uri("//Alice", ss58_format=PORTALDOT_SS58)
    bob = Keypair.create_from_uri("//Bob", ss58_format=PORTALDOT_SS58)
    charlie = Keypair.create_from_uri("//Charlie", ss58_format=PORTALDOT_SS58)
    dave = Keypair.create_from_uri("//Dave", ss58_format=PORTALDOT_SS58)

    metadata = ContractMetadata.create_from_file(str(META), substrate=substrate)
    ctor = metadata.generate_constructor_data(
        name="new",
        args={
            "guardians": [bob.ss58_address, charlie.ss58_address, dave.ss58_address],
            "threshold": 2,
            "timelock_seconds": 60,
        },
    )
    ctor_hex = "0x" + ctor.data.hex() if hasattr(ctor, "data") else str(ctor)
    wasm_bytes = WASM.read_bytes()

    call = substrate.compose_call(
        call_module="Contracts",
        call_function="instantiate_with_code",
        call_params={
            "endowment": ENDOWMENT,
            "gas_limit": GAS_LIMIT,
            "code": "0x" + wasm_bytes.hex(),
            "data": ctor_hex,
            "salt": "0x",
        },
    )

    def list_contracts() -> set[str]:
        try:
            entries = substrate.query_map("Contracts", "ContractInfoOf", page_size=200)
            return {e[0].value for e in entries}
        except Exception as exc:
            print(f"warn: query_map ContractInfoOf failed: {exc}")
            return set()

    pre = list_contracts()
    extrinsic = substrate.create_signed_extrinsic(call=call, keypair=alice)
    print("Submitting deploy tx...")
    receipt = substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
    print(f"Tx in block: {receipt.block_hash}")
    post = list_contracts()
    new_contracts = list(post - pre)
    if not new_contracts:
        sys.exit("No new contract address found after deploy. Check node logs.")
    vault_address = new_contracts[0]

    out = {
        "vault_address": vault_address,
        "owner": alice.ss58_address,
        "guardians": {
            "bob": bob.ss58_address,
            "charlie": charlie.ss58_address,
            "dave": dave.ss58_address,
        },
        "threshold": 2,
        "timelock_seconds": 60,
        "block_hash": receipt.block_hash,
        "frontend_env": {
            "NEXT_PUBLIC_PORTALDOT_WS": WS,
            "NEXT_PUBLIC_VAULT_ADDRESS": vault_address,
        },
    }
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
