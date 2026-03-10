/**
 * everything-cursor
 *
 * Cursor IDE settings and configurations from everything-claude-code.
 *
 * @module
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";
import process from "node:process";

/**
 * Package metadata
 */
export const version = "0.0.8";
export const name = "@yoshixmk/everything-cursor";
export const description =
  "Cursor settings created from affaan-m/everything-claude-code";

/**
 * Directories managed by the installation scripts
 */
export const managedDirectories = [
  "agents",
  "skills",
  "commands",
  "rules",
] as const;

/**
 * File extension managed by the installation scripts
 */
export const managedExtension = ".md" as const;

/**
 * Manifest file name
 */
const MANIFEST_FILE = ".everything-cursor-manifest.json";

/**
 * Package information
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  managedDirectories: readonly string[];
  managedExtension: string;
}

/**
 * Installation options
 */
export interface InstallOptions {
  /**
   * Target location: "local" (.cursor/), "home" (~/.cursor/), or "ask" (prompt user)
   * @default "ask"
   */
  location?: "local" | "home" | "ask";

  /**
   * Whether to suppress console output
   * @default false
   */
  silent?: boolean;

  /**
   * Working directory for installation
   * @default process.cwd()
   */
  cwd?: string;
}

/**
 * Uninstall options
 */
export interface UninstallOptions {
  /**
   * Whether to suppress console output
   * @default false
   */
  silent?: boolean;

  /**
   * Working directory for uninstallation
   * @default process.cwd()
   */
  cwd?: string;
}

/**
 * Installed file information
 */
export interface InstalledFile {
  path: string;
  relativePath: string;
  installedAt: string;
  checksum: string;
}

/**
 * Manifest file information
 * @internal
 */
interface ManifestFileInfo {
  installedAt: string;
  checksum: string;
}

/**
 * Installation status
 */
export interface InstallStatus {
  isInstalled: boolean;
  location?: "local" | "home";
  manifestPath?: string;
  version?: string;
  installedAt?: string;
  fileCount?: number;
}

/**
 * Get information about the package
 */
export function getPackageInfo(): PackageInfo {
  return {
    name,
    version,
    description,
    managedDirectories,
    managedExtension,
  };
}

/**
 * Returns the package root URL.
 * Handles three cases:
 *   - JSR (https://): base URL is alongside mod.ts
 *   - npm dist/ (file://): package root is one level up from dist/
 *   - source (file://): package root is alongside mod.ts
 * @internal
 */
function getPackageBaseUrl(): URL {
  if (!import.meta.url.startsWith("file://")) {
    // JSR: use the directory containing mod.ts directly
    return new URL("./", import.meta.url);
  }
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  // npm build output: dist/mod.js → package root is parent of dist/
  const rootDir = path.basename(moduleDir) === "dist"
    ? path.dirname(moduleDir)
    : moduleDir;
  return new URL(`file://${rootDir}/`);
}

/**
 * Read a source file from the package, working for both local (file://) and JSR (https://)
 * @internal
 */
