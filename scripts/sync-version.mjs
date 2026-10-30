#!/usr/bin/env node
/**
 * Keeps Cargo.toml in sync with the version in package.json.
 *
 * `tauri.conf.json` points its `version` field at `package.json`, so that file
 * is the single source of truth for the app and the installers. Cargo needs its
 * own copy, and it must not drift.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;

if (typeof version !== "string" || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`✖ package.json tiene una versión inválida: ${version}`);
  process.exit(1);
}

const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
const cargo = readFileSync(cargoPath, "utf8");
const pattern = /^version = "[^"]+"/m;

if (!pattern.test(cargo)) {
  console.error("✖ No se encontró la línea `version = ` en src-tauri/Cargo.toml");
  process.exit(1);
}

const updated = cargo.replace(pattern, `version = "${version}"`);

if (updated === cargo) {
  console.log(`✔ Versión sincronizada: ${version}`);
  process.exit(0);
}

writeFileSync(cargoPath, updated);
console.log(`✔ src-tauri/Cargo.toml → ${version}`);
