#!/usr/bin/env node
/**
 * generate-file-list.mjs
 * Generates file-list.json with all .md files published to JSR
 * Run this script before publishing to JSR
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIRS = ["agents", "skills", "commands", "rules"];
const SUBMODULE_PATH = path.join(REPO_ROOT, "everything-claude-code");

function getMdFiles(dir, baseDir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...getMdFiles(fullPath, baseDir));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
      files.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return files;
}

const result = {};
for (const dir of DIRS) {
  const sourceDir = path.join(SUBMODULE_PATH, dir);
  const files = getMdFiles(sourceDir, SUBMODULE_PATH);
  for (const f of files) {
    result[f] = true;
  }
}

const fileList = Object.keys(result).sort();
const output = path.join(REPO_ROOT, "file-list.json");
fs.writeFileSync(output, JSON.stringify(fileList, null, 2) + "\n");
console.log(`Generated file-list.json with ${fileList.length} files`);
