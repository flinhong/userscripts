# Custom Userscripts

Custom userscripts that apply custom functions to various websites.

## Features

### Custom Styles

Apply custom fonts and styles to supported websites.

- Per-domain styling via `configs/domain.json`
- Support for Tampermonkey, Safari, and Violentmonkey
- CDN-hosted resources with versioned URLs
- `GM.addStyle` with `<link>` data URI fallback

### Imgur Proxy

Proxy imgur images to avoid 403 errors on embedding sites.

- Handles `<img src>` and `srcset` attributes
- `MutationObserver` for dynamically-loaded images
- Runs at `document-start` for early interception
- Excluded from `imgur.com` itself via `@exclude`

## Installation

Install scripts directly from CDN:

| Script | URL |
|--------|-----|
| Custom Styles | [style.userscripts.js](https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js) |
| Imgur Proxy | [imgur.userscripts.js](https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js) |

## Project Structure

```
userscripts/
├── configs/
│   ├── domain.json          # Domain-to-CSS mapping rules
│   └── styles/              # CSS files per domain
├── scripts/
│   ├── imgur.build.js       # Generates imgur.userscripts.js
│   └── style.build.js       # Generates style.userscripts.js
├── public/                  # Build output (CDN-hosted)
│   ├── imgur.userscripts.js
│   ├── style.userscripts.js
│   ├── domain.json
│   └── styles/
└── package.json             # v0.0.55
```

## Development

```bash
npm install
npm run build
```

Build outputs to `public/`. Run individually:

```bash
node scripts/style.build.js   # Build custom styles script
node scripts/imgur.build.js   # Build imgur proxy script
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

Add the corresponding CSS file in `configs/styles/` and rebuild.

## Supported Domains

Current rules in `configs/domain.json`:

| Style File | Domains |
|------------|---------|
| `baidu.css` | `baidu.com`, `www.baidu.com` |
| `news.baidu.css` | `news.baidu.com`, `baijiahao.baidu.com` |
| `wenxin.baidu.css` | `wenxin.baidu.com` |
| `zhihu.css` | `www.zhihu.com`, `zhida.zhihu.com` |
| `bing.css` | `bing.com`, `*.bing.com` |
| `google.css` | `google.com`, `www.google.com`, `www.google.co.uk`, `www.google.com.hk` |
| `deepseek.css` | `chat.deepseek.com` |
| `adguardhome.css` | `dns.frankindev.com`, `doh.frankindev.com` |

## CDN Versioning

Resources are available via CDN with versioned URLs:

```
https://cdn.frankindev.com/statically/gh/flinhong/userscripts@{version}/public/domain.json
https://cdn.frankindev.com/statically/gh/flinhong/userscripts@{version}/public/styles/*.css
```

## Release (CI)

Push to `main` to trigger GitHub Actions:

```bash
git push origin main
```

CI runs `npm run release:ci` which will:

1. Update `package.json` version via `commit-and-tag-version`
2. Build all scripts with the new version
3. Commit build files
4. Create git tag and push to remote
5. Prune tags older than the last 10

## License

MIT
