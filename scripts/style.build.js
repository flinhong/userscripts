const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const STYLES_DIR = path.join(ROOT_DIR, 'configs', 'styles');
const CDN_BASE = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts';

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
const version = packageJson.version;

const domainConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'configs', 'domain.json'), 'utf-8'));

// 提取所有唯一的 match patterns
const matchPatterns = [...new Set(domainConfig.rules.flatMap(rule => rule.match))];

// 生成 @match 行
const matchLines = matchPatterns.map(p => `// @match        ${p}`).join('\n');

// 生成脚本内容
const scriptContent = `// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      ${version}
// @description  Apply custom fonts and styles to supported websites
// @author       Frank Lin
// @icon         https://frankindev.com/favicon.ico
${matchLines}
// @updateURL    ${CDN_BASE}/public/style.userscripts.js
// @downloadURL  ${CDN_BASE}/public/style.userscripts.js
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const BASE_URL = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts/@v${version}/public';

    const hostname = window.location.hostname;

    function matchesPattern(hostname, pattern) {
        const regex = pattern
            .replace(/\\./g, '\\\\.')
            .replace(/\\*/g, '.*')
            .replace(/\\?/g, '.');
        return new RegExp('^' + regex + '$').test('https://' + hostname);
    }

    function loadCSS(file) {
        GM.xmlHttpRequest({
            method: 'GET',
            url: BASE_URL + '/styles/' + file,
            onload: function(response) {
                GM.addStyle(response.responseText);
            },
            onerror: function(response) {
                console.error('Failed to load CSS:', file);
            }
        });
    }

    GM.xmlHttpRequest({
        method: 'GET',
        url: BASE_URL + '/domain.json',
        onload: function(response) {
            try {
                const config = JSON.parse(response.responseText);
                for (const rule of config.rules) {
                    for (const pattern of rule.match) {
                        if (matchesPattern(hostname, pattern)) {
                            loadCSS(rule.file);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load config:', response.responseText);
            }
        },
        onerror: function(response) {
            console.error('Failed to load domain.json from', BASE_URL);
        }
    });
})();
`;

// 确保 public 目录存在
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 复制 domain.json
fs.copyFileSync(
    path.join(ROOT_DIR, 'configs', 'domain.json'),
    path.join(PUBLIC_DIR, 'domain.json')
);

// 复制 styles 目录
const publicStylesDir = path.join(PUBLIC_DIR, 'styles');
if (!fs.existsSync(publicStylesDir)) {
    fs.mkdirSync(publicStylesDir, { recursive: true });
}

const styleFiles = fs.readdirSync(STYLES_DIR);
for (const file of styleFiles) {
    if (file.endsWith('.css')) {
        fs.copyFileSync(
            path.join(STYLES_DIR, file),
            path.join(publicStylesDir, file)
        );
        console.log('  copied ' + file);
    }
}

// 生成 style.userscripts.js
fs.writeFileSync(path.join(PUBLIC_DIR, 'style.userscripts.js'), scriptContent);

console.log('style.userscripts.js generated (v' + version + ')');
console.log('  copied domain.json');
console.log('  copied ' + styleFiles.length + ' style files');
