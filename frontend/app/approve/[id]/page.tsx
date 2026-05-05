"use client";

/**
 * Deprecated route — recovery is now coordinated entirely from /recover and
 * monitored from /dashboard. This page redirects there.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApprovePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/recover");
  }, [router]);
  return null;
}
