import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AppRoutes } from "@/app/routes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { attachQueueListener } from "@/store/queue-store";

/**
 * HashRouter is used on purpose: in a packaged Tauri app the frontend is served
 * from a custom protocol, where history-based routing can 404 on refresh.
 */
export function App() {
  useEffect(() => attachQueueListener(), []);

  return (
    <TooltipProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
      <Toaster
        theme="dark"
        position="top-right"
        offset={56}
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "!bg-surface-2 !border !border-border-strong !text-text !rounded-card !font-sans",
            description: "!text-muted",
          },
        }}
      />
    </TooltipProvider>
  );
}
