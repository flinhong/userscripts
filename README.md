# Custom Userscripts

Custom userscripts that applies custom functions to various websites.

## Features

### Custom Styles

- Apply custom fonts and styles to supported websites
- Configurable per-domain styling via `configs/domain.json`
- Support for Tampermonkey and Safari userscripts
- CDN-hosted resources with versioned URLs

### Imgur Proxy

- Replace imgur images address with DuckDuckGo proxy to avoid 403 errors

## Installation

Install scripts directly from CDN:

| Script | URL |
|--------|-----|
| Custom Styles | [style.userscripts.js](https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js) |
| Imgur Proxy | [imgur.userscripts.js](https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js) |

## Development

```bash
npm install
npm run build
```

## Release (CI)

Push a tag to trigger GitHub Actions:

```bash
git tag v0.0.2
git push origin --tags
```

CI will:
1. Update `package.json` version
2. Build scripts with new version
3. Commit build files
4. Create git tag
5. Push to remote

## Commit Message Format

| Type       | Description   | Version Bump |
| ---------- | ------------- | ------------ |
| `feat`     | New feature   | minor        |
| `fix`      | Bug fix       | patch        |
| `docs`     | Documentation | -            |
| `style`    | Code style    | -            |
| `refactor` | Refactoring   | -            |
| `perf`     | Performance   | -            |
| `test`     | Tests         | -            |
| `chore`    | Build/CI      | -            |

Examples:

```bash
git commit -m "feat: add support for new website"
git commit -m "fix: correct font loading issue"
git commit -m "feat!: breaking API changes"
git commit -m "fix!: security patch"
```

## CDN Versioning

Resources are available via CDN with versioned URLs:

```
https://cdn.frankindev.com/statically/gh/flinhong/userscripts/@v{version}/public/style.userscripts.js
https://cdn.frankindev.com/statically/gh/flinhong/userscripts/@v{version}/public/domain.json
https://cdn.frankindev.com/statically/gh/flinhong/userscripts/@v{version}/public/styles/*.css
```

## Tag Operations

```bash
# List all tags
git tag

# View tag details
git show v1.0.1

# Delete tag locally
git tag -d v1.0.1

# Delete tag from remote
git push origin :refs/tags/v1.0.1

# Push specific tag
git push origin v1.0.1
```

## License

MIT
