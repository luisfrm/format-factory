import { useEffect, useRef } from "react";
import { isTauri } from "@/lib/backend";
import { INITIAL_CHECK_DELAY_MS, shouldCheck } from "@/lib/update-policy";
import { useUpdateStore } from "@/store/update-store";

/**
 * Loads runtime info once and schedules the daily silent check.
 * Never runs in the browser preview or in `tauri dev`.
 */
export function useUpdateWatcher() {
  const init = useUpdateStore((state) => state.init);
  const check = useUpdateStore((state) => state.check);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void init();

    if (!isTauri || import.meta.env.DEV) return;

    const timer = window.setTimeout(() => {
      const { lastCheckedAt } = useUpdateStore.getState();
      if (shouldCheck(lastCheckedAt)) void check();
    }, INITIAL_CHECK_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [init, check]);
}
