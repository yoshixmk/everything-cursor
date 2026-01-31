#!/usr/bin/env node

/**
 * cursor-install.mjs
 * Installs everything-claude-code settings to .cursor directory with user file preservation
 *
 * Features:
 * - Only processes .md files from submodule
 * - Preserves user-created files not in manifest
 * - Tracks installation with git hash to avoid unnecessary updates
 * - Automatic rollback on failure
 * - Manual rollback support with --rollback flag
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import os from "node:os";
import readline from "node:readline";
import { execSync } from "node:child_process";

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

// Configuration
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.cwd();

// Determine if we're running from npm installation or source
const isNpmInstall = __dirname.includes("node_modules");
const PACKAGE_ROOT = isNpmInstall
  ? path.resolve(__dirname, "..")
  : REPO_ROOT;

const SUBMODULE_PATH = path.join(PACKAGE_ROOT, "everything-claude-code");
const CURSOR_DIR_LOCAL = path.join(REPO_ROOT, ".cursor");
const CURSOR_DIR_HOME = path.join(os.homedir(), ".cursor");
const MANIFEST_FILE = ".everything-cursor-manifest.json";
const MANIFEST_BACKUP_FILE = ".everything-cursor-manifest.backup.json";
const DIRS_TO_COPY = ["agents", "skills", "commands", "rules"];

// Statistics tracking
const stats = {
  updated: 0,
  added: 0,
  removed: 0,
  preserved: 0,
};

// Check for --rollback flag
const isRollback = process.argv.includes("--rollback");

// Main execution
(async () => {
  try {
    if (isRollback) {
      performRollback();
    } else {
      await installWithPreservation();
    }
  } catch (error) {
    console.error(color.red(`\n✗ Fatal error: ${error.message}`));
    process.exit(1);
  }
})();

/**
 * Main installation function with user file preservation
 */
