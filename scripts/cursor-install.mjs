#!/usr/bin/env zx

/**
 * cursor-install.mjs
 * Installs everything-claude-code settings to .cursor directory
 */

import { $, chalk, fs, path } from 'zx';

const REPO_ROOT = process.cwd();
const SUBMODULE_PATH = path.join(REPO_ROOT, 'everything-claude-code');
const CURSOR_DIR = path.join(REPO_ROOT, '.cursor');

// Directories to copy
const DIRS_TO_COPY = ['agents', 'skills', 'commands', 'rules'];

console.log(chalk.blue('🚀 Installing everything-cursor settings...'));

// Check if submodule exists
if (!fs.existsSync(SUBMODULE_PATH)) {
  console.error(chalk.red('❌ Submodule not found. Please run: git submodule update --init'));
  process.exit(1);
}

// Create .cursor directory if it doesn't exist
if (!fs.existsSync(CURSOR_DIR)) {
  console.log(chalk.yellow('📁 Creating .cursor directory...'));
  fs.mkdirSync(CURSOR_DIR, { recursive: true });
}

// Copy each directory
for (const dir of DIRS_TO_COPY) {
  const sourcePath = path.join(SUBMODULE_PATH, dir);
  const destPath = path.join(CURSOR_DIR, dir);

  if (!fs.existsSync(sourcePath)) {
    console.log(chalk.yellow(`⚠️  Skipping ${dir} (not found in submodule)`));
    continue;
  }

  console.log(chalk.cyan(`📋 Copying ${dir}...`));
  
  // Remove existing directory if it exists
  if (fs.existsSync(destPath)) {
    await $`rm -rf ${destPath}`;
  }

  // Copy directory
  await $`cp -r ${sourcePath} ${destPath}`;
  console.log(chalk.green(`✓ ${dir} installed`));
}

console.log(chalk.green.bold('\n✅ Installation complete!'));
console.log(chalk.blue('\nThe following directories have been installed to .cursor/:'));
DIRS_TO_COPY.forEach(dir => console.log(chalk.cyan(`  - ${dir}/`)));
