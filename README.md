# PortalGuard

> **Social Recovery Wallet untuk Portaldot** — Pulihkan akun Anda lewat teman tepercaya, tanpa custodian, tanpa kehilangan aset selamanya.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built on Portaldot](https://img.shields.io/badge/built%20on-Portaldot-purple.svg)](https://portaldot-dev.readthedocs.io/en/latest/)
[![ink!](https://img.shields.io/badge/contract-ink!%205.x-orange.svg)](https://use.ink/)
[![Hackathon](https://img.shields.io/badge/Portaldot%20Mini%20Hackathon-S1-green.svg)](#)

Submission untuk **Portaldot Mini Hackathon Online Season 1** (April–May 2026).

---

## Daftar Isi

1. [Masalah](#1-masalah)
2. [Solusi PortalGuard](#2-solusi-portalguard)
3. [Mengapa Portaldot](#3-mengapa-portaldot)
4. [Fitur Utama](#4-fitur-utama)
5. [Cara Kerja](#5-cara-kerja)
6. [Arsitektur](#6-arsitektur)
7. [Tech Stack](#7-tech-stack)
8. [Spesifikasi Smart Contract](#8-spesifikasi-smart-contract)
9. [Struktur Repo](#9-struktur-repo)
10. [Quickstart](#10-quickstart)
11. [Skrip Demo 3 Menit](#11-skrip-demo-3-menit)
12. [Roadmap 4 Minggu](#12-roadmap-4-minggu)
13. [Pertimbangan Keamanan](#13-pertimbangan-keamanan)
14. [Pekerjaan Lanjutan](#14-pekerjaan-lanjutan)
15. [Checklist Submission](#15-checklist-submission)
16. [Tim & Kontak](#16-tim--kontak)
17. [Lisensi & Kredit](#17-lisensi--kredit)

---

## 1. Masalah

Web3 punya satu titik gagal yang tidak pernah benar-benar diselesaikan: **private key**.

- 1 dari 5 holder crypto pernah kehilangan akses akun (riset Chainalysis 2023: ~20% Bitcoin total supply hilang permanen).
- Web2 punya "Lupa Password". Web3 tidak punya. Hilang seed phrase = hilang aset selamanya.
- Custodial wallet (CEX) "menyelesaikan" ini, tapi mengorbankan self-custody — fondasi Web3.
- Pemula Web3 tertahan masuk karena takut: "kalau saya kehilangan key, saya kehilangan semuanya."

Kita butuh recovery yang **decentralized, social, dan native blockchain** — bukan email reset, bukan KYC custodian.

---

## 2. Solusi PortalGuard

**PortalGuard** adalah social recovery wallet yang dideploy native di Portaldot.

User menunjuk **N teman tepercaya** sebagai *guardian*. Jika user kehilangan akses key, **M dari N guardian** dapat secara kolektif memulihkan kontrol akun ke key baru — semua on-chain, tanpa pihak ketiga.

```
Setup awal:    Alice tunjuk Bob, Charlie, Dave sebagai guardian (threshold 2-of-3)
Skenario loss: Alice kehilangan device + seed phrase
Recovery:      Alice generate key baru → request recovery dari device baru
               Bob & Charlie approve → contract transfer kontrol vault ke key baru
Hasil:         Alice kembali kontrol penuh atas asetnya
```

Konsepnya seperti "forgot password lewat trusted contacts" tapi **trustless dan on-chain**.

---

## 3. Mengapa Portaldot

PortalGuard memanfaatkan fitur native Portaldot — bukan tempelan blockchain.

| Fitur Portaldot | Pemanfaatan oleh PortalGuard |
|---|---|
| **Multisig pallet** (flagship Portaldot SDK) | Threshold approval guardian = native multisig pattern. |
| **ink! smart contract** | Custom recovery logic + time-lock + guardian rotation tidak bisa hanya dengan multisig pallet vanilla. |
| **Identity pallet** | Optional: bind guardian ke verified on-chain identity (anti sybil). |
| **Scheduler pallet** | Time-lock delay sebelum eksekusi recovery (anti malicious collusion). |
| **POT sebagai gas** | Setiap setup, request, approve, execute = transaksi POT gas. Native compliance. |

**Tidak ada fitur PortalGuard yang merupakan port dari chain lain.** Setiap operasi adalah call native ke Portaldot runtime + custom ink! contract.

---

## 4. Fitur Utama

### MVP (target hackathon)

- ✅ **Buat Vault** — user deposit POT + tunjuk guardian list + threshold M-of-N.
- ✅ **Tambah / Hapus Guardian** — kelola guardian (dengan time-lock untuk anti-rug).
- ✅ **Request Recovery** — siapa pun (biasanya user dengan key baru) dapat mengusulkan owner baru.
- ✅ **Approve Recovery** — guardian individu approve usulan; threshold tercapai = eligible eksekusi.
- ✅ **Execute Recovery** — setelah threshold + time-lock 24 jam, transfer kontrol vault ke owner baru.
- ✅ **Cancel Recovery** — owner asli dapat batalkan request selama time-lock belum lewat (anti hostile takeover).
- ✅ **Dashboard Frontend** — guardian list, pending recoveries, status timer.

### Bonus (jika waktu cukup)

- 🎯 Notifikasi guardian (Discord webhook / email off-chain).
- 🎯 Guardian rotation tanpa reset semua.
- 🎯 Multi-asset vault (POT + asset pallet token).
- 🎯 Identity binding via pallet `identity` untuk verified guardian.
- 🎯 QR code invite guardian (mobile-friendly).

---

## 5. Cara Kerja

### State Machine Recovery

```
        ┌──────────┐
        │  ACTIVE  │ ←─────────────────────────┐
        └────┬─────┘                            │
             │ requestRecovery(newOwner)        │ cancelRecovery()
             ▼                                  │ (owner asli)
        ┌──────────────┐                        │
        │  REQUESTED   │────────────────────────┤
        └──────┬───────┘                        │
               │ approveRecovery() oleh         │
               │ M-of-N guardian                │
               ▼                                │
        ┌──────────────┐                        │
        │   APPROVED   │────────────────────────┘
        │  + time-lock │
        └──────┬───────┘
               │ wait T hours (default 24h)
               ▼
        ┌──────────────┐
        │  EXECUTABLE  │
        └──────┬───────┘
               │ executeRecovery()
               ▼
        ┌──────────────┐
        │   RECOVERED  │ → ownership transferred
        └──────────────┘
```

### Alur Pengguna

**Setup (sekali):**
1. Alice connect wallet ke PortalGuard dApp.
2. Pilih "Create Vault", isi: deposit awal POT, daftar alamat guardian, threshold (mis. 2-of-3), durasi time-lock.
3. Tx single → contract `GuardianVault` dideploy / di-init untuk Alice.

**Recovery (skenario darurat):**
1. Alice kehilangan device. Generate key baru di device baru.
2. Buka PortalGuard dengan key baru → "Request Recovery" → masukkan vault address Alice + alamat owner baru.
3. Guardian (Bob, Charlie) menerima notifikasi (atau lihat dashboard).
4. Bob & Charlie buka dApp → review request → klik Approve → tx ke contract.
5. Setelah 2-of-3 tercapai, timer 24 jam mulai.
6. Setelah 24 jam, siapa pun dapat trigger `executeRecovery()` → kontrol vault transfer ke key baru Alice.
7. Alice kembali punya akses penuh.

---

## 6. Arsitektur

### Komponen Tingkat Tinggi

```
┌───────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Setup   │  │ Dashboard│  │  Recover │  │   Approve    │  │
│  │  Page    │  │   Page   │  │   Page   │  │     Page     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                          │                                     │
│                  @polkadot/api + @polkadot/extension-dapp      │
└──────────────────────────┼────────────────────────────────────┘
                           │ WebSocket RPC
                           ▼
┌───────────────────────────────────────────────────────────────┐
│              PORTALDOT NODE (ws://127.0.0.1:9944               │
│                          atau wss://mainnet.portaldot.io)      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │   Contracts Pallet (WASM executor)                      │ │
│  │   ┌───────────────────────────────────────────┐         │ │
│  │   │  GuardianVault (ink! contract per user)   │         │ │
│  │   │  - guardians: Vec<AccountId>              │         │ │
│  │   │  - threshold: u8                          │         │ │
│  │   │  - active_recovery: Option<RecoveryReq>   │         │ │
│  │   └───────────────────────────────────────────┘         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │   Built-in pallets: balances, identity, scheduler       │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Keputusan Desain Penting

| Keputusan | Alasan |
|---|---|
| **ink! contract per user**, bukan satu master contract | Isolasi state — bug di satu vault tidak bocor ke vault lain. UX juga lebih clean (vault address = identitas). |
| **Time-lock 24 jam default** | Window untuk owner asli menyadari & batalkan jika ini collusion attack. |
| **Threshold M-of-N**, bukan unanimous | Resilient terhadap satu guardian hilang/tidak responsif. |
| **Tidak menyimpan asset secara langsung di contract awal MVP** | MVP fokus transfer ownership pointer. Multi-asset vault = bonus feature. |
| **Frontend `@polkadot/api`** (bukan Python SDK) | UX wajib browser-friendly untuk demo. Python SDK dipakai hanya untuk skrip deploy. |

---

## 7. Tech Stack

### On-chain
- **ink! 5.x** — smart contract language (Rust → WASM).
- **cargo-contract** — build tool ink!.
- **Portaldot node** — `portaldot_dev --dev --alice` untuk lokal; `wss://mainnet.portaldot.io` untuk testnet/mainnet.

### Frontend
- **Next.js 15** (App Router) + TypeScript.
- **Tailwind CSS** + **shadcn/ui** — styling cepat & polished.
- **@polkadot/api** — interaksi Substrate JSON-RPC.
- **@polkadot/extension-dapp** — koneksi browser wallet (jika tersedia di Portaldot).
- **Zustand** — state management ringan.
- **Framer Motion** — animasi recovery flow (efek demo).
- **Recharts** atau **lucide-react** — ikon & visualisasi minimal.

### Tooling
- **PowerShell + WSL Ubuntu** — environment dev (Windows host).
- **substrate-interface (Python)** — skrip deploy & seed data.
- **Docker** (opsional) — containerize Portaldot node untuk reproducibility.
- **GitHub Actions** — CI lint contract + frontend.
- **Vercel** — deploy frontend live untuk demo URL.

### Versi terkunci (akan dilock di submission)
- Rust: stable 1.83+
- ink!: 5.0.0
- cargo-contract: 5.0.0
- Node.js: 20 LTS
- @polkadot/api: 13.x

---

## 8. Spesifikasi Smart Contract

Kontrak utama: `GuardianVault` (ink!).

### Storage

```rust
#[ink(storage)]
pub struct GuardianVault {
    owner: AccountId,
    guardians: Vec<AccountId>,
    threshold: u8,
    timelock_seconds: u64,
    active_recovery: Option<RecoveryRequest>,
    nonce: u64,
}

pub struct RecoveryRequest {
    proposed_owner: AccountId,
    approvals: Vec<AccountId>,
    requested_at: Timestamp,
    request_id: u64,
}
```

### Interface (ringkas)

| Method | Caller | Efek |
|---|---|---|
| `new(guardians, threshold, timelock)` | deployer (owner) | Init vault. |
| `add_guardian(g)` | owner | Tambah guardian (dengan time-lock perubahan). |
| `remove_guardian(g)` | owner | Hapus guardian. |
| `set_threshold(t)` | owner | Ubah threshold M. |
| `request_recovery(new_owner)` | siapa pun | Buat `RecoveryRequest`. Hanya satu aktif per waktu. |
| `approve_recovery(request_id)` | guardian | Tambah approval; revert jika bukan guardian / sudah approve. |
| `cancel_recovery(request_id)` | owner | Batalkan request (anti hostile takeover). |
| `execute_recovery(request_id)` | siapa pun | Validasi: threshold + time-lock lewat → transfer owner. |
| `get_state()` (query) | siapa pun | Read guardian list, threshold, status recovery. |

### Event

- `VaultCreated { owner, guardians, threshold }`
- `RecoveryRequested { request_id, proposed_owner, by }`
- `RecoveryApproved { request_id, guardian }`
- `RecoveryExecuted { request_id, old_owner, new_owner }`
- `RecoveryCancelled { request_id }`
- `GuardianAdded` / `GuardianRemoved`

### Invariants Keamanan

1. `threshold <= guardians.len()` selalu.
2. `threshold >= 1`.
3. Guardian tidak bisa duplikat.
4. Hanya owner yang dapat batal recovery.
5. Hanya owner yang dapat ubah guardian (dengan time-lock supaya owner yang diretas tidak bisa langsung evict semua guardian).
6. `execute_recovery` revert jika: request tidak ada, threshold belum tercapai, time-lock belum lewat.
7. Setelah execute, request lama dihapus + nonce naik (replay protection).

---

## 9. Struktur Repo

```
portaldot/                              # root
├── README.md                            # dokumen ini
├── requirements.md                      # persyaratan hackathon (referensi)
├── LICENSE                              # MIT
├── .gitignore
│
├── contracts/
│   └── guardian_vault/
│       ├── Cargo.toml
│       ├── lib.rs                       # entry contract ink!
│       ├── src/
│       │   ├── recovery.rs              # logic state machine recovery
│       │   ├── guardian.rs              # logic add/remove guardian
│       │   └── errors.rs                # enum Error
│       └── tests/
│           └── e2e.rs                   # ink_e2e tests
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # landing page
│   │   ├── setup/page.tsx               # buat vault
│   │   ├── dashboard/page.tsx           # vault saya
│   │   ├── recover/page.tsx             # request recovery
│   │   └── approve/[id]/page.tsx        # guardian approve
│   ├── components/
│   │   ├── ui/                          # shadcn components
│   │   ├── GuardianList.tsx
│   │   ├── RecoveryStatus.tsx
│   │   ├── ConnectWallet.tsx
│   │   └── CountdownTimer.tsx
│   ├── lib/
│   │   ├── portaldot.ts                 # @polkadot/api setup
│   │   ├── contract.ts                  # contract abi loader + call helpers
│   │   ├── store.ts                     # zustand
│   │   └── format.ts                    # utility format POT, addr, time
│   └── public/
│       └── vault-abi.json               # generated from cargo-contract
│
├── scripts/
│   ├── deploy.py                        # substrate-interface deploy script
│   ├── seed-demo.py                     # populate demo vault + 3 guardian
│   └── faucet-request.md                # petunjuk minta testnet POT
│
├── docs/
│   ├── architecture.md                  # diagram arsitektur lengkap
│   ├── threat-model.md                  # analisis serangan
│   ├── demo-script.md                   # naskah demo 3 menit
│   └── images/
│       └── *.png
│
├── .github/
│   └── workflows/
│       ├── contract-ci.yml              # cargo build + test
│       └── frontend-ci.yml              # next build + typecheck
│
└── demo/
    ├── video.md                         # link video YouTube/Loom
    └── screenshots/
```

---

## 10. Quickstart

### Prasyarat

| Tool | Versi | Catatan |
|---|---|---|
| WSL2 Ubuntu | 22.04+ | Wajib di Windows; node Portaldot tidak jalan native. |
| Rust toolchain | 1.83+ stable | `rustup target add wasm32-unknown-unknown` |
| cargo-contract | 5.0.0 | `cargo install --force --locked cargo-contract` |
| Node.js | 20 LTS | Frontend. |
| Python | 3.10+ | Skrip deploy. |
| `substrate-interface` | latest | `pip install substrate-interface` |

### Install Portaldot Node (lokal)

```bash
# di WSL Ubuntu
wget https://portaldot-dev.readthedocs.io/.../portaldot-testnet-ubuntu.tar.gz
tar -xzf portaldot-testnet-ubuntu.tar.gz
chmod 755 portaldot_dev
./portaldot_dev --dev --alice --rpc-cors all --rpc-external --ws-external
```

Node mendengarkan di `ws://127.0.0.1:9944`.

### Build & Deploy Contract

```bash
cd contracts/guardian_vault
cargo +stable contract build --release
# output: target/ink/guardian_vault.contract + .wasm + metadata.json

# deploy via Python script
cd ../../scripts
python deploy.py \
  --wasm ../contracts/guardian_vault/target/ink/guardian_vault.wasm \
  --metadata ../contracts/guardian_vault/target/ink/guardian_vault.json \
  --suri "//Alice" \
  --guardians "5G...Bob,5G...Charlie,5G...Dave" \
  --threshold 2 \
  --timelock 86400
```

### Jalankan Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# isi: NEXT_PUBLIC_PORTALDOT_WS=ws://127.0.0.1:9944
#      NEXT_PUBLIC_VAULT_ABI_PATH=/vault-abi.json
npm run dev
# buka http://localhost:3000
```

### Skrip Seed Demo

```bash
python scripts/seed-demo.py
# Membuat:
#  - Vault Alice dengan guardian Bob, Charlie, Dave (2-of-3)
#  - Deposit 100 POT
#  - Print URL dashboard untuk demo
```

---

## 11. Skrip Demo 3 Menit

### Persiapan
- Browser dengan 3 tab: Alice (vault owner), Bob (guardian), Charlie (guardian).
- Wallet sudah loaded keypair masing-masing.
- Node lokal running, vault sudah seeded.

### Naskah

**0:00–0:20 — Hook**
> "Bayangkan besok pagi Anda kehilangan HP — seed phrase ada di situ. Di Web2, Anda klik 'Lupa Password'. Di Web3? Aset Anda hilang selamanya. PortalGuard menyelesaikan ini di Portaldot."

**0:20–0:50 — Setup Vault (sudah di-seed sebelumnya, ditampilkan)**
- Tunjukkan dashboard Alice: vault aktif, 100 POT, 3 guardian (Bob, Charlie, Dave), threshold 2-of-3.
- "Alice menunjuk 3 teman tepercaya. 2 di antaranya cukup untuk membantu pulihkan akun jika dia hilang akses."

**0:50–1:30 — Skenario Loss**
- Tutup tab Alice secara dramatis — "device hilang."
- Buka tab baru, generate keypair baru: "ini Alice dari device baru, key baru."
- Buka PortalGuard → "Recover Account" → masukkan vault address + alamat key baru → submit.
- Tampilkan event di explorer: `RecoveryRequested`.

**1:30–2:20 — Guardian Approval**
- Switch ke tab Bob → notifikasi muncul ("Alice request recovery").
- Klik Approve → tx confirm. Counter: 1/2.
- Switch ke tab Charlie → review → Approve → tx confirm. Counter: 2/2 ✓.
- Status berubah ke "APPROVED — execute available in 24h" + countdown.

**2:20–2:45 — Time-warp & Execute**
- "Untuk demo, kita kompres time-lock ke 60 detik."
- Tunggu 60 detik (atau cut video). Status: "EXECUTABLE."
- Klik `Execute Recovery`. Tx confirm. Event `RecoveryExecuted`.
- Buka dashboard dari key baru Alice → vault sekarang dimiliki olehnya. 100 POT utuh.

**2:45–3:00 — Closing**
> "Self-custody tanpa risiko hilang permanen. Native Portaldot, multisig pallet, ink! contract. Hak akses Anda. Recovery yang Anda kontrol. PortalGuard."

### Tips Demo
- **Jangan demo live di mainnet** — pakai local node, kompres time-lock.
- Rekam dulu sebagai backup video, walaupun ada slot live.
- Siapkan skenario "guardian malicious" di Q&A: "bagaimana kalau 2 guardian collusion?" → jawab: time-lock + cancel by owner.

---

## 12. Roadmap 4 Minggu

Hari ini: **2026-05-04**. Deadline: **2026-05-31**. Demo Day: **2026-05-31**.

### Minggu 1 (5 Mei – 11 Mei) — Foundation
- [x] Riset Portaldot docs ✓
- [x] Pilih ide & tulis README ✓
- [ ] Setup environment WSL + Portaldot node lokal
- [ ] Hello-world ink! contract berhasil deploy via Python script
- [ ] Frontend Next.js skeleton + connect ke `ws://127.0.0.1:9944`
- [ ] Request testnet POT via Discord Portaldot

### Minggu 2 (12 Mei – 18 Mei) — Contract Core
- [ ] Implementasi `GuardianVault` storage + constructor
- [ ] `request_recovery` + `approve_recovery` + threshold logic
- [ ] `execute_recovery` + time-lock check
- [ ] `cancel_recovery` + invariants
- [ ] Unit tests (ink! native test) → coverage > 80%
- [ ] e2e test 1 happy path + 1 cancel path

### Minggu 3 (19 Mei – 25 Mei) — Frontend & Integration
- [ ] Setup vault page (form + deploy tx)
- [ ] Dashboard page (read state + list)
- [ ] Recover page (submit request)
- [ ] Approve page (guardian view + approve button)
- [ ] Countdown timer + status realtime
- [ ] Polish UI (Tailwind + shadcn + Framer Motion)
- [ ] Deploy frontend ke Vercel

### Minggu 4 (26 Mei – 31 Mei) — Polish & Submission
- [ ] Threat model doc + audit internal
- [ ] Bonus features 1–2 jika sempat
- [ ] Rekam video demo (3 menit) + upload YouTube
- [ ] README final pass + screenshot
- [ ] Submit GitHub repo + demo video link
- [ ] Demo Day live (31 Mei)

### Buffer & Risiko
- **2 hari buffer** di Minggu 4 untuk bug & polish.
- Kalau testnet POT tidak datang dari Discord di akhir Minggu 1 → fallback ke `--dev --alice` lokal saja, jelaskan di README.
- Kalau `@polkadot/extension-dapp` tidak compatible → fallback ke "import keypair via paste" (UX kurang bagus, tapi demo tetap jalan).

---

## 13. Pertimbangan Keamanan

### Ancaman & Mitigasi

| Serangan | Mitigasi |
|---|---|
| Guardian collusion (M guardian sepakat curi vault) | Time-lock 24 jam → owner asli punya window untuk cancel. |
| Owner di-compromise (attacker punya key owner) | Attacker bisa ganti guardian, tapi `add/remove guardian` juga ber-time-lock — guardian asli punya kesempatan trigger recovery duluan. |
| Replay attack | Setiap recovery punya `request_id` + nonce. Setelah execute, request dihapus. |
| Denial of service (spam request) | Hanya satu `active_recovery` pada satu waktu. Owner dapat cancel. |
| Front-running execute | Tidak ada incentive front-run karena `execute_recovery` tidak transfer asset arbitrer — hanya ubah owner pointer. |
| Guardian hilang akses | M-of-N memungkinkan resilience — kehilangan 1 dari 3 guardian masih recoverable. |

### Yang TIDAK dijamin MVP
- ❌ Audit profesional — ini hackathon prototype, **jangan deploy real funds**.
- ❌ Privacy guardian list — public di chain. Future: ZKP untuk hide.
- ❌ Cross-chain recovery — single chain (Portaldot) only.

### Disclaimer
> PortalGuard adalah prototype hackathon. Tidak diaudit oleh pihak ketiga. Jangan menyimpan dana yang signifikan tanpa review keamanan independen.

---

## 14. Pekerjaan Lanjutan

Pasca-hackathon, peluang dev di ekosistem Portaldot:

1. **Audit + Mainnet launch** — kerja sama dengan tim Portaldot untuk security review.
2. **Mobile app** — recovery dari HP teman tanpa setup wallet desktop.
3. **Identity binding** — guardian harus punya verified on-chain identity via `pallet_identity`.
4. **Asset vault** — simpan POT + asset pallet token langsung di contract, recovery transfer semuanya.
5. **Cross-chain** — gunakan Portaldot cross-chain gateway untuk recovery aset di parachain lain.
6. **Privacy** — ZKP-based guardian (hide siapa guardian Anda).
7. **Subscription model** — service fee kecil untuk maintenance + notifikasi guardian.

---

## 15. Checklist Submission

Sesuai `requirements.md`:

- [ ] **Built on Portaldot** — ✓ ink! contract + native pallets.
- [ ] **POT sebagai gas** — ✓ semua tx pakai POT native.
- [ ] **Runnable MVP** — target Minggu 3.
- [ ] **Demo-ready** — script demo sudah disiapkan, video direkam Minggu 4.
- [ ] **Core contracts open source** — `contracts/guardian_vault/` MIT license.
- [ ] **GitHub repo** — link akan ditambahkan di submission portal.
- [ ] **README** — dokumen ini.
- [ ] **Demo video** — link YouTube/Loom akan ditambahkan di `demo/video.md`.

### Mandatory Eligibility Criterion
- ✅ **Portaldot Native Deployment** — bukan port. Multisig pallet + ink! contract dipakai sebagai inti, bukan tempelan.

---

## 16. Tim & Kontak

**Builder:** Ezra Kristanto Nahumury
**Email:** ezranhmry@gmail.com
**Discord:** _akan diisi setelah join Portaldot Discord_
**GitHub:** _akan diisi_

Solo build untuk Mini Hackathon S1.

---

## 17. Lisensi & Kredit

### Lisensi
- **Smart contract** (`contracts/`): MIT — `LICENSE`.
- **Frontend** (`frontend/`): MIT.

### Kredit
- **Portaldot** — chain + dev docs (https://portaldot-dev.readthedocs.io/).
- **ink!** team — smart contract framework.
- **Polkadot.js** — `@polkadot/api`.
- **Argent Wallet, Loopring** — inspirasi konsep social recovery (Ethereum prior art).
- **shadcn/ui** + **Tailwind CSS** — UI tooling.

### Referensi Konsep Social Recovery
- Vitalik Buterin, "Why we need wide adoption of social recovery wallets" (2021).
- Argent Wallet whitepaper.
- ERC-4337 Account Abstraction (Ethereum sister concept).

PortalGuard membawa konsep ini native ke Portaldot — bukan port, melainkan implementasi ulang dengan primitif Portaldot (multisig pallet + ink! + scheduler).

---

**🚀 Built for Portaldot Mini Hackathon Online S1 — May 2026.**
