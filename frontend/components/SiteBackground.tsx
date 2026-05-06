"use client";

import dynamic from "next/dynamic";

// Lazy-load — three + postprocessing are heavy and only render client-side.
const PixelBlast = dynamic(() => import("./ui/PixelBlast"), { ssr: false });

/**
 * Global animated background for the whole site. Fixed behind everything,
 * pointer-events-none so the page UI stays interactive.
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ contain: "strict" }}
    >
      <PixelBlast
        variant="circle"
        pixelSize={5}
        color="#34d399"
        patternScale={3.2}
        patternDensity={0.85}
        pixelSizeJitter={0.4}
        enableRipples={false}
        speed={0.35}
        edgeFade={0.55}
        transparent
      />
    </div>
  );
}
