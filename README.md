# everything-cursor

[![JSR](https://jsr.io/badges/@yoshixmk/everything-cursor)](https://jsr.io/@yoshixmk/everything-cursor)
[![JSR Score](https://jsr.io/badges/@yoshixmk/everything-cursor/score)](https://jsr.io/@yoshixmk/everything-cursor)

Cursor settings created from
[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Installation

### Quick Start (Recommended)

Choose your preferred package manager:

**Deno** (Recommended):
```bash
# One-time execution
deno x jsr:@yoshixmk/everything-cursor/cli install

or

# Global installation
deno install -Agf jsr:@yoshixmk/everything-cursor/cli
everything-cursor install
```

**npm**:
```bash
# One-time execution
npx everything-cursor install

or

# Global installation
npm install -g everything-cursor
everything-cursor install
```

**pnpm**:
```bash
# One-time execution
pnpm dlx everything-cursor install

or

# Global installation
pnpm add -g everything-cursor
everything-cursor install
```

The CLI will prompt you to choose between local (`.cursor/`) or home (`~/.cursor/`) installation.

### Alternative: From Repository

Clone the repository and run the installation script directly:

```bash
git clone https://github.com/yoshixmk/everything-cursor.git
cd everything-cursor
node scripts/cursor-install.mjs
```

This method gives you full control and allows you to modify the settings before
installation.

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

Or from the repository:

```bash
node scripts/cursor-uninstall.mjs
```

This will remove only the files that were installed from the submodule (tracked
in the manifest).

**Your custom files are preserved**: User-created files in `.cursor/` are not
removed during uninstallation.

## For Developers: Programmatic Usage

If you want to integrate everything-cursor into your own tools or automation scripts, you can use the library API.

### Installation

```bash
# pnpm
pnpm add everything-cursor

# npm
npm install everything-cursor

# Deno
import { install } from "jsr:@yoshixmk/everything-cursor";
```

### Basic Usage

```typescript
import { install, uninstall } from "@yoshixmk/everything-cursor";

// Install to local .cursor directory
await install({ location: "local" });

// Uninstall
await uninstall();
```

For detailed API documentation, see the [JSR package page](https://jsr.io/@yoshixmk/everything-cursor).

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

- [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) - Build process and npm
  distribution specification
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
# Example: "version": "0.0.4"
```

Update the submodule to the latest version:

```bash
git submodule update --remote
```

### 2. Commit the changes

```bash
git add jsr.json everything-claude-code
git commit -m "Bump version to 0.0.4"
```

### 3. Create and push a git tag

```bash
git tag v0.0.4
git push origin v0.0.4
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