async function installWithPreservation() {
  console.log(color.blue("📦 Installing everything-cursor..."));

  // Validate submodule
  validateSubmodule();

  // Get current git information from submodule
  const currentHash = getGitHash();
  const currentTag = getGitTag();

  // Load previous manifest (from either local or home)
  const { manifest, manifestPath: _existingManifestPath } = loadManifest();

  let selectedLocation;

  if (manifest && manifest.selectedLocation) {
    // 既存のマニフェストから選択を復元
    selectedLocation = manifest.selectedLocation;
    console.log(color.blue(`Using saved location: ${selectedLocation}`));
  } else {
    // 初回実行: ユーザーに選択を促す
    selectedLocation = await promptInstallLocation();
  }

  // インストールディレクトリ決定
  const installDir = getInstallDir(selectedLocation);
  const manifestPath = getManifestPath(selectedLocation);

  // Check if update is needed
  if (manifest && manifest.submoduleGitHash === currentHash) {
    const version = manifest.submoduleGitTag || currentHash.slice(0, 7);
    console.log(color.green("✓ Already up to date"));
    console.log(color.blue(`  Submodule version: ${version}`));
    console.log(color.blue(`  Location: ${selectedLocation}`));
    process.exit(0);
  }

  // Display update information
  const oldVersion = manifest?.submoduleGitTag ||
    manifest?.submoduleGitHash?.slice(0, 7) ||
    "initial";
  const newVersion = currentTag || currentHash.slice(0, 7);
  console.log(color.cyan(`🔄 Updating: ${oldVersion} → ${newVersion}`));
  console.log(
    color.cyan(`📍 Installing to: ${selectedLocation} (${installDir})\n`),
  );

  // Backup current manifest
  if (manifest) {
    backupManifest(manifest, installDir);
  }

  // Create install directory if needed
  if (!fs.existsSync(installDir)) {
    fs.mkdirSync(installDir, { recursive: true });
  }

  // Create new manifest
  const newManifest = {
    version: "1.0.0",
    selectedLocation: selectedLocation,
    installPath: installDir,
    installedAt: new Date().toISOString(),
    submoduleGitHash: currentHash,
    submoduleGitTag: currentTag || undefined,
    files: {},
  };

  const installedFiles = [];

  try {
    console.log(color.cyan("Processing .md files:"));

    // Process each directory
    for (const dir of DIRS_TO_COPY) {
      const sourceDir = path.join(SUBMODULE_PATH, dir);
      const destDir = path.join(installDir, dir);

      if (!fs.existsSync(sourceDir)) {
        continue;
      }

      // Create destination directory
      fs.mkdirSync(destDir, { recursive: true });

      console.log(color.cyan(`  ${dir}/`));

      // Get .md files from submodule
      const mdFiles = getMdFiles(sourceDir);

      // Copy/update .md files
      for (const file of mdFiles) {
        const relativePath = path.relative(sourceDir, file);
        const destPath = validatePath(
          path.join(destDir, relativePath),
          installDir,
        );
        const manifestKey = `${dir}/${relativePath}`;

        const existed = fs.existsSync(destPath);

        // Create parent directory if needed
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        // Copy file
        fs.copyFileSync(file, destPath);
        installedFiles.push({ path: destPath, isNew: !existed });

        // Add to manifest
        newManifest.files[manifestKey] = {
          source: path.relative(PACKAGE_ROOT, file),
          installedAt: new Date().toISOString(),
          checksum: calculateChecksum(file),
        };

        // Display operation
        if (existed) {
          console.log(color.green(`    ✓ ${relativePath} (updated)`));
          stats.updated++;
        } else {
          console.log(color.green(`    ✓ ${relativePath} (added)`));
          stats.added++;
        }
      }

      // Check for user files (exist in install dir but not in submodule)
      if (fs.existsSync(destDir)) {
        const existingFiles = getMdFiles(destDir);
        for (const existingFile of existingFiles) {
          const relativePath = path.relative(destDir, existingFile);
          const manifestKey = `${dir}/${relativePath}`;

          if (!newManifest.files[manifestKey]) {
            console.log(
              color.blue(`    → ${relativePath} (preserved - user file)`),
            );
            stats.preserved++;
          }
        }
      }
    }

    // Remove files deleted from submodule
    if (manifest && manifest.files) {
      console.log(color.cyan("  Cleanup:"));
      let hasCleanup = false;

      for (const [manifestKey, _fileInfo] of Object.entries(manifest.files)) {
        if (!newManifest.files[manifestKey]) {
          const filePath = path.join(installDir, manifestKey);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(
              color.yellow(
                `    ✗ ${manifestKey} (removed - deleted from submodule)`,
              ),
            );
            stats.removed++;
            hasCleanup = true;
          }
        }
      }

      if (!hasCleanup) {
        console.log(color.gray("    (no files to remove)"));
      }
    }

    // Save new manifest
    saveManifest(newManifest, manifestPath);

    // Display summary
    displaySummary(newVersion, currentHash, selectedLocation);
  } catch (error) {
    console.error(color.red("\n✗ Installation failed"));
    console.error(`  ${error.message}`);
    console.log(color.yellow("\n⟳ Rolling back changes..."));

    // Rollback: Remove newly installed files
    for (const file of installedFiles) {
      try {
        if (file.isNew && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(
            color.yellow(`  ✓ Removed ${path.relative(installDir, file.path)}`),
          );
        }
      } catch (_e) {
        console.warn(color.yellow(`  ⚠ Could not remove ${file.path}`));
      }
    }

    // Restore previous manifest
    restoreManifest(installDir);

    console.log(color.green("✓ Rollback complete"));
    throw error;
  }
}

/**
 * Perform manual rollback to previous installation
 */
function performRollback() {
  console.log(color.cyan("⟳ Rolling back to previous installation...\n"));

  // バックアップマニフェスト読み込み（local優先、次にhome）
  let backupPath = path.join(CURSOR_DIR_LOCAL, MANIFEST_BACKUP_FILE);
  let installDir = CURSOR_DIR_LOCAL;

  if (!fs.existsSync(backupPath)) {
    backupPath = path.join(CURSOR_DIR_HOME, MANIFEST_BACKUP_FILE);
    installDir = CURSOR_DIR_HOME;
  }

  if (!fs.existsSync(backupPath)) {
    console.error(color.red("✗ No backup found"));
    console.error("  Cannot rollback without backup manifest");
    process.exit(1);
  }

  const backupManifest = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  const currentManifestPath = path.join(installDir, MANIFEST_FILE);
  const currentManifest = fs.existsSync(currentManifestPath)
    ? JSON.parse(fs.readFileSync(currentManifestPath, "utf-8"))
    : null;

  // Display version information
  const currentVersion = currentManifest?.submoduleGitTag ||
    currentManifest?.submoduleGitHash?.slice(0, 7) || "unknown";
  const backupVersion = backupManifest.submoduleGitTag ||
    backupManifest.submoduleGitHash?.slice(0, 7) || "unknown";

  console.log(color.blue(`  Current: ${currentVersion}`));
  console.log(color.blue(`  Rollback to: ${backupVersion}`));
  console.log(
    color.blue(`  Location: ${backupManifest.selectedLocation || "local"}\n`),
  );

  // Remove files not in backup
  if (currentManifest && currentManifest.files) {
    for (const [key] of Object.entries(currentManifest.files)) {
      if (!backupManifest.files[key]) {
        const filePath = path.join(installDir, key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(color.yellow(`  ✗ Removed ${key}`));
        }
      }
    }
  }

  // Restore files from backup manifest
  for (const [key, fileInfo] of Object.entries(backupManifest.files)) {
    const srcPath = path.join(PACKAGE_ROOT, fileInfo.source);
    const destPath = path.join(installDir, key);

    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(color.green(`  ✓ Restored ${key}`));
    } else {
      console.warn(color.yellow(`  ⚠ Source file missing: ${key}`));
    }
  }

  // Restore backup manifest as current
  fs.copyFileSync(backupPath, currentManifestPath);
  console.log(color.green("  ✓ Manifest restored"));

  console.log(color.green("\n✅ Rollback complete!"));
  console.log(color.blue(`  Version: ${backupVersion}`));
}

