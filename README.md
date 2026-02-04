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
```

## Release Process

### Local Development (Dry-Run)

Local release commands use `--dry-run` mode, which only shows what would happen without making actual changes:

```bash
npm run release              # Preview version bump from commits
npm run release:patch        # Preview 1.0.0 → 1.0.1
npm run release:minor        # Preview 1.0.0 → 1.1.0
npm run release:major        # Preview 1.0.0 → 2.0.0
```

### Automated Release

The project uses GitHub Actions for automated release. Simply:

1. Commit your changes with conventional commit messages:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: correct bug"
   ```

2. Push to `main` branch:
   ```bash
   git push origin main
   ```

3. GitHub Actions will:
   - Automatically bump version based on commit messages
   - Build the project with the new version
   - Commit build files
   - Create a git tag
   - Push to remote
   - Keep only the 10 most recent tags

### Commit Message Format

| Type   | Description         | Version Bump |
|--------|---------------------|--------------|
| `feat` | New feature         | minor        |
| `fix`  | Bug fix             | patch        |
| `docs` | Documentation       | -            |
| `style`| Code style          | -            |
| `refactor`| Refactoring      | -            |
| `perf` | Performance         | -            |
| `test` | Tests               | -            |
| `chore`| Build/CI            | -            |

Examples:
- `feat: add support for new website`
- `fix: correct font loading issue`
- `feat!: breaking API changes`
- `fix!: security patch`

### CDN Versioning

After release, resources are available via CDN using the `@version` syntax:
- `.../public/tampermonkey.js` (latest)
- `.../public/userscripts.js` (latest)
- `...@v1.0.1/public/domain.jsonp`
- `...@v1.0.1/public/styles/*.css`

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
