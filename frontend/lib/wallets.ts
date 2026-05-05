"use client";

/**
 * Curated Substrate wallet registry. Brand glyphs are rendered as letter
 * badges (no external image deps), but tinted with each wallet's accent so
 * the picker still feels like a real wallet directory.
 */

export type WalletId =
  | "polkadot-js"
  | "talisman"
  | "subwallet-js"
  | "enkrypt"
  | "polkagate"
  | "nova";

export type WalletCategory = "installed" | "popular" | "mobile";

export interface WalletInfo {
  id: WalletId;
  name: string;
  tagline: string;
  brand: { bg: string; fg: string; letter: string };
  downloadUrl: string;
  category: "extension" | "mobile";
}

export const WALLETS: WalletInfo[] = [
  {
    id: "talisman",
    name: "Talisman",
    tagline: "Polkadot · multi-chain",
    brand: { bg: "#fde68a", fg: "#1c1917", letter: "T" },
    downloadUrl: "https://talisman.xyz/download",
    category: "extension",
  },
  {
    id: "subwallet-js",
    name: "SubWallet",
    tagline: "Polkadot · ecosystem",
    brand: { bg: "#005CFF", fg: "#ffffff", letter: "S" },
    downloadUrl: "https://www.subwallet.app/download.html",
    category: "extension",
  },
  {
    id: "polkadot-js",
    name: "Polkadot{.js}",
    tagline: "Reference extension",
    brand: { bg: "#1c1917", fg: "#e6007a", letter: "P" },
    downloadUrl: "https://polkadot.js.org/extension/",
    category: "extension",
  },
  {
    id: "enkrypt",
    name: "Enkrypt",
    tagline: "Multichain crypto wallet",
    brand: { bg: "#a855f7", fg: "#ffffff", letter: "E" },
    downloadUrl: "https://www.enkrypt.com/",
    category: "extension",
  },
  {
    id: "polkagate",
    name: "PolkaGate",
    tagline: "Gateway to Polkadot",
    brand: { bg: "#0d3b2e", fg: "#5acc94", letter: "PG" },
    downloadUrl: "https://polkagate.xyz/",
    category: "extension",
  },
  {
    id: "nova",
    name: "Nova Wallet",
    tagline: "Mobile · iOS / Android",
    brand: { bg: "#1f1f29", fg: "#d4afff", letter: "N" },
    downloadUrl: "https://novawallet.io/",
    category: "mobile",
  },
];

export function findWallet(id: string): WalletInfo | undefined {
  return WALLETS.find((w) => w.id === id);
}

/**
 * Synchronously check window.injectedWeb3 for installed Substrate
 * extensions. This is non-blocking and does NOT prompt the user — useful
 * to render the "Installed" / "Popular" split in the picker modal before
 * the user actually clicks anything.
 */
export function detectInstalledIds(): WalletId[] {
  if (typeof window === "undefined") return [];
  const inj = (window as { injectedWeb3?: Record<string, unknown> })
    .injectedWeb3;
  if (!inj) return [];
  const known = new Set<string>(WALLETS.map((w) => w.id));
  return Object.keys(inj).filter((k) => known.has(k)) as WalletId[];
}
