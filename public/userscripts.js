// ==UserScript==
// @name         Custom Web Styler
// @namespace    https://github.com/flinhong/userscripts
// @version      1.0.2
// @description  Apply custom CSS styles to various websites
// @author       flinhong
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==
(function() {
    'use strict';

    // Script base URL
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
            .then(response => response.text())
            .then(text => {
                // Parse JSONP: domainConfig({...})
                const match = text.match(/^\s*domainConfig\((.*)\);?\s*$/);
                if (match) {
                    DOMAIN_CONFIG = JSON.parse(match[1]);
                    callback(DOMAIN_CONFIG);
                } else {
                    console.error('Invalid JSONP format');
                    callback({});
                }
            })
            .catch(error => {
                console.error('Failed to load config:', configUrl, error);
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
            .then(response => response.text())
            .then(text => {
                CSS_CACHE[cssName] = text;
                callback(text);
            })
            .catch(error => {
                console.error('Failed to load CSS:', cssUrl, error);
                callback(null);
            });
    }
    // Configuration cache
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
    init();
})();