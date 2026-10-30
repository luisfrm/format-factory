import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY = "ff.lastRoute";

/**
 * Remembers the last screen and restores it on the next launch, so an update
 * (which requires a process restart) feels like a reload rather than a reset.
 */
export function useLastRoute() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const restored = useRef(false);

  useEffect(() => {
    if (!restored.current) {
      restored.current = true;

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== "/" && pathname === "/") {
        navigate(saved, { replace: true });
        return;
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, pathname);
    } catch {
      /* storage full or disabled: not worth failing the app over */
    }
  }, [pathname, navigate]);
}