/**
 * Prompt user to select installation location
 * @returns {Promise<"local" | "home">}
 */
async function promptInstallLocation() {
  console.log(color.cyan("\n📍 Select installation location:"));
  console.log("  1) local  - Project local (.cursor/)");
  console.log("  2) home   - Home directory (~/.cursor/)");
  console.log("  3) cancel - Cancel installation\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question("Enter your choice (1-3): ", (input) => {
      rl.close();
      resolve(input);
    });
  });

  switch (answer.trim()) {
    case "1":
      return "local";
    case "2":
      return "home";
    case "3":
      console.log(color.gray("Installation cancelled"));
      process.exit(0);
      break; // eslint-disable-line no-unreachable
    default:
      console.log(color.red("Invalid choice, please try again"));
      return promptInstallLocation(); // 再帰的に再試行
  }
}

/**
 * Get manifest path based on selected location
 * @param {"local" | "home"} selectedLocation
 * @returns {string}
 */
function getManifestPath(selectedLocation) {
  const baseDir = selectedLocation === "local"
    ? CURSOR_DIR_LOCAL
    : CURSOR_DIR_HOME;
  return path.join(baseDir, MANIFEST_FILE);
}

/**
 * Get install directory based on selected location
 * @param {"local" | "home"} selectedLocation
 * @returns {string}
 */
function getInstallDir(selectedLocation) {
  return selectedLocation === "local" ? CURSOR_DIR_LOCAL : CURSOR_DIR_HOME;
}

/**
 * Validate submodule existence and git repository
 */
function validateSubmodule() {
  if (!fs.existsSync(SUBMODULE_PATH)) {
    console.error(color.red("✗ Submodule directory not found"));
    if (isNpmInstall) {
      console.error("  Package installation appears to be corrupted");
      console.error("  Try reinstalling: npm install -g everything-cursor");
    } else {
      console.error("  Please run: git submodule update --init");
    }
    process.exit(1);
  }

  // Only check for .git directory when running from source (not npm install)
  if (!isNpmInstall) {
    const gitDir = path.join(SUBMODULE_PATH, ".git");
    if (!fs.existsSync(gitDir)) {
      console.error(color.red("✗ Submodule is not a git repository"));
      console.error("  Please run: git submodule update --init");
      process.exit(1);
    }

    // Ensure path is within project (only for source installations)
    const resolved = path.resolve(SUBMODULE_PATH);
    const repoRoot = path.resolve(REPO_ROOT);
    if (!resolved.startsWith(repoRoot)) {
      throw new Error("Submodule path outside repository");
    }
  }
}

/**
 * Get git commit hash from submodule
 */
function getGitHash() {
  // For npm installations, use a static hash based on package version
  if (isNpmInstall) {
    // Read package.json to get version
    const packageJsonPath = path.join(PACKAGE_ROOT, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      return `npm-${pkg.version}`;
    } catch (_error) {
      return "npm-unknown";
    }
  }

  try {
    const result = execSync(`git -C ${SUBMODULE_PATH} rev-parse HEAD`, {
      encoding: "utf-8",
    });
    return result.trim();
  } catch (_error) {
    console.error(color.red("✗ Failed to get git hash from submodule"));
    console.error(
      "  Is the submodule initialized? Try: git submodule update --init",
    );
    throw _error;
  }
}

/**
 * Get git tag from submodule (if available)
 */
