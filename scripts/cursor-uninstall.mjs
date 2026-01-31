#!/usr/bin/env node

/**
 * cursor-uninstall.mjs
 * Removes everything-cursor settings from .cursor directory
 *
 * Features:
 * - Only removes files tracked in manifest (preserves user files)
 * - Removes empty directories after file removal
 * - Removes manifest and backup files
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Color helper functions
const color = {
  red: (text) => `${colors.red}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
};

const REPO_ROOT = process.cwd();
const CURSOR_DIR = path.join(REPO_ROOT, ".cursor");
const MANIFEST_FILE = ".everything-cursor-manifest.json";
const MANIFEST_BACKUP_FILE = ".everything-cursor-manifest.backup.json";

console.log(color.blue("🗑️  Uninstalling everything-cursor settings...\n"));

// Check if .cursor directory exists
if (!fs.existsSync(CURSOR_DIR)) {
  console.log(
    color.yellow("⚠ .cursor directory not found. Nothing to uninstall."),
  );
  process.exit(0);
}

// Load manifest
const manifestPath = path.join(CURSOR_DIR, MANIFEST_FILE);
if (!fs.existsSync(manifestPath)) {
  console.log(color.yellow("⚠ No manifest found."));
  console.log(color.yellow("  Cannot determine which files were installed."));
  console.log(
    color.yellow("  To remove everything, manually delete .cursor/ directory."),
  );
  process.exit(1);
}

let manifest;
try {
  const content = fs.readFileSync(manifestPath, "utf-8");
  manifest = JSON.parse(content);
} catch (error) {
  console.error(color.red("✗ Failed to parse manifest file"));
  console.error(`  ${error.message}`);
  process.exit(1);
}

// Display version information
const version = manifest.submoduleGitTag ||
  manifest.submoduleGitHash?.slice(0, 7) || "unknown";
console.log(color.blue(`Installed version: ${version}`));
console.log(
  color.cyan(`Removing ${Object.keys(manifest.files).length} file(s)...\n`),
);

// Statistics
let removedCount = 0;
let notFoundCount = 0;
let errorCount = 0;

// Remove tracked files
for (const [key] of Object.entries(manifest.files)) {
  const filePath = path.join(CURSOR_DIR, key);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(color.green(`  ✓ Removed ${key}`));
      removedCount++;
    } else {
      console.log(color.yellow(`  ⚠ Not found: ${key}`));
      notFoundCount++;
    }
  } catch (error) {
    console.error(color.red(`  ✗ Failed to remove ${key}: ${error.message}`));
    errorCount++;
  }
}

// Remove empty directories
console.log(color.cyan("\nCleaning up empty directories..."));
const directories = ["agents", "skills", "commands", "rules"];
for (const dir of directories) {
  const dirPath = path.join(CURSOR_DIR, dir);
  if (fs.existsSync(dirPath)) {
    removeEmptyDirectories(dirPath);
  }
}

// Remove manifest files
console.log(color.cyan("\nRemoving manifest files..."));
try {
  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
    console.log(color.green(`  ✓ Removed ${MANIFEST_FILE}`));
  }

  const backupPath = path.join(CURSOR_DIR, MANIFEST_BACKUP_FILE);
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    console.log(color.green(`  ✓ Removed ${MANIFEST_BACKUP_FILE}`));
  }
} catch (error) {
  console.warn(color.yellow(`  ⚠ Failed to remove manifest: ${error.message}`));
}

// Display summary
console.log(color.cyan("\nSummary:"));
console.log("━".repeat(40));
console.log(color.cyan(`  ${removedCount} file(s) removed`));
if (notFoundCount > 0) {
  console.log(color.yellow(`  ${notFoundCount} file(s) not found`));
}
if (errorCount > 0) {
  console.log(color.red(`  ${errorCount} error(s)`));
}
console.log("━".repeat(40));

if (errorCount > 0) {
  console.log(color.yellow("\n⚠ Uninstallation completed with errors"));
  process.exit(1);
} else {
  console.log(color.bold(color.green("\n✅ Uninstallation complete!")));
  console.log(
    color.blue("  User-created files in .cursor/ have been preserved"),
  );
}

/**
 * Recursively remove empty directories
 */
function removeEmptyDirectories(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  // Get all entries in directory
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // Recursively process subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDirPath = path.join(dirPath, entry.name);
      removeEmptyDirectories(subDirPath);
    }
  }

  // Check if directory is now empty
  const remainingEntries = fs.readdirSync(dirPath);
  if (remainingEntries.length === 0) {
    try {
      fs.rmdirSync(dirPath);
      const relativePath = path.relative(CURSOR_DIR, dirPath);
      console.log(color.gray(`  ✓ Removed empty directory: ${relativePath}`));
    } catch (_error) {
      // Ignore errors when removing directories
    }
  }
}
