import { invoke } from "@tauri-apps/api/core";

/** True when running inside the Tauri webview (not the browser dev server). */
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export type EngineStatus = {
  id: string;
  label: string;
  available: boolean;
  version: string | null;
};

/**
 * Typed bridge to the Rust backend. Every command goes through here so the
 * rest of the app never imports `@tauri-apps/api` directly.
 */
export const backend = {
  engineStatus(): Promise<EngineStatus[]> {
    if (!isTauri) return Promise.resolve([]);
    return invoke<EngineStatus[]>("engine_status");
  },
};
