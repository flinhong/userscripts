const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CDN_BASE = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts';

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
const version = packageJson.version;

// imgur proxy script content
const imgurScriptContent = `(function() {
    'use strict';

    const PROXY = 'https://proxy.duckduckgo.com/iu/?u=';
    const IS_IMGUR = /^https?:\\/\\/(?:[a-z0-9-.]+\\.)?imgur\\.com\\//i;

    const fixImage = (img) => {
        const src = img.src || img.srcset;
        if (src && IS_IMGUR.test(src)) {
            const url = src.split(' ')[0];
            img.src = PROXY + encodeURIComponent(url);
            if (img.srcset) {
                img.srcset = img.srcset.split(',').map(s => {
                    const [url, dpr] = s.trim().split(' ');
                    return IS_IMGUR.test(url) ? (PROXY + encodeURIComponent(url) + (dpr ? ' ' + dpr : '')) : s;
                }).join(', ');
            }
        }
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'IMG') fixImage(node);
                else if (node.querySelectorAll) {
                    node.querySelectorAll('img').forEach(fixImage);
                }
            });
        });
    });

    document.querySelectorAll('img').forEach(fixImage);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();`;

const imgurUserscriptHeader = `// ==UserScript==
// @name         Imgur Proxy Fix
// @namespace    https://github.com/flinhong/userscripts
// @version      ${version}
// @description  Proxy Imgur images to avoid 403 errors (DuckDuckGo Proxy)
// @author       Frank Lin
// @icon         https://frankindev.com/favicon.ico
// @match        *://*/*
// @updateURL    ${CDN_BASE}/public/imgur.userscripts.js
// @downloadURL  ${CDN_BASE}/public/imgur.userscripts.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

`;

// 确保 public 目录存在
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 生成 imgur.userscripts.js
fs.writeFileSync(path.join(PUBLIC_DIR, 'imgur.userscripts.js'), imgurUserscriptHeader + imgurScriptContent);

console.log('imgur.userscripts.js generated (v' + version + ')');
