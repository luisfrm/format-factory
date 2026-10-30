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

/**
 * Self-update packages. Tauri 2 signs the installer itself instead of emitting
 * a separate archive, so the updater downloads the same file the user would.
 *
 * macOS is intentionally absent: without code signing Gatekeeper can refuse the
 * replaced bundle, so those users download manually.
 */
const UPDATER_TARGETS = [
  {
    platform: "windows-x86_64",
    match: /-setup\.exe$/i,
    suffix: "-setup.exe",
  },
  {
    platform: "linux-x86_64",
    // Tauri emits either the AppImage or an AppImage.tar.gz depending on version.
    match: /\.appimage(\.tar\.gz)?$/i,
    suffix: null,
  },
];

/** Extension to keep for a platform, deriving it from the source file. */
function updaterSuffix(source, target) {
  if (target.suffix) return target.suffix;

  const index = source.toLowerCase().indexOf(".appimage");
  return index === -1 ? "" : source.slice(index);
}

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
      "✖ Uso: --from <bundle> --out <dir> --prefix <nombre> [--updater] | --checksums <dir> | --latest-json <dir>",
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

  // Self-update packages plus their minisign signature.
  if (process.argv.includes("--updater")) {
    for (const target of UPDATER_TARGETS) {
      const source = files.find((file) => target.match.test(file));
      if (!source) continue;

      const suffix = updaterSuffix(source, target);
      const destination = path.join(out, `${prefix}${suffix}`);

      // Windows reuses the installer we already copied.
      if (!statSync(destination, { throwIfNoEntry: false })) {
        copyFileSync(source, destination);
        written.push(`${path.basename(destination)} (updater)`);
      }

      const signature = `${source}.sig`;
      if (statSync(signature, { throwIfNoEntry: false })) {
        copyFileSync(signature, `${destination}.sig`);
      } else {
        console.error(`✖ Falta la firma de ${path.basename(source)}`);
        process.exit(1);
      }
    }
  }

  if (written.length === 0) {
    console.error(`✖ No se reconoció ningún instalador en ${from}`);
    process.exit(1);
  }

  console.log(`✔ ${written.length} archivos listos en ${out}`);
  for (const entry of written) console.log(`  ${entry}`);
}

/**
 * Builds the `latest.json` the updater plugin polls. Every platform entry needs
 * the minisign signature of its package, which Tauri writes next to it.
 */
function latestJson(directory, version, baseUrl) {
  if (!directory || !version || !baseUrl) {
    console.error(
      "✖ Uso: --latest-json <dir> --version <x.y.z> --base-url <url del release>",
    );
    process.exit(1);
  }

  const files = readdirSync(directory);
  const platforms = {};

  for (const target of UPDATER_TARGETS) {
    const artifact = files.find((file) => target.match.test(file));
    if (!artifact) continue;

    const signatureFile = `${artifact}.sig`;
    if (!files.includes(signatureFile)) {
      console.error(`✖ ${artifact} no tiene firma (${signatureFile})`);
      process.exit(1);
    }

    platforms[target.platform] = {
      signature: readFileSync(path.join(directory, signatureFile), "utf8").trim(),
      url: `${baseUrl.replace(/\/$/, "")}/${artifact}`,
    };
  }

  if (Object.keys(platforms).length === 0) {
    console.error("✖ No hay paquetes de actualización para publicar");
    process.exit(1);
  }

  const manifest = {
    version,
    notes: "",
    pub_date: new Date().toISOString(),
    platforms,
  };

  writeFileSync(
    path.join(directory, "latest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`✔ latest.json (${Object.keys(platforms).join(", ")})`);
}

const latestJsonDir = arg("--latest-json");

if (latestJsonDir) {
  latestJson(latestJsonDir, arg("--version"), arg("--base-url"));
  process.exit(0);
}

const checksumTarget = arg("--checksums");

if (checksumTarget) {
  checksums(checksumTarget);
} else {
  collect(arg("--from"), arg("--out"), arg("--prefix"));
}
