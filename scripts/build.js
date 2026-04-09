const fs = require('fs');
const path = require('path');

/**
 * Constants and Configuration
 */
const REPO_OWNER = 'flinhong';
const REPO_NAME = 'userscripts';
const CDN_BASE = `https://cdn.frankindev.com/statically/gh/${REPO_OWNER}/${REPO_NAME}`;
const FONT_URL = 'https://cdn.frankindev.com/fonts/g/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Serif+SC:wght@200..900&family=Outfit:wght@100..900&display=swap';

const ROOT_DIR = path.join(__dirname, '..');
const CONFIGS_DIR = path.join(ROOT_DIR, 'configs');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const STYLES_DIR = path.join(PUBLIC_DIR, 'styles');

const domainConfig = JSON.parse(fs.readFileSync(path.join(CONFIGS_DIR, 'domain.json'), 'utf-8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
const version = packageJson.version;

/**
 * Utility Functions
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function extractHostname(pattern) {
    const match = pattern.match(/\*:\/\/([^\/]+)/);
    if (match) {
        return match[1].replace(/\*/g, 'www');
    }
    return null;
}

/**
 * Assets Preparation
 */
function prepareAssets() {
    ensureDir(PUBLIC_DIR);
    ensureDir(STYLES_DIR);

    const sourceStylesDir = path.join(CONFIGS_DIR, 'styles');
    const cssFiles = fs.readdirSync(sourceStylesDir).filter(file => file.endsWith('.css'));

    // Copy original CSS files
    cssFiles.forEach(file => {
        fs.copyFileSync(path.join(sourceStylesDir, file), path.join(STYLES_DIR, file));
    });

    // Create domain-specific CSS copies
    domainConfig.rules.forEach(rule => {
        const sourcePath = path.join(sourceStylesDir, rule.file);
        if (!fs.existsSync(sourcePath)) {
            console.warn(`  Warning: CSS file not found: ${rule.file}`);
            return;
        }

        const content = fs.readFileSync(sourcePath, 'utf-8');
        const domains = rule.domains || rule.match || [];
        domains.forEach(pattern => {
            const hostname = extractHostname(pattern);
            if (hostname) {
                fs.writeFileSync(path.join(STYLES_DIR, `${hostname}.css`), content);
            }
        });
    });

    // Generate domain.jsonp
    const jsonp = `domainConfigCallback(${JSON.stringify(domainConfig, null, 2)});`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'domain.jsonp'), jsonp);
}

/**
 * Userscript Generation
 */
function generateUserscriptHeader(type) {
    const isTampermonkey = type === 'tampermonkey';
    const fileName = isTampermonkey ? 'tampermonkey.js' : 'userscripts.js';
    const matchRules = [...new Set(domainConfig.rules.flatMap(rule => rule.domains || rule.match || []))];

    let header = [
        '// ==UserScript==',
        '// @name         Custom Font Styler',
        '// @namespace    http://tampermonkey.net/',
        `// @version      ${version}`,
        '// @description  Apply custom fonts and styles to various websites',
        '// @author       flinhong',
        `// @homepage     https://github.com/${REPO_OWNER}/${REPO_NAME}`,
        `// @supportURL   https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`,
        `// @updateURL    ${CDN_BASE}/public/${fileName}`,
        `// @downloadURL  ${CDN_BASE}/public/${fileName}`,
        '// @icon         https://cdn.frankindev.com/favicon.ico'
    ];

    if (isTampermonkey) {
        header.push(`// @resource     config ${CDN_BASE}@v${version}/public/domain.jsonp`);
        header.push(`// @resource     fonts ${FONT_URL}`);
    }

    matchRules.forEach(match => header.push(`// @match        ${match}`));

    header.push('// @grant        GM_xmlhttpRequest');
    header.push('// @grant        GM_addStyle');
    if (isTampermonkey) {
        header.push('// @grant        GM_getResourceURL');
        header.push('// @grant        GM_getResourceText');
    }
    header.push('// @run-at       document-start');
    header.push('// ==/UserScript==\n');

    return header.join('\n');
}

