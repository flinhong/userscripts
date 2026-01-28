const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const domainConfig = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'configs/domain.json'), 'utf8'),
)
const versionConfig = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'configs/version.json'), 'utf8'),
)

// Create public directory if it doesn't exist
const publicDir = path.join(projectRoot, 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Generate JSONP callback data from domain.json
const jsonpData = JSON.stringify({ rules: domainConfig.rules })
const jsonpCallback = 'domainConfig'
const jsonpContent = `${jsonpCallback}(${jsonpData});`

// Write JSONP file
fs.writeFileSync(path.join(publicDir, 'domain.jsonp'), jsonpContent)
console.log('✓ Generated: public/domain.jsonp')

// Copy styles to public directory
const publicStylesDir = path.join(publicDir, 'styles')
if (!fs.existsSync(publicStylesDir)) {
  fs.mkdirSync(publicStylesDir, { recursive: true })
}

domainConfig.rules.forEach(rule => {
  const sourceCssPath = path.join(
    projectRoot,
    'configs/styles',
    `${rule.css}.css`,
  )
  const targetCssPath = path.join(publicStylesDir, `${rule.css}.css`)
  if (fs.existsSync(sourceCssPath)) {
    fs.copyFileSync(sourceCssPath, targetCssPath)
    console.log(`✓ Copied: public/styles/${rule.css}.css`)
  }
})

// Common script logic
const commonScript = `    // Configuration cache
    let DOMAIN_CONFIG = null;
    let CSS_CACHE = {};

    // Get current domain
    function getCurrentDomain() {
        return window.location.hostname;
    }

    // Check if domain matches any rule (exact match only)
    function getMatchingDomain() {
        if (!DOMAIN_CONFIG || !DOMAIN_CONFIG.rules) return null;

        const currentDomain = getCurrentDomain();

        for (const rule of DOMAIN_CONFIG.rules) {
            if (!rule.css || !rule.domains) continue;

            // Exact match with domains in config
            if (rule.domains.includes(currentDomain)) {
                return rule.css;
            }
        }

        return null;
    }

    // Apply CSS
    function applyStyles(css) {
        if (css) {
            if (typeof GM_addStyle !== 'undefined') {
                GM_addStyle(css);
            } else if (typeof document !== 'undefined') {
                const style = document.createElement('style');
                style.textContent = css;
                (document.head || document.documentElement).appendChild(style);
            }
        }
    }

    // Initialize
    function init() {
        loadConfig(function() {
            const cssName = getMatchingDomain();
            if (cssName) {
                loadCSS(cssName, function(css) {
                    if (css) {
                        applyStyles(css);
                    }
                });
            }
        });
    }

    // Run at document-start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run immediately for document-start
    init();`

// Tampermonkey specific: use GM_xmlhttpRequest
const tampermonkeySpecific = `    // Script base URL
    const SCRIPT_BASE_URL = (() => {
        const script = document.currentScript || (function() {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (script && script.src) {
            return script.src.substring(0, script.src.lastIndexOf('/'));
        }
        return '';
    })();

    // Load configuration via JSONP with GM_xmlhttpRequest
    function loadConfig(callback) {
        if (DOMAIN_CONFIG) {
            callback(DOMAIN_CONFIG);
            return;
        }

        const configUrl = SCRIPT_BASE_URL + '/domain.jsonp';
        const callbackName = 'domainConfig';

        window[callbackName] = function(data) {
            DOMAIN_CONFIG = data;
            delete window[callbackName];
            callback(DOMAIN_CONFIG);
        };

        GM_xmlhttpRequest({
            method: 'GET',
            url: configUrl,
            onload: function(response) {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        const script = document.createElement('script');
                        script.textContent = response.responseText;
                        (document.head || document.documentElement).appendChild(script);
                        script.remove();
                    } catch (e) {
                        console.error('Custom Web Styler: Failed to parse JSONP response.', e);
                        callback({});
                    }
                } else {
                    console.error('Custom Web Styler: Failed to load config. Status: ' + response.status, configUrl);
                    callback({});
                }
            },
            onerror: function(response) {
                console.error('Custom Web Styler: Failed to load config due to a network error.', response);
                callback({});
            },
            ontimeout: function() {
                console.error('Custom Web Styler: Failed to load config due to a timeout.', configUrl);
                callback({});
            }
        });
    }

    // Load CSS via GM_xmlhttpRequest
    function loadCSS(cssName, callback) {
        if (CSS_CACHE[cssName]) {
            callback(CSS_CACHE[cssName]);
            return;
        }

        const cssUrl = SCRIPT_BASE_URL + '/styles/' + cssName + '.css';

        GM_xmlhttpRequest({
            method: 'GET',
            url: cssUrl,
            onload: function(response) {
                if (response.status >= 200 && response.status < 300) {
                    CSS_CACHE[cssName] = response.responseText;
                    callback(response.responseText);
                } else {
                    console.error('Custom Web Styler: Failed to load CSS. Status: ' + response.status, cssUrl);
                    callback(null);
                }
            },
            onerror: function(response) {
                console.error('Custom Web Styler: Failed to load CSS due to a network error.', response);
                callback(null);
            },
            ontimeout: function() {
                console.error('Custom Web Styler: Failed to load CSS due to a timeout.', cssUrl);
                callback(null);
            }
        });
    }`

// Userscripts (Safari) specific: use fetch and script tag
const userscriptsSpecific = `    // Script base URL
    const SCRIPT_BASE_URL = (() => {
        const script = document.currentScript || (function() {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (script && script.src) {
            return script.src.substring(0, script.src.lastIndexOf('/'));
        }
        return '';
    })();

    // Load configuration via fetch
    function loadConfig(callback) {
        if (DOMAIN_CONFIG) {
            callback(DOMAIN_CONFIG);
            return;
        }

        const configUrl = SCRIPT_BASE_URL + '/domain.jsonp';

        fetch(configUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.text();
            })
            .then(text => {
                // Parse JSONP: domainConfig({...})
                const match = text.match(/^\\s*domainConfig\\((.*)\\);?\\s*$/);
                if (match) {
                    DOMAIN_CONFIG = JSON.parse(match[1]);
                    callback(DOMAIN_CONFIG);
                } else {
                    console.error('Custom Web Styler: Invalid JSONP format');
                    callback({});
                }
            })
            .catch(error => {
                console.error('Custom Web Styler: Failed to load config', { url: configUrl, error: error });
                callback({});
            });
    }

    // Load CSS via fetch
    function loadCSS(cssName, callback) {
        if (CSS_CACHE[cssName]) {
            callback(CSS_CACHE[cssName]);
            return;
        }

        const cssUrl = SCRIPT_BASE_URL + '/styles/' + cssName + '.css';

        fetch(cssUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.text();
            })
            .then(text => {
                CSS_CACHE[cssName] = text;
                callback(text);
            })
            .catch(error => {
                console.error('Custom Web Styler: Failed to load CSS', { url: cssUrl, error: error });
                callback(null);
            });
    }`

// Generate Tampermonkey script
const tampermonkeyHeader = `// ==UserScript==
// @name         Custom Web Styler
// @namespace    http://tampermonkey.net/
// @version      ${versionConfig.version}
// @description  Apply custom CSS styles to various websites
// @author       flinhong
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// @license      MIT
// ==/UserScript==
(function() {
    'use strict';

${tampermonkeySpecific}
${commonScript}
})();`

// Generate Userscripts (Safari) script
const userscriptsHeader = `// ==UserScript==
// @name         Custom Web Styler
// @namespace    https://github.com/flinhong/userscripts
// @version      ${versionConfig.version}
// @description  Apply custom CSS styles to various websites
// @author       flinhong
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==
(function() {
    'use strict';

${userscriptsSpecific}
${commonScript}
})();`

// Write Tampermonkey script
fs.writeFileSync(path.join(publicDir, 'tampermonkey.js'), tampermonkeyHeader)

// Write Userscripts (Safari) script
fs.writeFileSync(path.join(publicDir, 'userscripts.js'), userscriptsHeader)

console.log('✓ Build completed successfully!')
console.log('✓ Generated: public/tampermonkey.js')
console.log('✓ Generated: public/userscripts.js')
console.log('')
console.log('Differences:')
console.log('  - Tampermonkey: GM_xmlhttpRequest for config and CSS')
console.log('  - Userscripts: fetch API for config and CSS')
console.log('')
console.log('Add new website:')
console.log('  1. Edit configs/domain.json')
console.log('  2. Create configs/styles/{newcss}.css')
console.log('  3. Run: npm run build')
