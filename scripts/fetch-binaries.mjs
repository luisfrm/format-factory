#!/usr/bin/env node
/**
 * Provisions the FFmpeg sidecars Tauri expects to bundle:
 *
 *   src-tauri/binaries/ffmpeg-<target-triple>[.exe]
 *   src-tauri/binaries/ffprobe-<target-triple>[.exe]
 *
 * The binaries come from the `ffmpeg-static` / `ffprobe-static` dev
 * dependencies, so every OS gets the build for its own platform without
 * downloading anything else.
 *
 * Usage:
 *   node scripts/fetch-binaries.mjs          # provision (copies if missing)
 *   node scripts/fetch-binaries.mjs --check  # verify only, exit 1 if missing
 */
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);

const CHECK_ONLY = process.argv.includes("--check");
const BINARIES_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "src-tauri",
  "binaries",
);
const REQUIRED = ["ffmpeg", "ffprobe"];

function hostTriple() {
  try {
    const output = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
    const line = output.split(/\r?\n/).find((entry) => entry.startsWith("host:"));
    return line?.replace("host:", "").trim() ?? null;
  } catch {
    return null;
  }
}

/** Path of the platform binary shipped by the npm dev dependencies. */
function sourceFor(name) {
  try {
    if (name === "ffmpeg") {
      const resolved = require("ffmpeg-static");
      return typeof resolved === "string" && existsSync(resolved) ? resolved : null;
    }

    const resolved = require("ffprobe-static");
    return resolved?.path && existsSync(resolved.path) ? resolved.path : null;
  } catch {
    return null;
  }
}

function sidecarPath(name, triple, extension) {
  return path.join(BINARIES_DIR, `${name}-${triple}${extension}`);
}

function printManualInstructions(triple, extension) {
  console.log("\nInstalación manual:");
  console.log("  Windows (PowerShell):");
  console.log(
    "    Descarga https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
  );
  console.log(
    `    copia y renombra a ffmpeg-${triple}${extension} y ffprobe-${triple}${extension} en src-tauri\\binaries\\`,
  );
  console.log("  macOS:");
  console.log(`    brew install ffmpeg`);
  console.log(
    `    cp "$(which ffmpeg)"  src-tauri/binaries/ffmpeg-${triple} && chmod +x src-tauri/binaries/ffmpeg-${triple}`,
  );
  console.log(
    `    cp "$(which ffprobe)" src-tauri/binaries/ffprobe-${triple} && chmod +x src-tauri/binaries/ffprobe-${triple}`,
  );
  console.log("  Debian/Ubuntu:");
  console.log(`    sudo apt install ffmpeg`);
  console.log(
    `    cp "$(which ffmpeg)"  src-tauri/binaries/ffmpeg-${triple} && chmod +x src-tauri/binaries/ffmpeg-${triple}`,
  );
  console.log(
    `    cp "$(which ffprobe)" src-tauri/binaries/ffprobe-${triple} && chmod +x src-tauri/binaries/ffprobe-${triple}`,
  );
}

const triple = hostTriple();
if (!triple) {
  console.error("✖ No se pudo detectar el target triple. ¿Está Rust instalado?");
  process.exit(1);
}

const extension = triple.includes("windows") ? ".exe" : "";
mkdirSync(BINARIES_DIR, { recursive: true });

const missing = REQUIRED.filter((name) => !existsSync(sidecarPath(name, triple, extension)));

if (missing.length === 0) {
  const sizes = REQUIRED.map((name) => {
    const stats = statSync(sidecarPath(name, triple, extension));
    return `${name} ${(stats.size / 1024 / 1024).toFixed(0)} MB`;
  });
  console.log(`✔ Sidecars listos para ${triple} (${sizes.join(" · ")})`);
  process.exit(0);
}

if (CHECK_ONLY) {
  console.error(`✖ Faltan sidecars para ${triple}: ${missing.join(", ")}`);
  console.error("  Ejecuta: pnpm setup:binaries");
  process.exit(1);
}

const failed = [];

for (const name of missing) {
  const source = sourceFor(name);

  if (!source) {
    failed.push(name);
    continue;
  }

  const destination = sidecarPath(name, triple, extension);
  copyFileSync(source, destination);
  if (!extension) chmodSync(destination, 0o755);

  const megabytes = (statSync(destination).size / 1024 / 1024).toFixed(0);
  console.log(`✔ ${name} → ${path.basename(destination)} (${megabytes} MB)`);
}

if (failed.length > 0) {
  console.error(
    `✖ No se encontraron binarios de ${failed.join(", ")} en node_modules.`,
  );
  console.error("  Ejecuta `pnpm install` (sin --ignore-scripts) y reintenta.");
  printManualInstructions(triple, extension);
  process.exit(1);
}

console.log(`✔ Sidecars listos para ${triple}`);
