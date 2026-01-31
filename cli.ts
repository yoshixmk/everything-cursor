#!/usr/bin/env -S deno run --allow-read --allow-run=node
/**
 * CLI entry point for everything-cursor
 *
 * Cross-runtime compatible: works with both Deno and Node.js
 * This script delegates to the appropriate install or uninstall script
 * based on the command name or arguments.
 */

import { basename } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

// Runtime detection
const isDeno = typeof Deno !== "undefined";

// Cross-runtime helpers
const getArgs = (): string[] => {
  if (isDeno) {
    return Deno.args;
  }
  // Node.js: skip 'node' and script path
  return process.argv.slice(2);
};

const exit = (code: number): never => {
  if (isDeno) {
    Deno.exit(code);
  }
  process.exit(code);
};

const commandName = basename(import.meta.url);
const args = getArgs();

// Show help if requested
if (args[0] === "--help" || args[0] === "-h" || args[0] === "help") {
  console.log("everything-cursor - Claude Code integration for Cursor");
  console.log("");
  console.log("Usage: everything-cursor <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  install    - Install everything-cursor settings");
  console.log("  uninstall  - Uninstall everything-cursor settings");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help - Show this help message");
  exit(0);
}

// Determine which script to run
let scriptToRun: string;

if (commandName.includes("cursor-install") || args[0] === "install") {
  scriptToRun = "./scripts/cursor-install.mjs";
} else if (
  commandName.includes("cursor-uninstall") || args[0] === "uninstall"
) {
  scriptToRun = "./scripts/cursor-uninstall.mjs";
} else {
  console.error("Usage: everything-cursor <command>");
  console.error("");
  console.error("Commands:");
  console.error("  install    - Install everything-cursor settings");
  console.error("  uninstall  - Uninstall everything-cursor settings");
  console.error("");
  console.error("Run 'everything-cursor --help' for more information");
  exit(1);
}

// Get the directory where this script is located
const fullScriptPath = new URL(scriptToRun, import.meta.url).pathname;

// Filter out command name from args
const scriptArgs = args.slice(
  args[0] === "install" || args[0] === "uninstall" ? 1 : 0,
);

// Run the appropriate script using node
let exitCode: number;

if (isDeno) {
  // Deno runtime
  const command = new Deno.Command("node", {
    args: [fullScriptPath, ...scriptArgs],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();
  exitCode = code;
} else {
  // Node.js runtime
  const child = spawn("node", [fullScriptPath, ...scriptArgs], {
    stdio: "inherit",
  });

  exitCode = await new Promise<number>((resolve) => {
    child.on("close", (code) => resolve(code ?? 1));
  });
}

exit(exitCode);
