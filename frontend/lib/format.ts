export const POT_DECIMALS = 14;

export function formatPOT(raw: bigint | string | number, decimals = POT_DECIMALS): string {
  const v = typeof raw === "bigint" ? raw : BigInt(raw);
  const negative = v < 0n;
  const abs = negative ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  const out = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return negative ? `-${out}` : out;
}

export function shortAddr(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function blockNumberToDate(now: number, requestedAtMs: number): Date {
  return new Date(now + (requestedAtMs - Date.now()));
}
