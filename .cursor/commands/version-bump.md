# Version Bump Command

Bump the version number and prepare for publishing.

## Usage

```
/version-bump [VERSION]
```

## Description

This command automates the version bumping process for the everything-cursor
package. It updates all necessary files and runs tests to ensure everything is
ready for publishing.

## Steps

1. **Update version in all files**:
   - `package.json`
   - `jsr.json`
   - `mod.ts` (version constant)
   - `README.md` (example version numbers)

2. **Run quality checks**:
   - Deno lint for TypeScript files
   - TypeScript compilation
   - Build the distribution files

3. **Run tests**:
   - npm link test
   - npm publish dry run
   - JSR publish dry run

4. **Create tarball for testing**:
   - Build and pack the npm package
   - Verify package contents

## Example

```bash
# Bump to version 0.0.4
/version-bump 0.0.4
```

## Implementation

When this command is invoked:

1. Update `package.json`:

```json
{
  "version": "VERSION"
}
```

2. Update `jsr.json`:

```json
{
  "version": "VERSION"
}
```

3. Update `mod.ts`:

```typescript
export const version = "VERSION";
```

4. Update `README.md` examples:
   - `# Example: "version": "VERSION"`
   - `git commit -m "Bump version to VERSION"`
   - `git tag vVERSION`
   - `git push origin vVERSION`

5. Run checks:

```bash
deno lint mod.ts cli.ts
pnpm build
pnpm publish --dry-run
npx jsr publish --dry-run --allow-dirty
```

## Post-bump checklist

After successful version bump:

- [ ] Review changes with `git diff`
- [ ] Commit changes: `git commit -m "Bump version to VERSION"`
- [ ] Create git tag: `git tag vVERSION`
- [ ] Push changes: `git push origin --tags`
- [ ] Publish to npm: `pnpm publish`
- [ ] Publish to JSR: `npx jsr publish`

## Notes

- Always run tests before publishing
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update changelog if available
- Ensure working tree is clean before starting
