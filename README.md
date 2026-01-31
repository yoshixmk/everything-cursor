# everything-cursor

Cursor settings created from
[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g everything-cursor
cursor-install
```

Or using npx without global installation:

```bash
npx everything-cursor cursor-install
```

### Option 2: Install from source

#### 1. Clone this repository with submodules

```bash
git clone --recursive https://github.com/yoshixmk/everything-cursor.git
cd everything-cursor
```

Or if already cloned:

```bash
git submodule update --init
```

#### 2. Install dependencies and Cursor settings

```bash
npm install
npm run cursor-install
```

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
cursor-uninstall
```

Or if installed from source:

```bash
npm run cursor-uninstall
```

This will remove only the files that were installed from the submodule (tracked
in the manifest).

**Your custom files are preserved**: User-created files in `.cursor/` are not
removed during uninstallation.

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

**If installed via npm:**

```bash
npm update -g everything-cursor
cursor-install
```

**If installed from source:**

```bash
git submodule update --remote
npm run cursor-install
```

**Smart Update Detection**: The installation script tracks the git commit hash
of the submodule. If the submodule hasn't changed, the installation is
automatically skipped.

```bash
$ cursor-install
📦 Checking everything-cursor...
✓ Already up to date
  Submodule version: v1.2.3 (abc1234)
```

### Rollback to Previous Version

If an update causes issues, you can easily rollback:

```bash
cursor-install --rollback
```

This restores the previous installation state.

## Documentation

For detailed technical specifications and implementation details, see:

- [`docs/INSTALL_SPEC.md`](docs/INSTALL_SPEC.md) - Complete installation script
  specification

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