function getGitTag() {
  // For npm installations, use package version
  if (isNpmInstall) {
    const packageJsonPath = path.join(PACKAGE_ROOT, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      return `v${pkg.version}`;
    } catch (_error) {
      return undefined;
    }
  }

  try {
    const result = execSync(
      `git -C ${SUBMODULE_PATH} describe --tags --exact-match 2>/dev/null || echo ""`,
      { encoding: "utf-8" },
    );
    return result.trim() || undefined;
  } catch (_error) {
    return undefined;
  }
}

/**
 * Recursively get all .md files from a directory
 * Ignores symlinks for security
 */
function getMdFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip symlinks
    if (entry.isSymbolicLink()) {
      console.warn(color.yellow(`⚠ Skipping symlink: ${entry.name}`));
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      files.push(...getMdFiles(fullPath));
    } else if (
      entry.isFile() && path.extname(entry.name).toLowerCase() === ".md"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Validate file path to prevent path traversal
 */
function validatePath(filePath, baseDir) {
  const resolved = path.resolve(filePath);
  const normalized = path.normalize(resolved);
  const base = path.resolve(baseDir);

  if (!normalized.startsWith(base)) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }

  return normalized;
}

/**
 * Calculate SHA-256 checksum of a file
 */
function calculateChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Load manifest from either local or home directory
 * Priority: local > home
 * @returns {{manifest: object | null, manifestPath: string | null}}
 */
function loadManifest() {
  // まずローカルを確認
  let manifestPath = path.join(CURSOR_DIR_LOCAL, MANIFEST_FILE);
  if (fs.existsSync(manifestPath)) {
    const manifest = loadManifestFromPath(manifestPath);
    if (manifest) {
      return { manifest, manifestPath };
    }
  }

  // 次にホームを確認
  manifestPath = path.join(CURSOR_DIR_HOME, MANIFEST_FILE);
  if (fs.existsSync(manifestPath)) {
    const manifest = loadManifestFromPath(manifestPath);
    if (manifest) {
      return { manifest, manifestPath };
    }
  }

  return { manifest: null, manifestPath: null };
}

/**
 * Load and validate manifest from specific path
 */
function loadManifestFromPath(manifestPath) {
  try {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    // 基本構造の検証
    if (!manifest.version || typeof manifest.files !== "object") {
      throw new Error("Invalid manifest structure");
    }

    // selectedLocationフィールドの検証
    if (
      manifest.selectedLocation &&
      !["local", "home"].includes(manifest.selectedLocation)
    ) {
      throw new Error(
        `Invalid selectedLocation: ${manifest.selectedLocation}`,
      );
    }

    // Git hashの検証
    if (
      manifest.submoduleGitHash &&
      !/^[a-f0-9]{40}$/i.test(manifest.submoduleGitHash)
    ) {
      throw new Error("Invalid git hash format");
    }

    return manifest;
  } catch (error) {
    console.warn(color.yellow("⚠ Manifest validation failed"));
    console.warn(`  ${error.message}`);
    return null;
  }
}

/**
 * Save manifest to specified path
 */
function saveManifest(manifest, manifestPath) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Backup manifest in the same directory
 */
function backupManifest(manifest, installDir) {
  if (!manifest) {
    return;
  }

  const backupPath = path.join(installDir, MANIFEST_BACKUP_FILE);

  try {
    fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 2));
  } catch (_error) {
    console.warn(color.yellow("⚠ Failed to backup manifest"));
    console.warn("  Proceeding without backup...");
  }
}

/**
 * Restore manifest from backup
 */
function restoreManifest(installDir) {
  const backupPath = path.join(installDir, MANIFEST_BACKUP_FILE);
  const manifestPath = path.join(installDir, MANIFEST_FILE);

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, manifestPath);
    console.log(color.green("  ✓ Manifest restored"));
  }
}

/**
 * Display installation summary
 */
function displaySummary(version, hash, selectedLocation) {
  console.log(color.cyan("\nSummary:"));
  console.log("━".repeat(40));

  if (stats.updated > 0) {
    console.log(color.cyan(`  ${stats.updated} .md file(s) updated`));
  }
  if (stats.added > 0) {
    console.log(color.cyan(`  ${stats.added} .md file(s) added`));
  }
  if (stats.removed > 0) {
    console.log(color.cyan(`  ${stats.removed} .md file(s) removed`));
  }
  if (stats.preserved > 0) {
    console.log(color.cyan(`  ${stats.preserved} user file(s) preserved`));
  }

  console.log("━".repeat(40));
  console.log(color.bold(color.green("✅ Installation complete!")));
  console.log(
    color.blue(`  Submodule version: ${version} (${hash.slice(0, 7)})`),
  );
  console.log(color.blue(`  Installed to: ${selectedLocation}`));
}
