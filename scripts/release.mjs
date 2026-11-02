#!/usr/bin/env node
/**
 * Bumps the app version, commits it and pushes the CURRENT branch.
 *
 * Meant for a release branch: bump here, open a pull request, and CI publishes
 * once the merge lands on master.
 *
 * Usage:
 *   pnpm release:patch        # 0.1.3 -> 0.1.4
 *   pnpm release:minor        # 0.1.3 -> 0.2.0
 *   pnpm release:major        # 0.1.3 -> 1.0.0
 *   pnpm release:set 1.2.3    # exact version
 *
 * Flags:
 *   --no-push   commit only, do not push
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const BUMPS = ["patch", "minor", "major"];

const args = process.argv.slice(2);
const noPush = args.includes("--no-push");
const positional = args.filter((arg) => !arg.startsWith("--"));

const type = positional[0];
const explicitVersion = positional[1];

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!BUMPS.includes(type) && type !== "set") {
  fail(
    "uso: pnpm release:patch | release:minor | release:major | release:set <x.y.z>",
  );
}

const git = (...params) =>
  execFileSync("git", params, { cwd: root, stdio: "inherit" });

const gitOutput = (...params) =>
  execFileSync("git", params, { cwd: root, encoding: "utf8" }).trim();

const branch = gitOutput("rev-parse", "--abbrev-ref", "HEAD");
if (branch === "HEAD") {
  fail("estás en detached HEAD. Crea o cámbiate a una rama primero.");
}

/* ------------------------------------------------------------------ */
/* Work out the next version                                          */
/* ------------------------------------------------------------------ */

function bump(version, kind) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (kind === "major") return `${major + 1}.0.0`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function parseExplicit(value) {
  if (!value) fail("falta la versión. Ejemplo: pnpm release:set 1.2.3");

  const clean = value.replace(/^v/i, "");
  if (!/^\d+\.\d+\.\d+$/.test(clean)) {
    fail(`"${value}" no es una versión válida. Usa el formato x.y.z`);
  }
  return clean;
}

const packagePath = path.join(root, "package.json");
const raw = readFileSync(packagePath, "utf8");
const pkg = JSON.parse(raw);
const current = pkg.version;

const next = type === "set" ? parseExplicit(explicitVersion) : bump(current, type);

if (next === current) {
  fail(`la versión ya es ${current}`);
}

/* ------------------------------------------------------------------ */

// Preserve the original formatting: only the version line changes.
const updated = raw.replace(/("version":\s*")[^"]+(")/, `$1${next}$2`);
if (updated === raw) fail("no se pudo actualizar la versión en package.json");

writeFileSync(packagePath, updated);
console.log(`✔ ${current} → ${next}`);

execFileSync("node", [path.join(import.meta.dirname, "sync-version.mjs")], {
  cwd: root,
  stdio: "inherit",
});

git("add", "package.json", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock");
git("commit", "-m", `chore(release): v${next}`);

if (noPush) {
  console.log(`\n✔ Commit creado en ${branch}. Sin push (--no-push).`);
  process.exit(0);
}

git("push", "--set-upstream", "origin", branch);

console.log(`\n✔ v${next} listo en ${branch}.`);
console.log("  Abre un pull request a master.");
console.log("  El release se publica cuando el merge llegue a master y CI vea la versión nueva.");
