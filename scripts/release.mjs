#!/usr/bin/env node
/**
 * Bumps the app version, commits it and pushes to master.
 *
 * CI takes it from there: if no release exists for that version, it builds the
 * three installers and publishes them. The tag is created by CI, never here.
 *
 * Se ejecuta SIEMPRE desde master, limpio y al día: el push va directo a la
 * rama principal, así que publicar desde una rama de trabajo arrastraría sus
 * commits sin revisión.
 *
 * Usage:
 *   pnpm release patch
 *   pnpm release minor --no-push
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

const git = (...args) =>
  execFileSync("git", args, { cwd: root, stdio: "inherit" });

const gitOutput = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Preflight: nunca publicar desde el sitio equivocado                 */
/* ------------------------------------------------------------------ */

const branch = gitOutput("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "master") {
  fail(
    `estás en "${branch}". Los releases se publican desde master.\n` +
      `  git checkout master && git pull && pnpm release ${type}`,
  );
}

if (gitOutput("status", "--porcelain", "--untracked-files=no")) {
  fail(
    "hay cambios sin commitear. Haz commit o guárdalos antes de publicar:\n" +
      "  git status",
  );
}

try {
  git("fetch", "origin", "master");
} catch {
  fail("no se pudo contactar con origin. Revisa tu conexión.");
}

const behind = Number(gitOutput("rev-list", "--count", "HEAD..origin/master"));
if (behind > 0) {
  fail(`tu master está ${behind} commit(s) por detrás de origin. Ejecuta git pull.`);
}

/* ------------------------------------------------------------------ */

function bump(version, kind) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (kind === "major") return `${major + 1}.0.0`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const packagePath = path.join(root, "package.json");
const raw = readFileSync(packagePath, "utf8");
const pkg = JSON.parse(raw);

const current = pkg.version;
const next = bump(current, type);

// Preserve the original formatting: only the version line changes.
const updated = raw.replace(/("version":\s*")[^"]+(")/, `$1${next}$2`);

if (updated === raw) {
  fail("no se pudo actualizar la versión en package.json");
}

writeFileSync(packagePath, updated);
console.log(`✔ ${current} → ${next}`);

execFileSync("node", [path.join(import.meta.dirname, "sync-version.mjs")], {
  cwd: root,
  stdio: "inherit",
});

git("add", "package.json", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock");
git("commit", "-m", `chore(release): v${next}`);

if (noPush) {
  console.log("\n✔ Commit creado. Sin push (--no-push).");
  console.log("  git push origin master");
  process.exit(0);
}

git("push", "origin", "HEAD:master");

const remote = gitOutput("remote", "get-url", "origin")
  .replace(/\.git$/, "")
  .replace(/^git@github\.com:/, "https://github.com/");

console.log(`\n✔ v${next} publicado en master.`);
console.log("  CI compilará Windows, Linux y macOS y creará el release.");
console.log(`  ${remote}/releases`);
