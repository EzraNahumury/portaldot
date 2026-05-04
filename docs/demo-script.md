# PortalGuard — Demo Script (3 Menit)

> Versi extended dari `README.md` Section 11 untuk dipakai saat rekam video Demo Day.

## Persiapan Pre-Recording

### Hardware / OS
- 2 monitor (atau 2 window) — kiri: terminal + node logs, kanan: browser.
- Resolusi 1920×1080 minimum (lebih baik 2560×1440) untuk OBS / screen recorder.
- Mute notifikasi sistem.

### State Awal
- Portaldot node running (`./portaldot_dev --dev --alice`).
- Frontend running di `http://localhost:3000`.
- Contract sudah dideploy via `seed_demo.py` — vault address di env Next.js.
- 4 browser tab disiapkan dengan keypair berbeda:
  1. **Tab Alice (owner asli)** — sudah connected dengan `//Alice`.
  2. **Tab Alice baru** — fresh, akan generate keypair baru live.
  3. **Tab Bob (guardian)** — connected `//Bob`.
  4. **Tab Charlie (guardian)** — connected `//Charlie`.

### Environment Override untuk Demo
- `timelock_seconds = 60` (bukan 86400) → demo cepat.
- Dokumentasikan di voiceover supaya jujur ke juri.

## Naskah (timestamp + voice + action)

### 0:00 – 0:20 — Hook
**Voice:**
> "Bayangkan besok pagi Anda kehilangan HP — seed phrase Anda hilang bersamanya. Di Web2, Anda klik 'Lupa Password'. Di Web3? Aset Anda hilang selamanya. PortalGuard menyelesaikan ini di Portaldot."

**Visual:** Landing page hero `/`. Animasi judul muncul.

### 0:20 – 0:50 — Setup Vault (recap state pre-seeded)
**Voice:**
> "Alice telah menyiapkan vault PortalGuard. Dia menunjuk Bob, Charlie, dan Dave sebagai guardian — 2 dari 3 cukup untuk pulihkan akun jika dia hilang akses."

**Visual:**
- Tab Alice → `/dashboard`. Tampil: vault address, 100 POT, 3 guardian avatar, threshold 2-of-3, status ACTIVE.
- Highlight kartu vault dengan animasi border.

### 0:50 – 1:30 — Loss Scenario
**Voice:**
> "Sekarang Alice kehilangan HP-nya. Dia generate key baru di device baru — dan ingin mendapatkan kembali kontrol vault."

**Visual:**
- Tutup tab Alice (drama).
- Buka tab baru → klik "Generate new keypair" → tampil alamat baru.
- Connect ke PortalGuard → buka `/recover`.
- Form: vault address (paste / pilih dari URL), proposed new owner = key baru.
- Klik **Request Recovery** → loading spinner → success toast.
- Switch ke terminal sebentar — tampil event log `RecoveryRequested(id=1, proposed=5...)`.

### 1:30 – 2:20 — Guardian Approval
**Voice:**
> "Bob dan Charlie melihat request ini. Setelah verifikasi via channel pribadi mereka — mereka approve."

**Visual:**
- Switch tab Bob → `/approve/1`.
- Tampil: detail request (proposed owner, requested at, current approvals 0/2).
- Klik **Approve** → tx confirm → counter naik 1/2.
- Switch tab Charlie → ulang. Counter 2/2 ✓.
- Status berubah "APPROVED — execute available in 60s" + countdown live.

### 2:20 – 2:45 — Time-warp & Execute
**Voice:**
> "Time-lock ini biasanya 24 jam — window untuk Alice asli batalkan jika ini collusion. Untuk demo kita pakai 60 detik. ... Sekarang siap eksekusi."

**Visual:**
- Countdown ke 0.
- Tombol **Execute Recovery** aktif → klik → tx confirm.
- Animasi sukses (Framer Motion) — checkmark green.
- Switch ke tab Alice baru → `/dashboard` → vault sekarang dimiliki olehnya. 100 POT utuh.

### 2:45 – 3:00 — Closing
**Voice:**
> "Self-custody tanpa risiko hilang permanen. Native Portaldot — multisig pallet, ink! contract, POT gas. PortalGuard. Web3 yang aman untuk semua orang."

**Visual:**
- Logo PortalGuard + tagline.
- URL repo + nama builder.

## Backup / Plan B

| Risiko | Plan B |
|---|---|
| Browser extension wallet tidak compatible Portaldot | Demo dengan keypair pasted langsung di UI (tidak elegant tapi jalan). |
| Tx fail karena gas estimate | Pre-compute gas limit + hardcode di tx call. |
| Node lokal hang saat live | Re-record dari snapshot — siapkan video pre-recorded sebagai fallback. |
| Time-lock countdown tidak update realtime | Manual polling + reload page setelah 60s. |

## Editing Notes

- Cut time saat menunggu tx confirm (>3 detik).
- Tambah lower-third caption setiap voice section.
- Background music subtle, drop di hook + closing.
- Subtitles bilingual (EN + ID) untuk audience hackathon internasional.
