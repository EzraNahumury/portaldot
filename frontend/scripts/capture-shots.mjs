// Capture marketing screenshots of PortalGuard pages.
// Usage: node scripts/capture-shots.mjs
// Assumes a Next.js dev server is reachable at BASE_URL.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = resolve(process.cwd(), "..", "docs", "images");

const SHOTS = [
  { path: "/", name: "01-landing.png" },
  { path: "/setup", name: "02-setup.png" },
  { path: "/dashboard", name: "03-dashboard.png" },
  { path: "/recover", name: "04-recover.png" },
  // Wallet modal needs real DOM interaction to look right; skipped here and
  // captured manually if needed.
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  // Pre-seed a vault so /dashboard renders content rather than empty state.
  await ctx.addInitScript(() => {
    const sample = {
      state: {
        vault: {
          ownerAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          guardians: [
            "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
            "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
          ],
          threshold: 2,
          timelockBlocks: 4,
          guardianMultisig: "",
        },
      },
      version: 0,
    };
    window.localStorage.setItem("portalguard-state-v2", JSON.stringify(sample));
  });

  const page = await ctx.newPage();
  for (const shot of SHOTS) {
    const url = `${BASE_URL}${shot.path}`;
    console.log(`▶ visiting ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
    // Trigger any whileInView animations by scrolling through the doc, then
    // returning to the top before snapshotting.
    await page.evaluate(async () => {
      const step = 80;
      const total = document.body.scrollHeight;
      for (let y = 0; y < total; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 12));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 600));
    });
    await page.waitForTimeout(700);
    if (shot.openWalletModal) {
      // For the modal shot, use a dedicated tall page so the sheet fits.
      const modalPage = await ctx.newPage();
      await modalPage.setViewportSize({ width: 1280, height: 1100 });
      await ctx.addInitScript(() => {
        const stub = () => ({
          version: "stub",
          enable: async () => ({ accounts: { get: async () => [] }, signer: {} }),
        });
        Object.defineProperty(window, "injectedWeb3", {
          configurable: true,
          writable: true,
          value: { talisman: stub(), "subwallet-js": stub() },
        });
      });
      await modalPage.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
      await modalPage.waitForTimeout(400);
      await modalPage.click('button:has-text("Connect")');
      await modalPage.waitForSelector('[role="dialog"]', { timeout: 5_000 });
      // Wait for the polling detector (600 ms tick) to register installed.
      await modalPage.waitForTimeout(1_400);
      // Reset any internal scroll inside the modal so title is visible.
      await modalPage.evaluate(() => {
        document
          .querySelectorAll('[role="dialog"] .overflow-y-auto')
          .forEach((el) => (el.scrollTop = 0));
        window.scrollTo(0, 0);
      });
      // Read sheet box and clip the page screenshot to it (with padding) so
      // the framed shot looks like a product hero.
      const box = await modalPage.evaluate(() => {
        const el = document.querySelector('[role="dialog"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      const out = resolve(OUT_DIR, shot.name);
      if (box && box.y >= 0) {
        const pad = 56;
        await modalPage.screenshot({
          path: out,
          clip: {
            x: Math.max(0, box.x - pad),
            y: Math.max(0, box.y - pad),
            width: box.w + pad * 2,
            height: box.h + pad * 2,
          },
        });
      } else {
        await modalPage.screenshot({ path: out, fullPage: false });
      }
      await modalPage.close();
      console.log(`  saved ${out}`);
      continue;
    }
    const out = resolve(OUT_DIR, shot.name);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`  saved ${out}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
