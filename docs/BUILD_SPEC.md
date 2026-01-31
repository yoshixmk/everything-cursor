# Build Specification

This document describes the build process and npm distribution strategy for
everything-cursor.

## Overview

everything-cursor is a TypeScript project that supports multiple distribution
channels:

- **JSR (Deno)**: Direct TypeScript source distribution
- **npm**: Compiled JavaScript distribution
- **Repository clone**: Direct script execution

## Build System

### TypeScript Configuration

The project uses TypeScript to compile source files to JavaScript for npm
distribution.

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": [
    "mod.ts",
    "cli.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "everything-claude-code"
  ]
}
```

### Build Process

**Build Script** (`package.json`):

```json
{
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

**Build Output**:

- Source: `mod.ts`, `cli.ts`
- Output: `dist/mod.js`, `dist/cli.js`
- Type definitions: `dist/*.d.ts`, `dist/*.d.ts.map`
- Source maps: `dist/*.js.map`

### Shebang Handling

**Strategy**: Include shebang directly in source file

The CLI entry point (`cli.ts`) includes a shebang that is preserved by the
TypeScript compiler:

```typescript
#!/usr/bin/env node
/**
 * CLI entry point for everything-cursor
 *
 * Cross-runtime compatible: works with both Deno and Node.js
 */
```

**Rationale**:

- Simpler build process (no post-processing required)
- TypeScript compiler naturally preserves shebangs
- Works correctly with npm's bin linking mechanism

**Previous Approach** (deprecated):

- Used `build:shebang` script to add shebang after compilation
- More complex and error-prone
- Required additional build step

## Package Configuration

### Entry Points

**package.json exports**:

```json
{
  "exports": {
    ".": {
      "import": "./dist/mod.js",
      "types": "./dist/mod.d.ts"
    },
    "./cli": {
      "import": "./dist/cli.js",
      "types": "./dist/cli.d.ts"
    }
  },
  "bin": {
    "everything-cursor": "./dist/cli.js"
  }
}
```

### Files Included in npm Package

**package.json files**:

```json
{
  "files": [
    "dist/**/*.js",
    "dist/**/*.d.ts",
    "dist/**/*.d.ts.map",
    "dist/**/*.js.map",
    "scripts/*.mjs",
    "everything-claude-code/agents/",
    "everything-claude-code/skills/",
    "everything-claude-code/commands/",
    "everything-claude-code/rules/",
    "LICENSE",
    "README.md"
  ]
}
```

### Files Excluded from npm Package

**.npmignore**:

```
# TypeScript source files (only ship compiled JS)
mod.ts
cli.ts
tsconfig.json
*.ts
!dist/**/*.d.ts
```

**Rationale**:

- Only distribute compiled JavaScript
- Include type definitions for TypeScript consumers
- Exclude development files and configuration

## Cross-Runtime Compatibility

### Runtime Detection

The code includes runtime detection to support both Deno and Node.js:

```typescript
// Deno global type declaration for cross-runtime compatibility
declare const Deno: {
  args: string[];
  exit(code: number): never;
} | undefined;

// Runtime detection
const isDeno = typeof Deno !== "undefined";
```

### Module Resolution

**Source files** use `.js` extensions in imports for TypeScript compatibility:

```typescript
import { install, uninstall } from "./mod.js";
```

**Rationale**:

- TypeScript resolves `.js` imports to `.ts` files during compilation
- Compiled JavaScript maintains correct `.js` imports
- Works in both ESM environments (Node.js, Deno)

### Path Resolution for Scripts

The `mod.ts` file includes logic to resolve script paths in both source and
compiled environments:

```typescript
function getScriptPath(scriptName: string): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  // When built to dist/, scripts are in ../scripts/
  // When running from source, scripts are in ./scripts/
  const scriptsDir = moduleDir.endsWith("dist")
    ? path.join(moduleDir, "..", "scripts")
    : path.join(moduleDir, "scripts");
  return path.join(scriptsDir, scriptName);
}
```

## Distribution Channels

### 1. JSR (Deno)

**Target**: Deno users, TypeScript consumers

**Distribution**: Direct TypeScript source files via JSR

**Usage**:

```typescript
import { install, uninstall } from "jsr:@yoshixmk/everything-cursor";

await install({ location: "local" });
```

**Configuration** (`jsr.json`):

- Publishes TypeScript source files
- No build step required

**Limitations**:

- CLI command not supported via JSR due to script resolution issues
- Library API only

### 2. npm

**Target**: Node.js users, npm ecosystem

**Distribution**: Compiled JavaScript via npm registry

**Usage**:

Global installation:

```bash
npm install -g @jsr/yoshixmk__everything-cursor
everything-cursor install
```

Direct execution:

```bash
npx @jsr/yoshixmk__everything-cursor install
```

Programmatic usage:

```javascript
import { install, uninstall } from "everything-cursor";

await install({ location: "local" });
```

**Build Requirement**: Must run `npm run build` before publishing

### 3. Repository Clone

**Target**: Developers, contributors, users wanting direct control

**Distribution**: Git repository with submodules

**Usage**:

```bash
git clone --recursive https://github.com/yoshixmk/everything-cursor.git
cd everything-cursor
node scripts/cursor-install.mjs
```

**Advantages**:

- No module resolution issues
- Direct access to installation scripts
- Full control over the codebase

## Testing npm Distribution

### Local Testing with npm link

1. **Build the package**:
   ```bash
   npm run build
   ```

2. **Link globally**:
   ```bash
   npm link
   ```

3. **Test CLI commands**:
   ```bash
   everything-cursor --help
   everything-cursor install
   everything-cursor uninstall
   ```

4. **Test in another project**:
   ```bash
   cd /path/to/test-project
   npm link everything-cursor
   ```

5. **Test programmatic API**:
   ```javascript
   import { getPackageInfo, isInstalled } from "everything-cursor";

   console.log(getPackageInfo());
   console.log(isInstalled());
   ```

6. **Cleanup**:
   ```bash
   npm unlink -g everything-cursor
   ```

### Test Results

All tests passed successfully:

- ✅ Build process (`npm run build`)
- ✅ Global installation (`npm link`)
- ✅ CLI help command (`everything-cursor --help`)
- ✅ CLI install command (`everything-cursor install`)
- ✅ CLI uninstall command (`everything-cursor uninstall`)
- ✅ Programmatic API (`getPackageInfo()`, `isInstalled()`)
- ✅ Module imports
- ✅ Shebang preservation
- ✅ Path resolution (dist/ → ../scripts/)

## Publishing to npm

### Pre-publish Checklist

1. **Update version** in `jsr.json` and `package.json`
2. **Update submodule** to latest version:
   ```bash
   git submodule update --remote
   ```
3. **Test build**:
   ```bash
   npm run build
   npm link
   # Test commands...
   npm unlink -g everything-cursor
   ```
4. **Commit changes**:
   ```bash
   git add jsr.json package.json everything-claude-code
   git commit -m "Bump version to X.Y.Z"
   ```
5. **Create git tag**:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

### Publish Process

The `prepublishOnly` script automatically runs the build:

```bash
npx jsr publish
```

This will:

1. Run `npm run build` (via `prepublishOnly` hook)
2. Compile TypeScript to JavaScript
3. Publish to JSR registry

**Note**: The npm package is published via JSR's npm compatibility layer.

## Troubleshooting

### Common Issues

**Issue**: Module not found errors after npm link

- **Cause**: Missing build or incorrect paths
- **Solution**: Run `npm run build` and verify `dist/` contents

**Issue**: Command not executable

- **Cause**: Missing or incorrect shebang
- **Solution**: Verify `#!/usr/bin/env node` is at the top of `dist/cli.js`

**Issue**: Cannot find scripts directory

- **Cause**: Path resolution issue in `getScriptPath()`
- **Solution**: Check that `moduleDir.endsWith("dist")` logic is correct

**Issue**: TypeScript compilation errors

- **Cause**: Type errors or missing dependencies
- **Solution**: Check `tsconfig.json` and install missing `@types/*` packages

## Dependencies

### Runtime Dependencies

- None (uses Node.js built-in modules only)

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/deno": "^2.5.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.7.0"
  }
}
```

**@types/deno**: Type definitions for Deno runtime (for cross-runtime
compatibility) **@types/node**: Type definitions for Node.js **typescript**:
TypeScript compiler

## File Structure

```
everything-cursor/
├── cli.ts                    # CLI entry point (TypeScript source)
├── mod.ts                    # Library API (TypeScript source)
├── tsconfig.json            # TypeScript configuration
├── package.json             # npm package configuration
├── jsr.json                 # JSR package configuration
├── .npmignore               # Files to exclude from npm package
├── dist/                    # Compiled JavaScript (git-ignored)
│   ├── cli.js              # Compiled CLI
│   ├── cli.d.ts            # Type definitions
│   ├── mod.js              # Compiled library
│   └── mod.d.ts            # Type definitions
├── scripts/                 # Installation scripts
│   ├── cursor-install.mjs
│   └── cursor-uninstall.mjs
├── docs/                    # Documentation
│   ├── BUILD_SPEC.md       # This file
│   └── INSTALL_SPEC.md     # Installation specification
└── everything-claude-code/  # Submodule with Cursor settings
    ├── agents/
    ├── skills/
    ├── commands/
    └── rules/
```

## Version Compatibility

**Node.js**: >= 18.0.0 **Deno**: Latest version (for library API only)
**TypeScript**: ^5.7.0 (for development)

## References

- [Installation Specification](./INSTALL_SPEC.md)
- [README.md](../README.md)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [npm package.json exports](https://nodejs.org/api/packages.html#exports)
