# everything-cursor

Cursor settings created from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Installation

### 1. Clone this repository with submodules

```bash
git clone --recursive <repository-url>
cd everything-cursor
```

Or if already cloned:
```bash
git submodule update --init
```

### 2. Install dependencies and Cursor settings

```bash
pnpm install
```

This will automatically run the installation script and copy `.md` files from the submodule to `.cursor/`:
- `agents/*.md` - AI agent configurations
- `skills/**/*.md` - Skill definitions
- `commands/*.md` - Custom commands
- `rules/*.md` - Coding rules and guidelines

**Note**: Only `.md` (Markdown) files are copied. Your custom files are automatically preserved.

## Uninstallation

To remove the installed Cursor settings:
```bash
pnpm cursor-uninstall
```

This will remove the `.cursor/` directory completely.

**Warning**: This removes all files in `.cursor/`, including your custom files. Make sure to backup any custom content before uninstalling.

## Structure

After installation, your `.cursor/` directory will contain:

```
.cursor/
├── agents/        # AI agent configurations (planner.md, etc.)
├── skills/        # Skills like tdd-workflow/
├── commands/      # Custom commands (tdd.md, etc.)
└── rules/         # Coding rules (security.md, etc.)
```

## Customization

### Adding Your Own Files

You can safely add your own custom files to any `.cursor/` directory. The installation script will **never delete** files that you create.

**Example**:
```bash
# Create your custom agent
echo "# My Custom Agent" > .cursor/agents/my-agent.md

# This file will be preserved during updates
pnpm cursor-install
```

**File Types**:
- `.md` files you create are preserved (not tracked by the script)
- Non-`.md` files are completely ignored by the script
- Only `.md` files from the submodule are managed

### What Gets Updated

The installation script only manages `.md` files that come from the `everything-claude-code` submodule:
- ✅ Submodule `.md` files are updated when the submodule changes
- ✅ Your custom `.md` files are preserved
- ✅ Non-`.md` files are never touched
- ✅ Files removed from the submodule are automatically removed from `.cursor/`

## Updating

### Update to Latest Version

To update to the latest settings from everything-claude-code:

```bash
git submodule update --remote
pnpm cursor-install
```

**Smart Update Detection**: The installation script tracks the git commit hash of the submodule. If the submodule hasn't changed, the installation is automatically skipped.

```bash
$ pnpm cursor-install
📦 Checking everything-cursor...
✓ Already up to date
  Submodule version: v1.2.3 (abc1234)
```

### Rollback to Previous Version

If an update causes issues, you can easily rollback:

```bash
pnpm cursor-install --rollback
```

This restores the previous installation state.

## Documentation

For detailed technical specifications and implementation details, see:
- [`docs/INSTALL_SPEC.md`](docs/INSTALL_SPEC.md) - Complete installation script specification

## Features

- ✅ **Smart Update Detection**: Git hash tracking skips unnecessary installations
- ✅ **User File Preservation**: Your custom files are never deleted
- ✅ **Automatic Rollback**: Installation failures are automatically rolled back
- ✅ **Manual Rollback**: Easy rollback to previous version with `--rollback` flag
- ✅ **Security**: Path traversal prevention, only processes `.md` files
- ✅ **Clear Feedback**: Color-coded output with progress indicators

## License

MIT
