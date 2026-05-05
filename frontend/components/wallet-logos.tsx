"use client";

import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

/* ------------------------------------------------------------------ */
/*                       Curated wallet brand SVGs                     */
/* ------------------------------------------------------------------ */

export function TalismanIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} rx={7} fill="#FD4848" />
      <path
        d="M16 7c.7 0 1.3.5 1.4 1.2l.7 4 3.4-2.2c.6-.4 1.4-.3 1.9.3.4.6.3 1.4-.3 1.9l-3.5 2.6 4 1.2c.7.2 1.1 1 .9 1.7s-1 1.1-1.7.9l-4-1.2 2 3.5c.4.6.1 1.4-.5 1.8s-1.4.1-1.8-.5l-2-3.5-1 4c-.2.7-.9 1.1-1.6 1s-1.1-.9-1-1.6l1-4-3.5 2c-.6.4-1.4.1-1.7-.5s-.1-1.4.5-1.7l3.5-2-4-1.3c-.7-.2-1.1-1-.9-1.7s1-1.1 1.7-.9l4 1.3-2-3.5c-.4-.6-.1-1.4.5-1.8s1.4-.1 1.8.5l2 3.5L14.6 8.2c.1-.7.7-1.2 1.4-1.2z"
        fill="#FFE3B0"
      />
      <circle cx={16} cy={16} r={2.4} fill="#1A0707" />
    </svg>
  );
}

export function SubWalletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} rx={7} fill="#004BFF" />
      <path
        d="M16 6.4 8.4 11v10l7.6 4.6L23.6 21V11L16 6.4Zm5 4.6v3.6l-2.6-1.5V12.5L21 11Zm-7 7.4v3.4L11.4 20v-3.5L14 18.4Zm-2.6-7.4 2.6 1.5v1.6L11.4 13v-2Zm7.2 9-2.6-1.5v-3.5l2.6 1.5v3.5Zm-1.4-5L14.6 18.5v-1.6L18.6 14.4 21 16l-2.8 1.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function PolkadotJsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} rx={7} fill="#F7F7F7" />
      <ellipse cx={16} cy={9} rx={3.6} ry={2} fill="#E6007A" />
      <ellipse cx={16} cy={23} rx={3.6} ry={2} fill="#E6007A" />
      <ellipse
        cx={16}
        cy={13}
        rx={3.6}
        ry={2}
        transform="rotate(60 16 13)"
        fill="#E6007A"
      />
      <ellipse
        cx={16}
        cy={19}
        rx={3.6}
        ry={2}
        transform="rotate(120 16 19)"
        fill="#E6007A"
      />
      <ellipse
        cx={16}
        cy={13}
        rx={3.6}
        ry={2}
        transform="rotate(-60 16 13)"
        fill="#E6007A"
      />
      <ellipse
        cx={16}
        cy={19}
        rx={3.6}
        ry={2}
        transform="rotate(-120 16 19)"
        fill="#E6007A"
      />
    </svg>
  );
}

export function EnkryptIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} rx={7} fill="#7B68EE" />
      <path
        d="M9.6 9 16 6 22.4 9v6.4c0 4.6-3 8.5-6.4 9.6-3.4-1.1-6.4-5-6.4-9.6V9Z"
        fill="#fff"
        opacity={0.92}
      />
      <path
        d="M14 14h4v1.6h-2.6v1.4H17v1.6h-1.6v1.6H18v1.6h-4Z"
        fill="#7B68EE"
      />
    </svg>
  );
}

export function PolkaGateIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} rx={7} fill="#0E2B25" />
      <path
        d="M9 23V11l3.5-2.5h7L23 11v3.5h-3.5V12h-7v8H17v-3.5h2.5V20l-3.5 3H9Z"
        fill="#5ACC94"
      />
      <circle cx={16} cy={17} r={1.6} fill="#5ACC94" />
    </svg>
  );
}

export function NovaWalletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} rx={7} fill="#0F0F1A" />
      <path
        d="M16 6 9 12.5v7L16 26l7-6.5v-7L16 6Z"
        fill="#0F0F1A"
        stroke="#9E7BFF"
        strokeWidth={1.2}
      />
      <path
        d="m16 9 5 4.5v5L16 23l-5-4.5v-5L16 9Z"
        fill="#9E7BFF"
        opacity={0.85}
      />
      <circle cx={16} cy={16} r={1.5} fill="#FFE3FA" />
    </svg>
  );
}

export const WALLET_ICONS: Record<string, React.FC<IconProps>> = {
  talisman: TalismanIcon,
  "subwallet-js": SubWalletIcon,
  "polkadot-js": PolkadotJsIcon,
  enkrypt: EnkryptIcon,
  polkagate: PolkaGateIcon,
  nova: NovaWalletIcon,
};
