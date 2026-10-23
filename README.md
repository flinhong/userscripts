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

| Script        | URL                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Custom Styles | [style.userscripts.js](https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js) |
| Imgur Proxy   | [imgur.userscripts.js](https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js) |

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
└── package.json             # scripts & version
```

## Development

Requires [Bun](https://bun.sh) >= 1.1.

```bash
bun install
bun run build
```

Build outputs to `public/`. Run individually:

```bash
bun scripts/style.build.js   # Build custom styles script
bun scripts/imgur.build.js   # Build imgur proxy script
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

| Style File         | Domains                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `baidu.css`        | `baidu.com`, `www.baidu.com`                                            |
| `news.baidu.css`   | `news.baidu.com`, `baijiahao.baidu.com`                                 |
| `wenxin.baidu.css` | `wenxin.baidu.com`                                                      |
| `zhihu.css`        | `www.zhihu.com`, `zhida.zhihu.com`                                      |
| `bing.css`         | `bing.com`, `*.bing.com`                                                |
| `google.css`       | `google.com`, `www.google.com`, `www.google.co.uk`, `www.google.com.hk` |
| `deepseek.css`     | `chat.deepseek.com`                                                     |
| `bilibili.css`     | `www.bilibili.com`                                                      |
| `adguardhome.css`  | `dns.frankindev.com`, `doh.frankindev.com`                              |

## CDN Versioning

Resources are available via CDN with versioned URLs:

```
https://cdn.frankindev.com/statically/gh/flinhong/userscripts@{version}/public/domain.json
https://cdn.frankindev.com/statically/gh/flinhong/userscripts@{version}/public/styles/*.css
```

## Release (CI)

Versions use SemVer syntax in the form `1.YYYYMMDD.N` (UTC), with Git tags such as `v1.20261023.0`:

| Part    | Meaning                                            |
| ------- | -------------------------------------------------- |
| `MAJOR` | `1` (follows the latest stable major)              |
| `MINOR` | UTC date, e.g. `20261023`                          |
| `PATCH` | Release sequence for that day (`0`, `1`, `2`, ...) |

### Release schedule

- **Daily at 00:00 UTC**, the scheduled workflow publishes the day's `.0` release, even when there are no code changes.
- **A push to `main`** publishes the next patch for the day (`.1`, `.2`, ...) when it contains release-worthy commits.
- If the day's `.0` has not been published yet, the first release of the day is `.0`.
- If the day already has releases, the scheduled run skips it instead of publishing another version.
- Release-worthy commits are `feat:`, `fix:`, `perf:`, `revert:`, and breaking changes (`BREAKING CHANGE:` or `type!:`). Other types such as `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `build:`, and `ci:` do not trigger a release.

All automatic same-day releases increment `PATCH`; there is no separate major/minor increment in this date-based scheme. Use `workflow_dispatch` with an explicit `release_as` version (for example `1.20261023.5`) when a manual version is required.

CI installs Bun via `oven-sh/setup-bun` (version read from `package.json`'s `packageManager`), then runs `bun install --frozen-lockfile` and `bun run release:ci` (`scripts/release.js`), which will:

1. Determine the version from the UTC date and existing tags for that day
2. Update `package.json` version and build all scripts with it
3. Commit build files
4. Create an annotated Git tag and push the commit and tag

Build commits are tagged `[skip ci]` to avoid re-triggering. Releases are serialized via a `concurrency` group.

**Tag pruning** — only the last 21 SemVer tags are kept. Older SemVer tags are deleted from both remote and local after each release. Legacy date-based tags (`v2026.*`) were removed during the migration to this scheme.

To preview the next version locally (no build/commit/tag/push):

```bash
bun scripts/release.js --dry-run
```

To preview a scheduled (`.0`) release:

```bash
SCHEDULED=true bun scripts/release.js --dry-run
```

To force an explicit version:

```bash
bun scripts/release.js --release-as 1.20261023.0
```

## License

MIT