async function readSourceFile(relativePath: string): Promise<string> {
  const base = getPackageBaseUrl();
  const url = new URL(relativePath, base);

  if (url.protocol === "file:") {
    return fs.readFileSync(fileURLToPath(url), "utf-8");
  }
  const resp = await fetch(url.href);
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch ${url.href}: ${resp.status} ${resp.statusText}`,
    );
  }
  return await resp.text();
}

/**
 * Load the published file list from file-list.json
 * @internal
 */
async function loadFileList(): Promise<string[]> {
  const raw = await readSourceFile("file-list.json");
  return JSON.parse(raw) as string[];
}

/**
 * Prompt the user to select an installation location
 * @internal
 */
async function promptInstallLocation(): Promise<"local" | "home"> {
  const envLocation = process.env.CURSOR_INSTALL_LOCATION;
  if (envLocation === "local" || envLocation === "home") {
    console.log(`📍 Using ${envLocation} installation (from environment variable)`);
    return envLocation;
  }

  console.log("\n📍 Select installation location:");
  console.log("  1) local  - Project local (.cursor/)");
  console.log("  2) home   - Home directory (~/.cursor/)");
  console.log("  3) cancel - Cancel installation\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
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
      console.log("Installation cancelled");
      process.exit(0);
      break;
    default:
      console.log("Invalid choice, please try again");
      return promptInstallLocation();
  }
}

/**
 * Calculate SHA-256 checksum of a string
 * @internal
 */
function calculateChecksumFromString(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

/**
 * Install everything-cursor settings programmatically
 *
 * @example
 * ```ts
 * import { install } from "@yoshixmk/everything-cursor";
 *
 * // Install with default options (prompts for location)
 * await install();
 *
 * // Install to local .cursor directory
 * await install({ location: "local" });
 *
 * // Install silently to home directory
 * await install({ location: "home", silent: true });
 * ```
 */
export async function install(options: InstallOptions = {}): Promise<void> {
  const { location = "ask", silent = false, cwd = process.cwd() } = options;

  const log = (...args: unknown[]) => {
    if (!silent) console.log(...args);
  };

  log("📦 Installing everything-cursor...");

  const selectedLocation: "local" | "home" = location === "ask"
    ? await promptInstallLocation()
    : location;

  const installDir = selectedLocation === "local"
    ? path.join(cwd, ".cursor")
    : path.join(os.homedir(), ".cursor");

  const manifestPath = path.join(installDir, MANIFEST_FILE);

  // Load file list (from file system or JSR fetch)
  const fileList = await loadFileList();

  // Load existing manifest to check if update is needed
  const existingManifest = loadManifestFromPath(manifestPath);
  if (existingManifest?.version === version) {
    log("✓ Already up to date");
    log(`  Version: ${version}`);
    log(`  Location: ${selectedLocation}`);
    return;
  }

  log(`📍 Installing to: ${selectedLocation} (${installDir})\n`);

  if (!fs.existsSync(installDir)) {
    fs.mkdirSync(installDir, { recursive: true });
  }

  const newManifest: {
    version: string;
    selectedLocation: string;
    installPath: string;
    installedAt: string;
    files: Record<string, ManifestFileInfo>;
  } = {
    version,
    selectedLocation,
    installPath: installDir,
    installedAt: new Date().toISOString(),
    files: {},
  };

  let added = 0;
  let updated = 0;

  log("Processing .md files:");

  for (const relativePath of fileList) {
    const destPath = path.join(installDir, relativePath);
    const existed = fs.existsSync(destPath);

    const content = await readSourceFile(`./everything-claude-code/${relativePath}`);

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content, "utf-8");

    newManifest.files[relativePath] = {
      installedAt: new Date().toISOString(),
      checksum: calculateChecksumFromString(content),
    };

    if (existed) {
      log(`  ✓ ${relativePath} (updated)`);
      updated++;
    } else {
      log(`  ✓ ${relativePath} (added)`);
      added++;
    }
  }

  // Remove files that were previously installed but are no longer in the file list
  if (existingManifest?.files) {
    for (const key of Object.keys(existingManifest.files)) {
      if (!newManifest.files[key]) {
        const filePath = path.join(installDir, key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log(`  ✗ ${key} (removed)`);
        }
      }
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));

  log("\n" + "─".repeat(40));
  if (updated > 0) log(`  ${updated} file(s) updated`);
  if (added > 0) log(`  ${added} file(s) added`);
  log("─".repeat(40));
  log("✅ Installation complete!");
  log(`  Version: ${version}`);
  log(`  Installed to: ${selectedLocation}`);
}

/**
 * Uninstall everything-cursor settings programmatically
 *
 * @example
 * ```ts
 * import { uninstall } from "@yoshixmk/everything-cursor";
 *
 * // Uninstall with default options
 * await uninstall();
 *
 * // Uninstall silently
 * await uninstall({ silent: true });
 * ```
 */
export async function uninstall(options: UninstallOptions = {}): Promise<void> {
  await Promise.resolve();

  const { silent = false, cwd = process.cwd() } = options;

  const log = (...args: unknown[]) => {
    if (!silent) console.log(...args);
  };

  // Check local first, then home
  const localManifestPath = path.join(cwd, ".cursor", MANIFEST_FILE);
  const homeManifestPath = path.join(os.homedir(), ".cursor", MANIFEST_FILE);

  let manifestPath: string;
  let installDir: string;

  if (fs.existsSync(localManifestPath)) {
    manifestPath = localManifestPath;
    installDir = path.join(cwd, ".cursor");
  } else if (fs.existsSync(homeManifestPath)) {
    manifestPath = homeManifestPath;
    installDir = path.join(os.homedir(), ".cursor");
  } else {
    console.error("✗ everything-cursor is not installed");
    process.exit(1);
  }

  const manifest = loadManifestFromPath(manifestPath);
  if (!manifest?.files) {
    console.error("✗ Invalid or missing manifest");
    process.exit(1);
  }

  log("🗑️  Uninstalling everything-cursor...");

  let removed = 0;
  for (const key of Object.keys(manifest.files)) {
    const filePath = path.join(installDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log(`  ✗ ${key}`);
      removed++;
    }
  }

  fs.unlinkSync(manifestPath);

  log("\n✅ Uninstallation complete!");
  log(`  ${removed} file(s) removed`);
}

/**
 * Check if everything-cursor is currently installed
 *
 * @example
 * ```ts
 * import { isInstalled } from "@yoshixmk/everything-cursor";
 *
 * const status = isInstalled();
 * if (status.isInstalled) {
 *   console.log(`Installed at: ${status.location}`);
 *   console.log(`Version: ${status.version}`);
 * }
 * ```
 */
export function isInstalled(cwd: string = process.cwd()): InstallStatus {
  const localManifestPath = path.join(cwd, ".cursor", MANIFEST_FILE);
  if (fs.existsSync(localManifestPath)) {
    return parseManifestStatus(localManifestPath, "local");
  }

  const homeManifestPath = path.join(os.homedir(), ".cursor", MANIFEST_FILE);
  if (fs.existsSync(homeManifestPath)) {
    return parseManifestStatus(homeManifestPath, "home");
  }

  return { isInstalled: false };
}

/**
 * Parse manifest file and return installation status
 * @internal
 */
function parseManifestStatus(
  manifestPath: string,
  location: "local" | "home",
): InstallStatus {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    return {
      isInstalled: true,
      location,
      manifestPath,
      version: manifest.version,
      installedAt: manifest.installedAt,
      fileCount: Object.keys(manifest.files || {}).length,
    };
  } catch {
    return { isInstalled: false };
  }
}

/**
 * Load and validate manifest from a specific path
 * @internal
 */
function loadManifestFromPath(manifestPath: string): {
  version: string;
  files: Record<string, ManifestFileInfo>;
} | null {
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);
    if (!manifest.version || typeof manifest.files !== "object") return null;
    return manifest;
  } catch {
    return null;
  }
}

/**
 * Get paths of all installed files
 *
 * @example
 * ```ts
 * import { getInstalledPaths } from "@yoshixmk/everything-cursor";
 *
 * const files = getInstalledPaths();
 * for (const file of files) {
 *   console.log(`${file.relativePath} (installed at ${file.installedAt})`);
 * }
 * ```
 */
export function getInstalledPaths(
  cwd: string = process.cwd(),
): InstalledFile[] {
  const status = isInstalled(cwd);

  if (!status.isInstalled || !status.manifestPath || !status.location) {
    return [];
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(status.manifestPath, "utf-8"));
    const cursorDir = status.location === "local"
      ? path.join(cwd, ".cursor")
      : path.join(os.homedir(), ".cursor");

    return Object.entries<ManifestFileInfo>(manifest.files || {}).map((
      [key, fileInfo],
    ) => ({
      path: path.join(cursorDir, key),
      relativePath: key,
      installedAt: fileInfo.installedAt,
      checksum: fileInfo.checksum,
    }));
  } catch {
    return [];
  }
}
