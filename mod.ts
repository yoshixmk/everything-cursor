/**
 * everything-cursor
 *
 * Cursor IDE settings and configurations from everything-claude-code.
 *
 * @module
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import process from "node:process";

/**
 * Package metadata
 */
export const version = "0.0.5";
export const name = "@yoshixmk/everything-cursor";
export const description =
  "Cursor settings created from affaan-m/everything-claude-code";

/**
 * Installation script paths
 *
 * Use these to reference the installation scripts:
 *
 * @example
 * ```ts
 * import { installScript, uninstallScript } from "@yoshixmk/everything-cursor";
 * console.log(`Install script: ${installScript}`);
 * console.log(`Uninstall script: ${uninstallScript}`);
 * ```
 */
export const installScript = "./scripts/cursor-install.mjs";
export const uninstallScript = "./scripts/cursor-uninstall.mjs";

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
  installScript: string;
  uninstallScript: string;
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
  gitHash?: string;
  gitTag?: string;
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
    installScript,
    uninstallScript,
    managedDirectories,
    managedExtension,
  };
}

/**
 * Get the script directory path
 * @internal
 */
function getScriptPath(scriptName: string): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  // When built to dist/, scripts are in ../scripts/
  // When running from source, scripts are in ./scripts/
  const scriptsDir = moduleDir.endsWith("dist")
    ? path.join(moduleDir, "..", "scripts")
    : path.join(moduleDir, "scripts");
  return path.join(scriptsDir, scriptName);
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
  // Keep async for API compatibility
  await Promise.resolve();

  const { location = "ask", silent = false, cwd = process.cwd() } = options;

  const scriptPath = getScriptPath("cursor-install.mjs");
  const env = { ...process.env };

  // Set location via environment variable if specified
  if (location !== "ask") {
    env.CURSOR_INSTALL_LOCATION = location;
  }

  try {
    const stdio = silent ? "pipe" : "inherit";
    execSync(`node "${scriptPath}"`, {
      cwd,
      env,
      stdio,
      encoding: "utf-8",
    });
  } catch (error) {
    throw new Error(
      `Installation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
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
  // Keep async for API compatibility
  await Promise.resolve();

  const { silent = false, cwd = process.cwd() } = options;

  const scriptPath = getScriptPath("cursor-uninstall.mjs");

  try {
    const stdio = silent ? "pipe" : "inherit";
    execSync(`node "${scriptPath}"`, {
      cwd,
      stdio,
      encoding: "utf-8",
    });
  } catch (error) {
    throw new Error(
      `Uninstallation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
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
  // Check local .cursor directory first
  const localManifestPath = path.join(cwd, ".cursor", MANIFEST_FILE);
  if (fs.existsSync(localManifestPath)) {
    return parseManifestStatus(localManifestPath, "local");
  }

  // Check home .cursor directory
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
      version: manifest.submoduleGitTag ||
        manifest.submoduleGitHash?.slice(0, 7),
      gitHash: manifest.submoduleGitHash,
      gitTag: manifest.submoduleGitTag,
      installedAt: manifest.installedAt,
      fileCount: Object.keys(manifest.files || {}).length,
    };
  } catch {
    return { isInstalled: false };
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
