# PortalGuard — Architecture

> Detail tambahan untuk arsitektur PortalGuard. Ringkasan ada di `README.md` Section 6.

## Tujuan Dokumen

- Menjelaskan komponen sistem + tanggung jawab masing-masing.
- Mendokumentasikan keputusan desain non-trivial.
- Menjadi acuan saat merubah / extend contract.

## Komponen

### 1. `GuardianVault` (ink! contract)

Core logic. Satu instance per user (deployer = owner awal).

**Tanggung jawab:**
- Menyimpan owner, guardian list, threshold, time-lock.
- Mengelola lifecycle `RecoveryRequest`.
- Enforce invariant keamanan (lihat Section 13 README).

**Tidak bertanggung jawab:**
- Menyimpan asset POT secara langsung (MVP). Vault hanya pointer ownership.
- Off-chain notifikasi guardian (handled by frontend / future bot).

### 2. Frontend (Next.js 16, App Router)

**Pages:**
- `/` — landing + connect wallet.
- `/setup` — form buat vault baru.
- `/dashboard` — list vault user, status recovery aktif.
- `/recover` — form request recovery.
- `/approve/[id]` — guardian approve view.

**Library layer (`lib/`):**
- `portaldot.ts` — singleton `ApiPromise` (`@polkadot/api`).
- `contract.ts` — `ContractPromise` wrapper + tx helpers.
- `store.ts` — zustand global state (account, contract abi).

### 3. Skrip Python

- `deploy.py` — production deploy (CLI flags).
- `seed_demo.py` — local demo bootstrap.

## Data Flow — Setup

```
User Browser  ─signs─>  @polkadot/extension-dapp
        │                       │
        ▼                       ▼
  setup form ─────────> ApiPromise.tx.contracts.instantiateWithCode
                                │
                                ▼
                        Portaldot Node ──> Contracts pallet
                                                │
                                                ▼
                                    GuardianVault::new(
                                      guardians, threshold, timelock
                                    )
```

## Data Flow — Recovery

```
1. New device user        ─> request_recovery(new_owner)
                              [event RecoveryRequested]

2. Guardians (UI watcher) ─> approve_recovery(id)
                              [event RecoveryApproved x N]

3. Threshold reached + timelock elapsed
                          ─> execute_recovery(id)
                              [event RecoveryExecuted]
                              owner = new_owner
```

## Keputusan Desain Penting

1. **One contract per user, bukan factory + master**
   Alasan: isolasi state + UX address-as-vault.
   Trade-off: deployment cost lebih tinggi vs. registry pattern.

2. **`active_recovery` sebagai `Option<RecoveryRequest>`**
   Alasan: paksa hanya satu recovery aktif per waktu — anti spam DoS.
   Trade-off: jika owner ingin batalkan + restart, perlu 2 tx.

3. **Time-lock di-store sebagai detik, dikalibrasi ke ms saat compare**
   Alasan: param user-friendly. `Self::env().block_timestamp()` dalam ms.

4. **Tidak ada pause / kill switch admin**
   Alasan: hackathon prototype, kurangi attack surface. Future: emergency pause via guardian unanimous.

5. **`is_guardian` sebagai `Mapping`, plus `guardians: Vec`**
   Alasan: O(1) check + O(n) enumerate. Trade-off storage redundancy. Acceptable karena guardian count <= 32.

## Future Refactor

- Factory contract untuk deduplikasi WASM upload.
- Asset vault: integrasi `pallet_assets` untuk multi-token recovery.
- Identity binding via `pallet_identity` `super_of` lookup.
