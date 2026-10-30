import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Vitest globals are disabled, so Testing Library cannot auto-register cleanup.
afterEach(() => {
  cleanup();
});
