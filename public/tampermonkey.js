// ==UserScript==
// @name         Custom Web Styler
// @namespace    http://tampermonkey.net/
// @version      1.0.4
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