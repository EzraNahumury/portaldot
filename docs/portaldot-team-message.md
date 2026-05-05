# Pesan ke tim Portaldot — Hackathon Builder Block Report

## Discord channel: `#technical-support` di https://discord.gg/G33tVtCsNW

> Hi team! Saya builder Portaldot Mini Hackathon Online S1 (registered builder, project: PortalGuard — social recovery wallet).
>
> Saya hit blocker saat coba deploy ink! contract ke local dev node (`portaldot_dev --dev --alice`). Tx `Contracts.instantiate_with_code` dimasukkan ke block, tapi `ContractInfoOf` tetap kosong dan `AccountCounter` tetap 0 — silent reject. Tidak ada `Instantiated` event.
>
> **Detail teknis:**
> - Node: `portaldot_dev 2.0.0-unknown-x86_64-linux-gnu` (testnet binary dari github.com/portaldotVolunteer/Portaldot-node)
> - pallet-contracts: storage version 0 (Substrate v3.0 era / pallet-contracts 3.0.0)
> - Extrinsic signature `instantiate_with_code(endowment: Compact<BalanceOf>, gas_limit: Compact<u64>, code: Bytes, data: Bytes, salt: Bytes)` — old single-u64 weight, no `storage_deposit_limit`
> - Saya signed dengan `//Alice` keypair (sudo-eligible di --dev)
>
> **Yang saya coba:**
> 1. ink! 5.x + cargo-contract 5.x → tx in block, silent reject
> 2. ink! 3.0-rc3 + cargo-contract 0.10 + nightly-2021 → modern crates.io transitive deps require rustc 1.71+, build fail
>
> **Pertanyaan:**
> 1. Apa **EXACT** ink! version + cargo-contract version + Rust toolchain yang tim Portaldot pakai untuk compile contract yang berhasil deploy?
> 2. Apakah ada `flipper.wasm` + `flipper.json` (atau contract sample apapun) yang sudah pre-built dan bisa langsung deploy untuk verifikasi runtime accept Wasm?
> 3. Apakah deployment ke pallet-contracts butuh sudo / di-permissioned di Portaldot? Kalau ya, perlu di-document di hackathon docs.
> 4. Apakah ada plan untuk update pallet-contracts ke versi modern (storage_deposit + Weight v2) sebelum hackathon submission deadline (31 May 2026)?
> 5. Apakah ada testnet faucet yang aktif?
>
> **Konteks hackathon:** Saya butuh ini sebelum 31 May. Project saya implement social recovery wallet pattern di Portaldot — kontrak open source di https://github.com/EzraNahumury/portaldot
>
> Thanks 🙏

## Alternative: GitHub Issue
https://github.com/portaldotVolunteer/Portaldot/issues/new

Title: `[Hackathon S1] ink! contract deploy silent-rejects on testnet binary — need supported toolchain version`

Body: same content as Discord message above.

---

## Catatan
- Kontak Discord untuk respons cepat (real-time).
- GitHub Issue untuk paper trail publik (organizer mungkin lebih responsif via tracker resmi).
- Send ke kedua channel — pilih mana yang dapat balasan duluan.
