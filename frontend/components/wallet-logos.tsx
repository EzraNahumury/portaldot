"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Official wallet logos vendored under /public/wallets. We render them as
 * <Image> tiles with a soft ring so they pair well with the modal's dark
 * surface, regardless of whether the source asset has a transparent or
 * solid background.
 */

interface LogoProps {
  className?: string;
  size?: number;
}

function Tile({
  src,
  alt,
  bg,
  className,
  size = 36,
  rounded = "rounded-md",
}: LogoProps & {
  src: string;
  alt: string;
  bg: string;
  rounded?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center justify-center ring-1 ring-stone-800",
        rounded,
        className,
      )}
      style={{ width: size, height: size, background: bg }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cn("object-contain", rounded)}
      />
    </span>
  );
}

export function TalismanLogo(p: LogoProps) {
  return <Tile src="/wallets/talisman.svg" alt="Talisman" bg="#FD4848" {...p} />;
}

export function SubWalletLogo(p: LogoProps) {
  return <Tile src="/wallets/subwallet.png" alt="SubWallet" bg="#0D0D0D" {...p} />;
}

export function PolkadotJsLogo(p: LogoProps) {
  return (
    <Tile src="/wallets/polkadot-js.svg" alt="Polkadot{.js}" bg="#FFFFFF" {...p} />
  );
}

export function EnkryptLogo(p: LogoProps) {
  return <Tile src="/wallets/enkrypt.png" alt="Enkrypt" bg="#1B1B47" {...p} />;
}

export function PolkaGateLogo(p: LogoProps) {
  return (
    <Tile src="/wallets/polkagate.svg" alt="PolkaGate" bg="#0E2B25" {...p} />
  );
}

export function NovaWalletLogo(p: LogoProps) {
  return <Tile src="/wallets/nova.png" alt="Nova Wallet" bg="#0F0F1A" {...p} />;
}

export const WALLET_ICONS: Record<string, React.FC<LogoProps>> = {
  talisman: TalismanLogo,
  "subwallet-js": SubWalletLogo,
  "polkadot-js": PolkadotJsLogo,
  enkrypt: EnkryptLogo,
  polkagate: PolkaGateLogo,
  nova: NovaWalletLogo,
};
