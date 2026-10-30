#!/usr/bin/env node
/**
 * Ensures the FFmpeg sidecars required by `tauri build` are present.
 *
 * Tauri expects sidecar binaries named `<name>-<target-triple><ext>`, e.g.
 *   src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe
 *
 * This script never downloads automatically (licensing + trust); it verifies
 * what is missing and prints the exact command to fix it.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const BINARIES_DIR = path.resolve(import.meta.dirname, "..", "src-tauri", "binaries");
const REQUIRED = ["ffmpeg", "ffprobe"];

function hostTriple() {
  try {
    const output = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
    const line = output.split(/\r?\n/).find((l) => l.startsWith("host:"));
    return line?.replace("host:", "").trim() ?? null;
  } catch {
    return null;
  }
}

const triple = hostTriple();
if (!triple) {
  console.error("✖ No se pudo detectar el target triple. ¿Está Rust instalado?");
  process.exit(1);
}

const ext = triple.includes("windows") ? ".exe" : "";
mkdirSync(BINARIES_DIR, { recursive: true });

const present = new Set(readdirSync(BINARIES_DIR));
const missing = REQUIRED.filter(
  (name) => !present.has(`${name}-${triple}${ext}`),
);

if (missing.length === 0) {
  console.log(`✔ Sidecars listos para ${triple}`);
  process.exit(0);
}

console.log(`⚠ Faltan sidecars para ${triple}: ${missing.join(", ")}\n`);
console.log("Windows (PowerShell):");
console.log("  1. Descarga https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip");
console.log("  2. Descomprime y copia ffmpeg.exe y ffprobe.exe a src-tauri\\binaries\\");
console.log(`  3. Renómbralos a ffmpeg-${triple}.exe y ffprobe-${triple}.exe\n`);
console.log("macOS / Linux:");
console.log(`  brew install ffmpeg   # o apt install ffmpeg`);
console.log(`  cp $(which ffmpeg)  src-tauri/binaries/ffmpeg-${triple}`);
console.log(`  cp $(which ffprobe) src-tauri/binaries/ffprobe-${triple}\n`);
console.log(
  "Mientras tanto la app funciona, pero las conversiones no estarán disponibles.",
);

// Failing here keeps `pnpm build` from shipping a binary that cannot convert.
process.exit(1);
