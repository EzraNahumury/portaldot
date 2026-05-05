"use client";

/**
 * Curated Substrate wallet registry. Brand glyphs are rendered as letter
 * badges (no external image deps), but tinted with each wallet's accent so
 * the picker still feels like a real wallet directory.
 */

export type WalletId = string;

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
 * Build a generic registry entry for an injected extension we don't have
 * branded metadata for. Lets unknown but valid Substrate wallets still
 * appear in the "Installed" section.
 */
export function genericWallet(id: string): WalletInfo {
  const initials = id
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const name = id
    .split(/[-_]/)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
  return {
    id: id as WalletId,
    name: name || id,
    tagline: "Substrate wallet",
    brand: { bg: "#1c1917", fg: "#e7e5e4", letter: initials || "?" },
    downloadUrl: "https://wiki.polkadot.network/docs/learn-wallets",
    category: "extension",
  };
}

/**
 * Snapshot all keys from window.injectedWeb3 — extensions populate this
 * lazily, so this should be polled while the picker is open. Each ID may
 * or may not match a curated WALLETS entry; the modal then decorates with
 * either branded or generic metadata.
 */
export function detectInstalledIds(): string[] {
  if (typeof window === "undefined") return [];
  const inj = (window as { injectedWeb3?: Record<string, unknown> })
    .injectedWeb3;
  if (!inj) return [];
  return Object.keys(inj);
}
