import { HashRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes";

/**
 * HashRouter is used on purpose: in a packaged Tauri app the frontend is served
 * from a custom protocol, where history-based routing can 404 on refresh.
 */
export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
