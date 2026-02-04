# Custom Font Styler

A userscript that applies custom fonts and styles to various websites.

## Features

- Apply custom fonts to supported websites
- Smooth font transitions
- Configurable per-domain styling
- Support for Tampermonkey and Safari userscripts
- CDN-hosted resources with versioned URLs

## Installation

### Tampermonkey

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Install the script:
   ```
   https://cdn.frankindev.com/statically/gh/flinhong/userscripts/main/tampermonkey.js
   ```

### Safari

1. Install [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
2. Install the script:
   ```
   https://cdn.frankindev.com/statically/gh/flinhong/userscripts/main/userscripts.js
   ```

## Supported Sites

- Baidu
- GitHub
- Bing
- Google
- ChatGPT

## Development

```bash
# Install dependencies
npm install

# Build scripts
npm run build

# Create a release
npm run release              # Auto-detect version from commits
npm run release:patch        # 1.0.0 → 1.0.1
npm run release:minor        # 1.0.0 → 1.1.0
npm run release:major        # 1.0.0 → 2.0.0
```

## Release Process

### Quick Release

```bash
# Commit your changes
git commit -m "feat: new feature"

# Create release
npm run release

# Push to GitHub
git push origin --follow-tags
```

**That's it!** `npm run release` will:
- Update `package.json` version
- Build the project with new version
- Auto-commit release changes
- Create a git tag

### Manual Version Bump

```bash
npm run release:patch   # 1.0.0 → 1.0.1 (bug fixes)
npm run release:minor   # 1.0.0 → 1.1.0 (new features)
npm run release:major   # 1.0.0 → 2.0.0 (breaking changes)
```

### CDN Sync

After pushing, resources are available via CDN:
   - `.../main/tampermonkey.js`
   - `.../main/userscripts.js`
   - `...@v1.0.1/public/domain.jsonp`
   - `...@v1.0.1/public/styles/*.css`

### Commit Message Format

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | minor |
| `fix` | Bug fix | patch |
| `docs` | Documentation | - |
| `style` | Code style | - |
| `refactor` | Refactoring | - |
| `perf` | Performance | - |
| `test` | Tests | - |
| `chore` | Build/CI | - |

Examples:
- `feat: add support for new website`
- `fix: correct font loading issue`
- `feat!: breaking API changes`
- `fix!: security patch`

### Tag Operations

**List all tags:**
```bash
git tag
```

**View tag details:**
```bash
git show v1.0.1
```

**Delete a tag locally:**
```bash
git tag -d v1.0.1
```

**Delete a tag from remote:**
```bash
git push origin :refs/tags/v1.0.1
```

**Push a specific tag:**
```bash
git push origin v1.0.1
```

**Re-create a tag:**
```bash
# If you need to undo a release
git tag -d v1.0.1                    # Delete local tag
git push origin :refs/tags/v1.0.1     # Delete remote tag
npm run release:patch                 # Re-create release
git push origin main --follow-tags     # Push again
```

### Rolling Back a Release

If you need to undo a release:

1. Delete the tag locally and remotely:
   ```bash
   git tag -d v1.0.1
   git push origin :refs/tags/v1.0.1
   ```
2. Restore the code to previous version if needed:
   ```bash
   git checkout v1.0.0
   ```

## License

ISC
