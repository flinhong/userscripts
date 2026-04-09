const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
const version = packageJson.version;

// More robust extraction of the JS block from Markdown
const mdContent = fs.readFileSync(path.join(ROOT_DIR, 'imgur.md'), 'utf-8');
const jsMatch = mdContent.match(/```js\s*\n([\s\S]*?)\n\s*```/);

if (!jsMatch) {
    console.error('Error: Could not find js block in imgur.md');
    process.exit(1);
}

const imgurScriptContent = jsMatch[1].trim();

const userscriptHeader = `// ==UserScript==
// @name         Imgur Proxy Fix
// @namespace    https://github.com/flinhong/userscripts
// @version      ${version}
// @description  Proxy Imgur images to avoid 403 errors (DuckDuckGo Proxy)
// @author       flinhong
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

`;

const fullScript = userscriptHeader + imgurScriptContent;

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

fs.writeFileSync(path.join(PUBLIC_DIR, 'imgur.userscripts.js'), fullScript);

console.log('✓ imgur.userscripts.js generated in public/ with robust implementation!');
