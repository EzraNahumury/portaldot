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
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <PixelBlast
        variant="circle"
        pixelSize={5}
        color="#34d399"
        patternScale={3}
        patternDensity={1.1}
        pixelSizeJitter={0.5}
        enableRipples={false}
        speed={0.45}
        edgeFade={0.35}
        transparent
      />
    </div>
  );
}
