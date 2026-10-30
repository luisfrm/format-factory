#!/usr/bin/env node
/**
 * Bumps the app version, commits it and pushes to master.
 *
 * CI takes it from there: if no release exists for that version, it builds the
 * three installers and publishes them. The tag is created by CI, never here.
 *
 * Usage:
 *   node scripts/release.mjs patch
 *   node scripts/release.mjs minor --no-push
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const BUMPS = ["patch", "minor", "major"];
const type = process.argv[2];
const noPush = process.argv.includes("--no-push");

if (!BUMPS.includes(type)) {
  console.error(`✖ Uso: node scripts/release.mjs <${BUMPS.join("|")}> [--no-push]`);
  process.exit(1);
}

function bump(version, kind) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (kind === "major") return `${major + 1}.0.0`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const packagePath = path.join(root, "package.json");
const raw = readFileSync(packagePath, "utf8");
const pkg = JSON.parse(raw);
const next = bump(pkg.version, type);

// Preserve the original formatting: only the version line changes.
const updated = raw.replace(
  /("version":\s*")[^"]+(")/,
  `$1${next}$2`,
);

if (updated === raw) {
  console.error("✖ No se pudo actualizar la versión en package.json");
  process.exit(1);
}

writeFileSync(packagePath, updated);
console.log(`✔ ${pkg.version} → ${next}`);

execFileSync("node", [path.join(import.meta.dirname, "sync-version.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const git = (...args) =>
  execFileSync("git", args, { cwd: root, stdio: "inherit" });

git("add", "package.json", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock");
git("commit", "-m", `chore(release): v${next}`);

if (noPush) {
  console.log(`\n✔ Commit creado. Sin push (--no-push).`);
  console.log(`  git push origin master`);
  process.exit(0);
}

git("push", "origin", "HEAD:master");

console.log(`\n✔ v${next} publicado en master.`);
console.log("  CI compilará Windows, Linux y macOS y creará el release.");
console.log("  https://github.com/luisfrm/format-factory/releases");
