"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Wallet as WalletIcon,
  KeyRound,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  WALLETS,
  detectInstalledIds,
  type WalletInfo,
  type WalletId,
} from "@/lib/wallets";
import { connectWallet } from "@/lib/wallet";
import { usePortalStore } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RECENT_KEY = "portalguard:recent-wallet";

export function WalletModal({ open, onClose }: Props) {
  const setAccount = usePortalStore((s) => s.setAccount);
  const [installed, setInstalled] = useState<WalletId[]>([]);
  const [recent, setRecent] = useState<WalletId | null>(null);
  const [busy, setBusy] = useState<WalletId | null>(null);

  // Refresh installed list whenever the modal opens (extensions inject async)
  useEffect(() => {
    if (!open) return;
    const run = () => setInstalled(detectInstalledIds());
    run();
    const id = window.setInterval(run, 600);
    setRecent(
      typeof window !== "undefined"
        ? (window.localStorage.getItem(RECENT_KEY) as WalletId | null)
        : null,
    );
    return () => window.clearInterval(id);
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const { installedList, popularList } = useMemo(() => {
    const sortKey = (w: WalletInfo) =>
      recent && w.id === recent ? -1 : installed.indexOf(w.id);
    const installedList = WALLETS.filter((w) => installed.includes(w.id)).sort(
      (a, b) => sortKey(a) - sortKey(b),
    );
    const popularList = WALLETS.filter((w) => !installed.includes(w.id));
    return { installedList, popularList };
  }, [installed, recent]);

  async function handleSelect(w: WalletInfo) {
    if (!installed.includes(w.id)) {
      window.open(w.downloadUrl, "_blank", "noopener");
      return;
    }
    setBusy(w.id);
    try {
      const accounts = await connectWallet(w.id);
      if (accounts.length === 0) {
        toast.error(
          `${w.name} has no accounts. Create one inside the extension first.`,
        );
        return;
      }
      setAccount(accounts[0]);
      window.localStorage.setItem(RECENT_KEY, w.id);
      toast.success(`Connected via ${w.name}`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={onClose}
        >
          {/* backdrop */}
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md" />

          {/* viewport-padded scroll container */}
          <div className="relative min-h-full flex items-start sm:items-center justify-center p-4 sm:p-8">
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby="wallet-modal-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-3xl rounded-xl border border-stone-800 bg-stone-950 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            >
              {/* close */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 size-8 rounded-md border border-stone-800 bg-stone-900/60 hover:bg-stone-900 text-stone-400 hover:text-stone-100 inline-flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>

              {/* LEFT */}
              <div className="border-b md:border-b-0 md:border-r border-stone-900">
                <div className="px-6 pt-5 pb-3">
                  <h2
                    id="wallet-modal-title"
                    className="font-display text-[24px] leading-tight tracking-tight text-stone-100"
                  >
                    Connect a wallet
                  </h2>
                  <p className="mt-1 text-[12.5px] text-stone-500">
                    Substrate wallets work on Portaldot. Pick one below.
                  </p>
                </div>

                <div className="px-3 pb-5">
                  {installedList.length > 0 && (
                    <Section label="Installed">
                      {installedList.map((w) => (
                        <WalletRow
                          key={w.id}
                          wallet={w}
                          isInstalled
                          isRecent={w.id === recent}
                          loading={busy === w.id}
                          onClick={() => handleSelect(w)}
                        />
                      ))}
                    </Section>
                  )}

                  <Section
                    label={installedList.length > 0 ? "Popular" : "Available"}
                  >
                    {popularList.map((w) => (
                      <WalletRow
                        key={w.id}
                        wallet={w}
                        isInstalled={false}
                        isRecent={false}
                        loading={busy === w.id}
                        onClick={() => handleSelect(w)}
                      />
                    ))}
                  </Section>
                </div>
              </div>

              {/* RIGHT */}
              <div className="hidden md:flex flex-col bg-stone-950/60">
                <div className="px-7 pt-7 pb-6">
                  <h3 className="font-display text-[22px] leading-tight tracking-tight text-stone-100">
                    What is a wallet?
                  </h3>
                  <div className="mt-6 space-y-5">
                    <Pitch
                      icon={<KeyRound className="size-4" />}
                      title="Your keys, your assets"
                      body="A wallet holds the private key that signs transactions. PortalGuard never sees it."
                    />
                    <Pitch
                      icon={<ShieldCheck className="size-4" />}
                      title="A login that travels"
                      body="One wallet works across every Substrate dApp. No passwords, no email — just sign."
                    />
                  </div>
                </div>
                <div className="mt-auto px-7 py-5 border-t border-stone-900 flex items-center gap-3">
                  <a
                    href="https://wiki.polkadot.network/docs/learn-account-generation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-stone-100 text-stone-950 text-[13px] font-medium hover:bg-white transition-colors"
                  >
                    <WalletIcon className="size-3.5" />
                    Get a wallet
                  </a>
                  <a
                    href="https://wiki.polkadot.network/docs/learn-account-generation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-stone-400 hover:text-stone-200 underline underline-offset-4 decoration-stone-700"
                  >
                    Learn more
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="px-3 mb-1 text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function WalletRow({
  wallet,
  isInstalled,
  isRecent,
  loading,
  onClick,
}: {
  wallet: WalletInfo;
  isInstalled: boolean;
  isRecent: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group w-full px-3 py-2.5 rounded-md flex items-center gap-3 hover:bg-stone-900/60 transition-colors text-left disabled:opacity-60"
    >
      <span
        className="size-9 rounded-md flex items-center justify-center shrink-0 text-[13px] font-semibold ring-1 ring-stone-800"
        style={{ background: wallet.brand.bg, color: wallet.brand.fg }}
      >
        {wallet.brand.letter}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-stone-100 font-medium truncate">
            {wallet.name}
          </span>
          {isRecent && (
            <span className="text-[10.5px] tracking-[0.06em] uppercase font-medium text-emerald-300/90">
              Recent
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-stone-500 truncate">
          {wallet.tagline}
        </p>
      </div>
      {loading ? (
        <span
          aria-hidden
          className="size-3.5 rounded-full border-[1.5px] border-stone-600 border-t-stone-100 animate-spin"
        />
      ) : isInstalled ? (
        <ChevronRight className="size-4 text-stone-600 group-hover:text-stone-300 transition-colors" />
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 group-hover:text-stone-100 transition-colors">
          Get
          <ExternalLink className="size-3" />
        </span>
      )}
    </button>
  );
}

function Pitch({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-9 rounded-md bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] text-stone-100 font-medium">{title}</p>
        <p className="mt-1 text-[12.5px] text-stone-500 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
