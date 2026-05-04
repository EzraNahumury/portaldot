# PortalGuard — Threat Model

> Lengkap dari ringkasan di `README.md` Section 13.

## Trust Boundaries

```
[ User Browser ]  ←untrusted→  [ Frontend (static, public) ]
                                       │
                                       ▼
                              [ Portaldot RPC (semi-trusted) ]
                                       │
                                       ▼
                              [ On-chain runtime + contract ]
                                       (trusted execution)
```

- Frontend tidak boleh dianggap autoritatif — semua keputusan keamanan ada di contract.
- Contract storage adalah satu-satunya source of truth.

## Aktor

| Aktor | Asumsi |
|---|---|
| **Owner asli** | Punya akses key awal. Bisa kehilangan / di-compromise. |
| **Guardian** | Honest mayoritas (`N - M + 1` dari `N`). Subset bisa malicious. |
| **Attacker eksternal** | Tidak punya key apapun. Bisa observe chain. |
| **RPC operator** | Bisa rate-limit / sensor request. Tidak bisa modify state. |

## Ancaman + Mitigasi

### T1. Guardian collusion (M guardian sepakat curi vault)
- **Damage**: ownership transfer ke alamat attacker.
- **Mitigasi**:
  - Time-lock 24 jam → owner asli punya window deteksi.
  - `cancel_recovery` callable oleh owner kapan saja sebelum execute.
  - Pilih guardian dari konteks sosial berbeda (keluarga + teman + co-worker) untuk kurangi kemungkinan collusion.
- **Residual risk**: Jika owner tidak online selama 24 jam → tidak terdeteksi. Solusi future: notifikasi push.

### T2. Owner key di-compromise
- **Damage**: attacker bisa add/remove guardian, set threshold = 1, instant takeover.
- **Mitigasi MVP**: tidak ada — `add_guardian` + `set_threshold` instan.
- **Mitigasi future**: time-lock pada perubahan guardian + `set_threshold` (multi-week delay), supaya guardian asli sempat trigger recovery duluan.

### T3. Replay attack
- **Damage**: re-eksekusi recovery yang sudah selesai.
- **Mitigasi**: setelah `execute_recovery`, `active_recovery = None` + `next_request_id` increment. Approval lama tidak bisa dipakai ulang.

### T4. DoS via spam recovery request
- **Damage**: owner / guardian flooded dengan request palsu.
- **Mitigasi**:
  - Hanya satu `active_recovery` per waktu di chain.
  - Off-chain: frontend dapat filter event berdasarkan guardian whitelist user.

### T5. Front-running execute
- **Damage**: hipotetis — attacker eksekusi sebelum owner sempat cancel.
- **Mitigasi**: owner cancel bisa dilakukan kapan saja sebelum execute. Karena time-lock 24 jam, attacker tidak bisa execute lebih awal.

### T6. Guardian hilang akses (lost key)
- **Damage**: efektif M-of-(N-1).
- **Mitigasi**: M-of-N dengan margin (mis. 2-of-4 lebih aman dari 2-of-2).

### T7. Frontend supply chain compromise
- **Damage**: frontend dapat tunjukkan request palsu ke guardian.
- **Mitigasi**:
  - Guardian validasi proposed_owner address sebelum approve.
  - Future: ENS-like nama untuk alamat supaya mudah verify.
  - Self-host frontend = mengurangi risiko.

### T8. RPC operator censorship
- **Damage**: tx tidak diteruskan ke chain.
- **Mitigasi**: gunakan multiple RPC endpoint; user dapat run node sendiri.

### T9. Smart contract bug
- **Damage**: variable. Worst case: ownership lost.
- **Mitigasi MVP**: unit tests + e2e tests.
- **Mitigasi production**: audit profesional sebelum mainnet (tidak dilakukan untuk hackathon).

## Out of Scope MVP

- Privasi guardian list (semua public on-chain).
- Multi-chain recovery.
- Asset-level vault security (MVP hanya pointer owner).
- Hardware wallet integration.
- Quantum-resistant signature.

## Disclaimer

PortalGuard adalah hackathon prototype. **Tidak diaudit**. Tidak boleh menyimpan dana signifikan. Gunakan di mainnet hanya setelah review keamanan independen.
