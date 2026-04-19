const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const STYLES_DIR = path.join(ROOT_DIR, "configs", "styles");
const CDN_BASE =
  "https://cdn.frankindev.com/statically/gh/flinhong/userscripts";

const packageJson = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf-8"),
);
const version = packageJson.version;

const domainConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, "configs", "domain.json"), "utf-8"),
);

// 提取所有唯一的 match patterns
const matchPatterns = [
  ...new Set(domainConfig.rules.flatMap(rule => rule.match)),
];
const matchLines = matchPatterns.map(p => `// @match        ${p}`).join("\n");

// 生成脚本内容
const scriptContent = `// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      ${version}
// @description  Apply custom fonts and styles to configed websites
// @author       Frank Lin
// @icon         https://frankindev.com/assets/img/logo.svg
${matchLines}
// @updateURL    ${CDN_BASE}/public/style.userscripts.js
// @downloadURL  ${CDN_BASE}/public/style.userscripts.js
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @run-at       document-end
// @inject-into  content
// ==/UserScript==

(function() {
    'use strict';

    // Extract version from metadata at runtime
    let version = 'unknown';
    try {
        // GM.info.script.version - 直接获取脚本版本
        if (GM.info?.script?.version) {
            version = GM.info.script.version;
        } else if (GM.info?.scriptMetaStr) {
            // Fallback: 从 scriptMetaStr 解析
            const versionMatch = GM.info.scriptMetaStr.match(/@version\s+(.+)/);
            if (versionMatch) {
                version = versionMatch[1].trim();
            }
        }
    } catch (e) {
        console.error('[Custom Styles] Failed to get version:', e.message);
    }
    const BASE_URL = 'https://cdn.honglin.ac.cn/statically/gh/flinhong/userscripts@v' + version + '/public';

    const hostname = window.location.hostname;
    console.log('[Custom Styles] v' + version + ' | ' + hostname);

    function matchHostname(hostname, pattern) {
        const regex = pattern
            .replace(/^\\*?:\\/\\//, '')
            .replace(/\\/\\*$/, '')
            .replace(/\\./g, '.')
            .replace(/\\*/g, '.*');
        return new RegExp('^' + regex + '$').test(hostname);
    }

    function loadCSS(file, css) {
        // 方案 1: 优先使用 GM.addStyle（扩展 API，最佳方案）
        if (typeof GM !== 'undefined' && GM.addStyle) {
            GM.addStyle(css)
                .then(() => console.log('[Custom Styles] CSS loaded via GM.addStyle:', file))
                .catch(() => fallbackLinkInject(file, css));
        } else {
            // GM.addStyle 不可用，直接使用 fallback
            fallbackLinkInject(file, css);
        }
    }

    // Fallback: 通过 <link data URI> 注入到 head 底部
    function fallbackLinkInject(file, css) {
        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'data:text/css;base64,' + btoa(encodeURIComponent(css));
            document.head.appendChild(link);
            console.log('[Custom Styles] CSS loaded via <link> fallback:', file);
        } catch (e) {
            console.error('[Custom Styles] All injection methods failed for:', file, e);
        }
    }

    GM.xmlHttpRequest({
        method: 'GET',
        url: BASE_URL + '/domain.json',
        onload: function(response) {
            try {
                // 验证响应是有效的 JSON
                const text = response.responseText;
                if (!text || typeof text !== 'string' || !text.trim().startsWith('{')) {
                    console.error('[Custom Styles] Invalid config response:', text ? text.substring(0, 100) : 'empty');
                    return;
                }
                const config = JSON.parse(text);
                for (const rule of config.rules) {
                    for (const pattern of rule.match) {
                        if (matchHostname(hostname, pattern)) {
                            GM.xmlHttpRequest({
                                method: 'GET',
                                url: BASE_URL + '/styles/' + rule.file,
                                onload: function(res) {
                                    loadCSS(rule.file, res.responseText);
                                },
                                onerror: function() {
                                    console.error('[Custom Styles] Failed to load:', rule.file);
                                }
                            });
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error('[Custom Styles] Config error:', e.message);
            }
        },
        onerror: function() {
            console.error('[Custom Styles] Failed to load domain.json');
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
  path.join(ROOT_DIR, "configs", "domain.json"),
  path.join(PUBLIC_DIR, "domain.json"),
);

// 复制 styles 目录
const publicStylesDir = path.join(PUBLIC_DIR, "styles");
if (!fs.existsSync(publicStylesDir)) {
  fs.mkdirSync(publicStylesDir, { recursive: true });
}

const styleFiles = fs.readdirSync(STYLES_DIR);
for (const file of styleFiles) {
  if (file.endsWith(".css")) {
    fs.copyFileSync(
      path.join(STYLES_DIR, file),
      path.join(publicStylesDir, file),
    );
    console.log("  copied " + file);
  }
}

// 生成 style.userscripts.js
fs.writeFileSync(path.join(PUBLIC_DIR, "style.userscripts.js"), scriptContent);

console.log("style.userscripts.js generated (v" + version + ")");
console.log("  copied domain.json");
console.log("  copied " + styleFiles.length + " style files");
