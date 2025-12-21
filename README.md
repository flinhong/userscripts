# Font Customization Userscript

A userscript for customizing fonts on websites using CSS variables and Google Fonts with fallbacks to system fonts. Works with both Tampermonkey and Safari Userscripts.

## Features

- Uses CSS variables for easy font customization
- Loads Google Fonts with automatic fallback to system fonts
- Site-specific configurations for granular control
- Compatible with both Tampermonkey and Safari Userscripts
- Handles Content Security Policy (CSP) restrictions gracefully
- Cloud-based configuration using CDN for fast delivery
- Uses accelerated Google Fonts mirror for faster loading in China
- Automatic CSS update detection through versioning system
- Runs only on websites with custom configurations to improve performance

## Project Structure

```
userscripts/
├── README.md
├── README.zh-CN.md
├── dist/
│   ├── tampermonkey.js
│   └── userscripts.js
├── src/
│   └── core.js
├── templates/
│   ├── tampermonkey.headers
│   └── userscripts.headers
├── configs/
│   ├── domain-map.json
│   ├── version.json
│   └── styles/
│       ├── fonts.css
│       ├── default.css
│       ├── github.com.css
│       └── ...
└── package.json
```

## How It Works

1. The script loads site-specific CSS configurations that contain both variables and styles
2. Google Fonts are automatically loaded using a Chinese mirror for better performance
3. System fonts are used as fallbacks when Google Fonts are blocked by CSP
4. A versioning system ensures CSS updates are detected and applied
5. Script only runs on sites with custom configurations (defined in match patterns)
6. Uses jsDelivr CDN for fast configuration delivery

## Development

To build the distribution files:

```bash
npm run build
```

This will generate optimized versions for both Tampermonkey and Safari Userscripts in the `dist/` folder.

## Managing Updates

To ensure users get the latest CSS updates:

1. Update the CSS files as needed
2. Run one of the release commands to bump the version and rebuild:
   - `npm run release` - Bumps patch version (1.0.0 -> 1.0.1)
   - `npm run release:minor` - Bumps minor version (1.0.1 -> 1.1.0)
   - `npm run release:major` - Bumps major version (1.1.0 -> 2.0.0)
3. Commit and push the changes

Users will automatically get the updated CSS files on their next page load without requiring any update to the userscript itself.

During development, you can use `npm run build` to rebuild the scripts without changing the version number.

## Adding New Sites

To add a new site configuration:

1. Add the domain to `configs/domain-map.json` (if it shares configuration with other domains) OR
2. Create `configs/styles/[domain].css` with both variables and styles for the site
3. Run `npm run build` to update the match patterns in the distribution files