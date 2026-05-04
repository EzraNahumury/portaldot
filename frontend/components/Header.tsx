"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { ConnectWallet } from "./ConnectWallet";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_8px_30px_rgb(124,58,237,0.4)]">
            <Shield className="size-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold text-zinc-100 leading-none">PortalGuard</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">
              Portaldot · Social Recovery
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/setup">Setup</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/recover">Recover</NavLink>
        </nav>
        <ConnectWallet />
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-900/60"
    >
      {children}
    </Link>
  );
}
