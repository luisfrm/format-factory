#!/usr/bin/env node
/**
 * Parses every YAML file under .github/ so a broken workflow is caught locally
 * instead of by a red run on master.
 *
 * Checks more than syntax: workflows must declare a `jobs` map, and every job
 * must have `runs-on` and at least one step.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const githubDir = path.join(root, ".github");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(githubDir).filter((file) => /\.ya?ml$/.test(file));
const errors = [];

for (const file of files) {
  const label = path.relative(root, file);

  try {
    const document = YAML.parse(readFileSync(file, "utf8"));
    if (document === null || typeof document !== "object") {
      errors.push(`${label}: el documento está vacío`);
      continue;
    }

    const isWorkflow = label.includes(`workflows${path.sep}`);
    if (!isWorkflow) continue;

    if (!document.jobs || typeof document.jobs !== "object") {
      errors.push(`${label}: falta el bloque "jobs"`);
      continue;
    }

    for (const [name, job] of Object.entries(document.jobs)) {
      if (!job || typeof job !== "object") {
        errors.push(`${label}: el job "${name}" está vacío`);
        continue;
      }
      if (!job["runs-on"] && !job.uses) {
        errors.push(`${label}: el job "${name}" no declara "runs-on"`);
      }
      if (!Array.isArray(job.steps) || job.steps.length === 0) {
        errors.push(`${label}: el job "${name}" no tiene steps`);
      }
      for (const [index, step] of (job.steps ?? []).entries()) {
        if (!step?.uses && !step?.run) {
          errors.push(
            `${label}: job "${name}" step ${index + 1} sin "uses" ni "run"`,
          );
        }
      }
    }
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }
}

if (errors.length > 0) {
  console.error(`✖ ${errors.length} problema(s) de YAML:\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`✔ ${files.length} archivos YAML válidos`);
