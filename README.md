# everything-cursor

Cursor settings created from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Installation

1. Clone this repository with submodules:
```bash
git clone --recurse-submodules https://github.com/yoshixmk/everything-cursor.git
cd everything-cursor
```

Or if you've already cloned it:
```bash
git submodule update --init
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Install Cursor settings:
```bash
npm run cursor-install
# or
pnpm cursor-install
```

This will copy the following directories from the submodule to `.cursor/`:
- `agents/` - AI agent configurations
- `skills/` - Skill definitions
- `commands/` - Custom commands
- `rules/` - Coding rules and guidelines

## Uninstallation

To remove the installed Cursor settings:
```bash
npm run cursor-uninstall
# or
pnpm cursor-uninstall
```

This will remove the `.cursor/` directory.

## Structure

After installation, your `.cursor/` directory will contain:

```
.cursor/
├── agents/        # AI agent configurations (planner.md, etc.)
├── skills/        # Skills like tdd-workflow/
├── commands/      # Custom commands (tdd.md, etc.)
└── rules/         # Coding rules (security.md, etc.)
```

## Updating

To update to the latest settings from everything-claude-code:

```bash
git submodule update --remote
npm run cursor-install
```

## License

MIT
