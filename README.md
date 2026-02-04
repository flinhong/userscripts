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
2. Install the script from [releases](https://github.com/flinhong/userscripts/releases)

### Safari

1. Install [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
2. Install the script from [releases](https://github.com/flinhong/userscripts/releases)

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

# Push with tags
git push --follow-tags
```

## Release Process

1. Commit changes using [conventional commits](https://www.conventionalcommits.org/)
2. Run `npm run release` to bump version and update CHANGELOG.md
3. Push with `git push --follow-tags`
4. GitHub Actions automatically creates a release with build artifacts

## License

ISC
