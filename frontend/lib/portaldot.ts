"use client";

import { ApiPromise, WsProvider } from "@polkadot/api";

export const PORTALDOT_SS58 = 42;

export function getEndpoint(): string {
  if (typeof window !== "undefined") {
    const fromEnv = process.env.NEXT_PUBLIC_PORTALDOT_WS;
    if (fromEnv && fromEnv.length > 0) return fromEnv;
  }
  return "ws://127.0.0.1:9944";
}

let apiPromise: Promise<ApiPromise> | null = null;

export function getApi(endpoint?: string): Promise<ApiPromise> {
  if (apiPromise) return apiPromise;
  const url = endpoint ?? getEndpoint();
  const provider = new WsProvider(url);
  apiPromise = ApiPromise.create({ provider, throwOnConnect: true });
  return apiPromise;
}

export async function disconnectApi(): Promise<void> {
  if (!apiPromise) return;
  const api = await apiPromise;
  await api.disconnect();
  apiPromise = null;
}
