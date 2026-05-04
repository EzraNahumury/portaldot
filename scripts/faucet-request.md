# Testnet POT Faucet — How to Request

The Portaldot dev docs do not document a public faucet URL. For hackathon work you have two paths.

## Option A — Local dev mode (no faucet needed)

Run the dev binary with built-in dev accounts (Alice, Bob, Charlie, Dave) pre-funded:

```bash
./portaldot_dev --dev --alice --rpc-cors all --rpc-external --ws-external
```

`//Alice` already holds a large pre-allocated balance. Fine for local dev + recorded demo.

## Option B — Request on Discord

Join the official Portaldot Discord:

> https://discord.gg/portaldot

Channels likely to help:
- `#technical-support` — for environment / setup issues.
- `#team-formation` — sometimes used for testnet asks.
- `#announcements` — watch here for any faucet drops.

Suggested message:

> Hi team — I am a builder in the Mini Hackathon Online S1. I'm building **PortalGuard** (social recovery wallet, ink! contract). I need testnet POT to deploy and run e2e tests. My SS58 address: `5...`. Could you point me at the faucet, or air-drop a small amount? Thanks!

## Option C — Mine locally and bridge later

If you spin up a local node you can also stake/run as validator on `--dev` mode and accumulate POT, then bridge to testnet — overkill for hackathon scope; only mention as fallback.

## Tip

Always use a dedicated demo keypair (not your real key). Generate via:

```bash
python -c "from substrateinterface import Keypair; \
  k = Keypair.create_from_mnemonic(Keypair.generate_mnemonic(), ss58_format=42); \
  print(k.ss58_address); print(k.mnemonic)"
```
