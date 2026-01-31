# everything-cursor

[![JSR](https://jsr.io/badges/@yoshixmk/everything-cursor)](https://jsr.io/@yoshixmk/everything-cursor)
[![JSR Score](https://jsr.io/badges/@yoshixmk/everything-cursor/score)](https://jsr.io/@yoshixmk/everything-cursor)

Cursor settings created from
[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Installation

### Using Deno

Install via [JSR](https://jsr.io/@yoshixmk/everything-cursor):

```bash
deno install -Agf jsr:@yoshixmk/everything-cursor/cli
everything-cursor install
```

Or run directly without installation:

```bash
deno run -A jsr:@yoshixmk/everything-cursor/cli install
```

### Using npm

Install globally via JSR:

```bash
npm install -g @jsr/yoshixmk__everything-cursor
everything-cursor install
```

Or run directly without installation:

```bash
npx @jsr/yoshixmk__everything-cursor install
```

### Installation Details

On **first run**, you'll be prompted to choose an installation location:

```
📍 Select installation location:
  1) local  - Project local (.cursor/)
  2) home   - Home directory (~/.cursor/)
  3) cancel - Cancel installation

Enter your choice (1-3):
```

- **local**: Installs to project's `.cursor/` directory (project-specific
  settings)
- **home**: Installs to `~/.cursor/` directory (shared across all projects)

The script will copy `.md` files from the submodule:

- `agents/*.md` - AI agent configurations
- `skills/**/*.md` - Skill definitions
- `commands/*.md` - Custom commands
- `rules/*.md` - Coding rules and guidelines

**Your choice is remembered** - future runs will automatically use the same
location without prompting.

**Note**: Only `.md` (Markdown) files are copied. Your custom files are
automatically preserved.

## Uninstallation

To remove the installed Cursor settings:

```bash
everything-cursor uninstall
```

This will remove only the files that were installed from the submodule (tracked
in the manifest).

**Your custom files are preserved**: User-created files in `.cursor/` are not
removed during uninstallation.

## Programmatic Usage

You can also use everything-cursor programmatically in your Node.js or
TypeScript projects.

### Installation

```bash
npm install @yoshixmk/everything-cursor
# or
yarn add @yoshixmk/everything-cursor
```

### API Reference

#### `install(options?)`

Install everything-cursor settings programmatically.

```typescript
import { install } from "@yoshixmk/everything-cursor";

// Install with default options (prompts for location)
await install();

// Install to local .cursor directory
await install({ location: "local" });

// Install silently to home directory
await install({ location: "home", silent: true });

// Install to a specific working directory
await install({ location: "local", cwd: "/path/to/project" });
```

**Options:**

- `location?: "local" | "home" | "ask"` - Target location (default: "ask")
- `silent?: boolean` - Suppress console output (default: false)
- `cwd?: string` - Working directory for installation (default: `process.cwd()`)

#### `uninstall(options?)`

Uninstall everything-cursor settings programmatically.

```typescript
import { uninstall } from "@yoshixmk/everything-cursor";

// Uninstall with default options
await uninstall();

// Uninstall silently
await uninstall({ silent: true });

// Uninstall from a specific working directory
await uninstall({ cwd: "/path/to/project" });
```

**Options:**

- `silent?: boolean` - Suppress console output (default: false)
- `cwd?: string` - Working directory for uninstallation (default:
  `process.cwd()`)

#### `isInstalled(cwd?)`

Check if everything-cursor is currently installed.

```typescript
import { isInstalled } from "@yoshixmk/everything-cursor";

const status = isInstalled();
if (status.isInstalled) {
  console.log(`Installed at: ${status.location}`);
  console.log(`Version: ${status.version}`);
  console.log(`File count: ${status.fileCount}`);
}

// Check installation in a specific directory
const status2 = isInstalled("/path/to/project");
```

**Returns:** `InstallStatus`

```typescript
interface InstallStatus {
  isInstalled: boolean;
  location?: "local" | "home";
  manifestPath?: string;
  version?: string;
  gitHash?: string;
  gitTag?: string;
  installedAt?: string;
  fileCount?: number;
}
```

#### `getInstalledPaths(cwd?)`

Get paths of all installed files.

```typescript
import { getInstalledPaths } from "@yoshixmk/everything-cursor";

const files = getInstalledPaths();
for (const file of files) {
  console.log(`${file.relativePath}`);
  console.log(`  Path: ${file.path}`);
  console.log(`  Installed: ${file.installedAt}`);
  console.log(`  Checksum: ${file.checksum}`);
}

// Get installed files in a specific directory
const files2 = getInstalledPaths("/path/to/project");
```

**Returns:** `InstalledFile[]`

```typescript
interface InstalledFile {
  path: string; // Absolute path to the file
  relativePath: string; // Relative path (e.g., "agents/planner.md")
  installedAt: string; // ISO timestamp
  checksum: string; // File checksum
}
```

#### `getPackageInfo()`

Get information about the package.

```typescript
import { getPackageInfo } from "@yoshixmk/everything-cursor";

const info = getPackageInfo();
console.log(info.name); // "@yoshixmk/everything-cursor"
console.log(info.version); // "0.0.1"
console.log(info.description); // Package description
```

### Complete Example

```typescript
import {
  getInstalledPaths,
  install,
  isInstalled,
  uninstall,
} from "@yoshixmk/everything-cursor";

async function setupCursorSettings() {
  // Check if already installed
  const status = isInstalled();

  if (status.isInstalled) {
    console.log(`Already installed (version: ${status.version})`);

    // List installed files
    const files = getInstalledPaths();
    console.log(`Total files: ${files.length}`);

    // Optionally reinstall
    await uninstall({ silent: true });
  }

  // Install to local directory
  await install({ location: "local", silent: false });

  // Verify installation
  const newStatus = isInstalled();
  console.log(`Installation successful: ${newStatus.isInstalled}`);
}

setupCursorSettings().catch(console.error);
```

## Structure

After installation, your chosen directory will contain:

**If installed to local** (project-specific):

```
{project}/.cursor/
├── agents/        # AI agent configurations (planner.md, etc.)
├── skills/        # Skills like tdd-workflow/
├── commands/      # Custom commands (tdd.md, etc.)
└── rules/         # Coding rules (security.md, etc.)
```

**If installed to home** (shared across projects):

```
~/.cursor/
├── agents/        # AI agent configurations (planner.md, etc.)
├── skills/        # Skills like tdd-workflow/
├── commands/      # Custom commands (tdd.md, etc.)
└── rules/         # Coding rules (security.md, etc.)
```

## Customization

### Adding Your Own Files

You can safely add your own custom files to your install directory. The
installation script will **never delete** files that you create.

**Example**:

```bash
# If installed to local
echo "# My Custom Agent" > .cursor/agents/my-agent.md

# If installed to home
echo "# My Custom Agent" > ~/.cursor/agents/my-agent.md

# This file will be preserved during updates
cursor-install
```

**File Types**:

- `.md` files you create are preserved (not tracked by the script)
- Non-`.md` files are completely ignored by the script
- Only `.md` files from the submodule are managed

### Changing Installation Location

To change where the settings are installed:

1. Uninstall current settings:
   ```bash
   cursor-uninstall
   ```

2. Run install again to choose a new location:
   ```bash
   cursor-install
   ```

The installation prompt will appear again, allowing you to select a different
location.

### What Gets Updated

The installation script only manages `.md` files that come from the
`everything-claude-code` submodule:

- ✅ Submodule `.md` files are updated when the submodule changes
- ✅ Your custom `.md` files are preserved
- ✅ Non-`.md` files are never touched
- ✅ Files removed from the submodule are automatically removed from your
  install directory

## Updating

### Update to Latest Version

To update to the latest version, simply reinstall:

```bash
deno install -Agf jsr:@yoshixmk/everything-cursor/cli
everything-cursor install
```

Note: The `-f` flag forces reinstallation even if already installed.

**Smart Update Detection**: The installation script tracks the git commit hash
of the submodule. If the submodule hasn't changed, the installation is
automatically skipped.

```bash
$ everything-cursor install
📦 Checking everything-cursor...
✓ Already up to date
  Submodule version: v1.2.3 (abc1234)
```

### Rollback to Previous Version

If an update causes issues, you can easily rollback:

```bash
everything-cursor install --rollback
```

This restores the previous installation state.

## Documentation

For detailed technical specifications and implementation details, see:

- [`docs/INSTALL_SPEC.md`](docs/INSTALL_SPEC.md) - Complete installation script
  specification

## Development

For developers who want to contribute or modify the code:

### Install from source

1. Clone this repository with submodules:

```bash
git clone --recursive https://github.com/yoshixmk/everything-cursor.git
cd everything-cursor
```

Or if already cloned:

```bash
git submodule update --init
```

2. Install dependencies:

```bash
npm install
# or: pnpm install
```

3. Test the installation locally:

```bash
npm run cursor-install
```

4. To uninstall:

```bash
npm run cursor-uninstall
```

## Publishing (For Maintainers)

To publish a new version:

### 1. Update version and submodule

Update the version in `jsr.json`:

```bash
# Edit jsr.json to update version
# Example: "version": "0.0.2"
```

Update the submodule to the latest version:

```bash
git submodule update --remote
```

### 2. Commit the changes

```bash
git add jsr.json everything-claude-code
git commit -m "Bump version to 0.0.2"
```

### 3. Create and push a git tag

```bash
git tag v0.0.2
git push origin v0.0.2
```

### 4. Publish to JSR

```bash
npx jsr publish
```

You will be prompted to authenticate in your browser.

### Publishing Notes

- Only `.md` files from `agents/`, `skills/`, `commands/`, and `rules/`
  directories are included (per `INSTALL_SPEC.md` requirements)
- Development files (`.sh`, `.py`, `.js`) and other non-Markdown files are
  automatically excluded

## Features

- ✅ **Location Choice**: Install to project-local or home directory
- ✅ **Location Memory**: Remembers your installation choice for future updates
- ✅ **Smart Update Detection**: Git hash tracking skips unnecessary
  installations
- ✅ **User File Preservation**: Your custom files are never deleted
- ✅ **Automatic Rollback**: Installation failures are automatically rolled back
- ✅ **Manual Rollback**: Easy rollback to previous version with `--rollback`
  flag
- ✅ **Security**: Path traversal prevention, only processes `.md` files
- ✅ **Clear Feedback**: Color-coded output with progress indicators

## License

MIT
