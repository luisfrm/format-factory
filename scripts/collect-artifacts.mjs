#!/usr/bin/env node
/**
 * Normalizes the bundles Tauri produces (different names per OS) into a single
 * predictable set, and can generate a checksum file.
 *
 * Copy mode:
 *   node scripts/collect-artifacts.mjs --from <bundle-dir> --out <dir> \
 *     --prefix "Format-Factory_0.2.0_windows-x64"
 *
 * Checksums mode:
 *   node scripts/collect-artifacts.mjs --checksums <dir>
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** Tauri output extension → final suffix. */
const SUFFIXES = [
  { match: /\.msi$/i, suffix: ".msi" },
  { match: /\.exe$/i, suffix: "-setup.exe" },
  { match: /\.dmg$/i, suffix: ".dmg" },
  { match: /\.appimage$/i, suffix: ".AppImage" },
  { match: /\.deb$/i, suffix: ".deb" },
];

function checksums(directory) {
  const files = walk(directory)
    .filter((file) => path.basename(file) !== "SHA256SUMS.txt")
    .sort();

  if (files.length === 0) {
    console.error(`✖ No hay archivos para sumar en ${directory}`);
    process.exit(1);
  }

  const lines = files.map((file) => {
    const hash = createHash("sha256")
      .update(readFileSync(file))
      .digest("hex");
    return `${hash}  ${path.basename(file)}`;
  });

  const target = path.join(directory, "SHA256SUMS.txt");
  writeFileSync(target, `${lines.join("\n")}\n`);

  console.log(`✔ SHA256SUMS.txt (${files.length} archivos)`);
  for (const line of lines) console.log(`  ${line}`);
}

function collect(from, out, prefix) {
  if (!from || !out || !prefix) {
    console.error(
      "✖ Uso: --from <bundle> --out <dir> --prefix <nombre> | --checksums <dir>",
    );
    process.exit(1);
  }

  if (!statSync(from, { throwIfNoEntry: false })) {
    console.error(`✖ No existe el directorio de bundles: ${from}`);
    process.exit(1);
  }

  mkdirSync(out, { recursive: true });

  const files = walk(from);
  const written = [];

  for (const { match, suffix } of SUFFIXES) {
    const candidates = files.filter((file) => match.test(file));
    if (candidates.length === 0) continue;

    // Prefer the largest file when a tool emits duplicates (e.g. temp copies).
    const source = candidates.sort(
      (a, b) => statSync(b).size - statSync(a).size,
    )[0];

    const destination = path.join(out, `${prefix}${suffix}`);
    copyFileSync(source, destination);
    written.push(`${path.basename(destination)} (${(statSync(destination).size / 1024 / 1024).toFixed(1)} MB)`);
  }

  if (written.length === 0) {
    console.error(`✖ No se reconoció ningún instalador en ${from}`);
    process.exit(1);
  }

  console.log(`✔ ${written.length} archivos listos en ${out}`);
  for (const entry of written) console.log(`  ${entry}`);
}

const checksumTarget = arg("--checksums");

if (checksumTarget) {
  checksums(checksumTarget);
} else {
  collect(arg("--from"), arg("--out"), arg("--prefix"));
}
