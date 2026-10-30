import { useEffect, useState } from "react";
import { backend, isTauri, type EngineStatus } from "@/lib/backend";

export function useEngineStatus() {
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    backend
      .engines()
      .then((result) => {
        if (alive) setEngines(result);
      })
      .catch(() => {
        if (alive) setEngines([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return {
    engines,
    loading,
    native: isTauri,
    ffmpeg: engines.find((engine) => engine.id === "ffmpeg"),
  };
}
