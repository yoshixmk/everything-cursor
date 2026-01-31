#!/usr/bin/env zx

/**
 * cursor-uninstall.mjs
 * Removes everything-cursor settings from .cursor directory
 */

import { $, chalk, fs, path } from 'zx';

const REPO_ROOT = process.cwd();
const CURSOR_DIR = path.join(REPO_ROOT, '.cursor');

console.log(chalk.blue('🗑️  Uninstalling everything-cursor settings...'));

// Check if .cursor directory exists
if (!fs.existsSync(CURSOR_DIR)) {
  console.log(chalk.yellow('⚠️  .cursor directory not found. Nothing to uninstall.'));
  process.exit(0);
}

// Remove .cursor directory
console.log(chalk.cyan('Removing .cursor directory...'));
await $`rm -rf ${CURSOR_DIR}`;

console.log(chalk.green.bold('\n✅ Uninstallation complete!'));
console.log(chalk.blue('.cursor directory has been removed.'));
