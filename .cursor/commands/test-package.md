# Test Package Command

Test the everything-cursor package locally before publishing.

## Usage

```
/test-package
```

## Description

This command runs comprehensive tests on the package to ensure it works
correctly before publishing.

## Test Steps

### 1. Lint Check

```bash
deno lint mod.ts cli.ts
```

Checks for code quality issues in TypeScript files.

### 2. Build Test

```bash
pnpm build
```

Verifies that TypeScript compiles successfully.

### 3. pnpm Link Test

```bash
pnpm link --global
which everything-cursor
everything-cursor --help
```

Tests that the CLI works correctly when installed globally.

### 4. Package Content Test

```bash
pnpm pack
tar -tzf everything-cursor-*.tgz | head -20
```

Verifies that the package contains the correct files.

### 5. Installation Test

```bash
# Create test directory
mkdir -p /tmp/ec-test
cd /tmp/ec-test

# Test pnpm installation
pnpm init
pnpm add /path/to/everything-cursor-*.tgz

# Test import
node -e "const { isInstalled, getPackageInfo } = require('everything-cursor'); console.log(getPackageInfo());"

# Cleanup
cd -
rm -rf /tmp/ec-test
```

### 6. Deno/JSR Test

```bash
deno eval "import { isInstalled } from './mod.ts'; console.log(isInstalled());"
```

### 7. Dry Run Tests

```bash
# pnpm dry run
pnpm publish --dry-run

# JSR dry run
npx jsr publish --dry-run --allow-dirty
```

## Complete Test Script

```bash
#!/bin/bash
set -e

echo "🧪 Testing everything-cursor package..."
echo

# 1. Lint
echo "1️⃣ Running lint..."
deno lint mod.ts cli.ts

# 2. Build
echo "2️⃣ Building..."
pnpm build

# 3. pnpm link
echo "3️⃣ Testing pnpm link..."
pnpm link --global
everything-cursor --help

# 4. Pack and verify
echo "4️⃣ Creating package..."
pnpm pack
tar -tzf everything-cursor-*.tgz | wc -l
echo "   Files in package"

# 5. Installation test
echo "5️⃣ Testing installation..."
mkdir -p /tmp/ec-test
cd /tmp/ec-test
pnpm init > /dev/null
pnpm add /Users/ueki.yoshihiro/source/own/everything-cursor/everything-cursor-*.tgz > /dev/null
node -e "const { getPackageInfo } = require('everything-cursor'); const info = getPackageInfo(); console.log('   Version:', info.version);"
cd -
rm -rf /tmp/ec-test

# 6. Dry runs
echo "6️⃣ Testing publish (dry run)..."
pnpm publish --dry-run > /dev/null && echo "   pnpm: ✅"
npx jsr publish --dry-run --allow-dirty > /dev/null 2>&1 && echo "   JSR: ✅"

echo
echo "✅ All tests passed!"
```

## Expected Results

All tests should pass with:

- ✅ No lint errors
- ✅ Successful build
- ✅ CLI responds to --help
- ✅ Package contains ~89 files
- ✅ Installation works
- ✅ Version matches expected
- ✅ Dry runs succeed

## Troubleshooting

### Lint errors

- Fix TypeScript issues
- Check for sloppy imports

### Build fails

- Check tsconfig.json
- Verify all imports use .js extensions

### CLI not found

- Ensure bin field in package.json is correct
- Check shebang in cli.ts

### Package missing files

- Review "files" field in package.json
- Check .npmignore

### Installation fails

- Verify dependencies
- Check exports in package.json

## Notes

- Run this before every publish
- Keep test directory in /tmp to avoid conflicts
- Clean up test artifacts after completion