function generateScriptBody(type) {
    const isTampermonkey = type === 'tampermonkey';
    const fileName = isTampermonkey ? 'tampermonkey.js' : 'userscripts.js';

    return `
(function() {
    'use strict';

    const SCRIPT_NAME = '${fileName}';
    const FONT_URL = '${FONT_URL}';

    /**
     * State and Configuration
     */
    let domainConfig = null;
    const info = typeof GM_info !== 'undefined' ? GM_info : {};
    const version = info.script ? info.script.version : 'unknown';

    // Derive CDN base from metadata
    let cdnBase = '${CDN_BASE}';
    if (info.scriptMetaStr) {
        const match = info.scriptMetaStr.match(/@updateURL\\s+(\\S+)/);
        if (match) {
            cdnBase = match[1].replace(new RegExp(\`/public/\${SCRIPT_NAME}$\`), '');
        }
    }

    const configUrl = \`\${cdnBase}@v\${version}/public/domain.jsonp\`;
    const cssBaseUrl = \`\${cdnBase}@v\${version}/public/styles\`;

    /**
     * Helpers
     */
    const log = (...args) => console.log('[CFS]', ...args);
    const error = (...args) => console.error('[CFS]', ...args);

    const injectStyle = (css) => {
        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(css);
        } else {
            const style = document.createElement('style');
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        }
    };

    const fetchText = (url) => {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'undefined') {
                return fetch(url).then(r => r.text()).then(resolve).catch(reject);
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: (res) => res.status === 200 ? resolve(res.responseText) : reject(res),
                onerror: reject
            });
        });
    };

    /**
     * Logic
     */
    window.domainConfigCallback = (config) => {
        domainConfig = config;
        log('Config loaded:', config.rules.length, 'rules');
        applyStylesheet();
    };

    function getMatchingRule() {
        if (!domainConfig) return null;
        const hostname = window.location.hostname;
        return domainConfig.rules.find(rule => {
            const patterns = rule.domains || rule.match || [];
            return patterns.some(p => {
                const pHost = (p.match(/\\*:\\/\\/([^\\/]+)/) || [])[1];
                return pHost && (hostname === pHost || hostname.endsWith('.' + pHost.replace(/\\*\\./, '')));
            });
        });
    }

    async function applyStylesheet() {
        const rule = getMatchingRule();
        if (!rule) return;

        try {
            const css = await fetchText(\`\${cssBaseUrl}/\${rule.file}\`);
            injectStyle(css);
            log('Applied style:', rule.file);
        } catch (e) {
            error('Failed to apply style:', e);
        }
    }

    async function loadFonts() {
        const rule = getMatchingRule();
        // Check if fonts are explicitly disabled in rule
        if (rule && rule.fonts === false) return;

        try {
            if (typeof GM_getResourceText !== 'undefined') {
                try {
                    const fonts = GM_getResourceText('fonts');
                    if (fonts) {
                        injectStyle(fonts);
                        log('Loaded fonts via @resource');
                        return;
                    }
                } catch (e) {}
            }
            const fonts = await fetchText(FONT_URL);
            injectStyle(fonts);
            log('Loaded fonts via fetch');
        } catch (e) {
            error('Failed to load fonts:', e);
        }
    }

    async function init() {
        if (typeof GM_getResourceText !== 'undefined') {
            try {
                const configText = GM_getResourceText('config');
                if (configText) {
                    eval(configText);
                    log('Loaded config via @resource');
                }
            } catch (e) {
                error('Failed to load config via @resource:', e);
            }
        }

        if (!domainConfig) {
            try {
                const configText = await fetchText(configUrl);
                eval(configText);
                log('Loaded config via fetch');
            } catch (e) {
                error('Failed to load config:', e);
            }
        }

        loadFonts();
    }

    init();
})();
`;
}

/**
 * Main Build Process
 */
function build() {
    console.log('Starting build...');

    prepareAssets();

    ['userscripts', 'tampermonkey'].forEach(type => {
        const content = generateUserscriptHeader(type) + generateScriptBody(type);
        fs.writeFileSync(path.join(PUBLIC_DIR, `${type}.js`), content);
    });

    console.log('✓ Build completed!');
    console.log(`  Version: ${version}`);
    console.log(`  Generated scripts and domain.jsonp in public/`);
}

build();
