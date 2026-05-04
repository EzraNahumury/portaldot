import Link from "next/link";
import { Shield, Users, Clock, ArrowRight, KeyRound } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-32">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-4 py-1.5 text-xs font-medium text-violet-300 mb-8">
              <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
              Built native on Portaldot
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-zinc-50 leading-[1.05] max-w-4xl">
              Lose your keys.
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Keep your assets.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-zinc-400 leading-relaxed">
              PortalGuard is a social recovery wallet for Portaldot. Designate
              trusted friends as guardians — if you ever lose access, they can
              collectively restore your account. No custodian. No backdoor. On-chain.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-medium transition-all shadow-[0_8px_30px_rgb(124,58,237,0.35)]"
              >
                Create your vault
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl border border-zinc-800 hover:bg-zinc-900 text-zinc-200 font-medium transition-colors"
              >
                Open dashboard
              </Link>
            </div>
            <p className="mt-6 text-xs text-zinc-600">
              Hackathon prototype · MIT licensed · Don&apos;t use in production
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid md:grid-cols-3 gap-6">
            <Feature
              icon={<Users className="size-5" />}
              title="M-of-N guardians"
              body="Choose 2-of-3 family, 3-of-5 colleagues, or any threshold that fits your trust model."
            />
            <Feature
              icon={<Clock className="size-5" />}
              title="Time-lock safety"
              body="Every recovery has a 24-hour delay. Owner can cancel a hostile takeover before execution."
            />
            <Feature
              icon={<KeyRound className="size-5" />}
              title="Self-custody preserved"
              body="Guardians can only restore your account. They cannot move your funds — that's still your key."
            />
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="border-t border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100 max-w-2xl">
            How a recovery actually works
          </h2>
          <div className="mt-16 grid md:grid-cols-4 gap-6">
            <Step
              n={1}
              title="Lose access"
              body="Phone gone, seed phrase lost. You generate a fresh keypair on a new device."
            />
            <Step
              n={2}
              title="Request recovery"
              body="From the new key, submit a recovery request to your existing vault address."
            />
            <Step
              n={3}
              title="Guardians approve"
              body="Trusted friends check the request, recognize you, sign Approve from their wallets."
            />
            <Step
              n={4}
              title="Execute after delay"
              body="Once threshold and time-lock pass, vault ownership transfers to the new key."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-violet-400" />
            <span>PortalGuard · Mini Hackathon S1</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/EzraNahumury/portaldot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://portaldot-dev.readthedocs.io/en/latest/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              Portaldot Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-6 hover:border-zinc-800 transition-colors">
      <div className="size-10 rounded-xl bg-violet-500/10 text-violet-300 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="relative">
      <div className="text-7xl font-semibold text-zinc-900 leading-none">
        {String(n).padStart(2, "0")}
      </div>
      <h3 className="mt-2 text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
