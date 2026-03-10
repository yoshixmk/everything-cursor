#!/usr/bin/env node
/**
 * CLI entry point for everything-cursor
 *
 * Cross-runtime compatible: works with both Deno and Node.js
 */

import { basename } from "node:path";
import process from "node:process";
import { install, uninstall } from "./mod.js";

// Deno global type declaration for cross-runtime compatibility
declare const Deno: {
  args: string[];
  exit(code: number): never;
} | undefined;

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

// Determine which command to run
try {
  if (commandName.includes("cursor-install") || args[0] === "install") {
    await install({ location: "ask" });
  } else if (
    commandName.includes("cursor-uninstall") || args[0] === "uninstall"
  ) {
    await uninstall();
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
} catch (error) {
  console.error(
    `Error: ${error instanceof Error ? error.message : String(error)}`,
  );
  exit(1);
}
