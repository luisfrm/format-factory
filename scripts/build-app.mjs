#!/usr/bin/env node
/**
 * Wraps `tauri build` so local builds can load the signing key from `.env`.
 *
 * The Tauri CLI does not read `.env` on its own. CI passes the key as a real
 * environment variable, so this script only fills in what is missing.
 *
 * Usage:
 *   node scripts/build-app.mjs               # instaladores firmados
 *   node scripts/build-app.mjs --no-bundle   # solo el ejecutable
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const envPath = path.join(root, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    // Real environment variables win over the local file.
    if (!(key in process.env)) process.env[key] = value;
  }
}

const args = ["build", ...process.argv.slice(2)];

// Spawn the CLI with Node instead of the `pnpm` shim: on Windows a `.cmd`
// cannot be spawned without a shell, and a shell would break argument quoting.
const cliPath = path.join(root, "node_modules", "@tauri-apps", "cli", "tauri.js");

if (!existsSync(cliPath)) {
  console.error("✖ No se encontró el CLI de Tauri. Ejecuta `pnpm install`.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [cliPath, ...args], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(`✖ No se pudo ejecutar tauri: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
