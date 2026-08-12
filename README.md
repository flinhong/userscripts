# Custom Userscripts

Custom userscripts that applies custom functions to various websites.

## Features

### Custom Styles

- Apply custom fonts and styles to supported websites
- Configurable per-domain styling via `configs/domain.json`
- Support for Tampermonkey and Safari userscripts
- CDN-hosted resources with versioned URLs

### Imgur Proxy

- Replace imgur images with custom proxy to avoid 403 errors

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

## Configuration

Edit `configs/domain.json` to add or modify domain rules:

```json
{
  "rules": [
    {
      "file": "google.css",
      "match": ["*://google.com/*", "*://www.google.com/*"]
    }
  ]
}
```

Add corresponding CSS file in `configs/styles/` directory.

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

## CDN Versioning

Resources are available via CDN with versioned URLs:

```
https://cdn.frankindev.com/statically/gh/flinhong/userscripts@{version}/public/domain.json
https://cdn.frankindev.com/statically/gh/flinhong/userscripts@{version}/public/styles/*.css
```

## License

MIT
