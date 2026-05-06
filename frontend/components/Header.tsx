"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ConnectWallet } from "./ConnectWallet";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/setup", label: "Setup" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recover", label: "Recover" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/80 backdrop-blur-xl bg-stone-950/70">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-950 font-medium text-[13px] tracking-tight">
            P
          </div>
          <span className="text-[15px] text-stone-100 font-medium tracking-tight">
            PortalGuard
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((it) => {
            const active = pathname?.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "relative px-3 h-8 inline-flex items-center text-[13px] rounded-md transition-colors",
                  active
                    ? "text-stone-100"
                    : "text-stone-500 hover:text-stone-200",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md bg-stone-100/[0.05] border border-stone-800/80"
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  />
                )}
                <span className="relative">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <ConnectWallet />
      </div>
    </header>
  );
}
