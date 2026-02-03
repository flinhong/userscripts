// ==UserScript==
// @name         Custom Font Styler
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Apply custom fonts and styles to various websites
// @author       flinhong
// @homepage     https://github.com/flinhong/userscripts
// @supportURL   https://github.com/flinhong/userscripts/issues
// @updateURL    https://cdn.jsdelivr.net/gh/flinhong/userscripts/public/tampermonkey.js
// @downloadURL  https://cdn.jsdelivr.net/gh/flinhong/userscripts/public/tampermonkey.js
// @match        *://news.baidu.com/*
// @match        *://baidu.com/*
// @match        *://www.baidu.com/*
// @match        *://github.com/*
// @match        *://bing.com/*
// @match        *://*.bing.com/*
// @match        *://google.com/*
// @match        *://www.google.com/*
// @match        *://www.google.co.uk/*
// @match        *://www.google.com.hk/*
// @match        *://chatgpt.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let domainConfig = null;
    const configUrl = 'https://cdn.jsdelivr.net/gh/flinhong/userscripts/public/domain.jsonp';
    const cssBaseUrl = 'https://cdn.jsdelivr.net/gh/flinhong/userscripts/configs/styles';

    // JSONP callback function
    window.domainConfig = function(config) {
        domainConfig = config;
        console.log('[Custom Font Styler] Config loaded:', config.rules.length, 'rules');
        console.log('[Custom Font Styler] Current hostname:', window.location.hostname);
        applyStylesheet();
    };

    // Convert @match pattern to regex
    function matchPatternToRegex(pattern) {
        let regex = '^' + pattern
            .replace(/\*/g, '.*')
            .replace(/\./g, '\\.');
        return new RegExp(regex);
    }

    // Get matching CSS file for current URL
    function getMatchingStylesheet() {
        if (!domainConfig || !domainConfig.rules) return null;

        const fullUrl = window.location.href;

        for (const rule of domainConfig.rules) {
            const patterns = rule.domains || rule.match || [];
            for (const pattern of patterns) {
                const regex = matchPatternToRegex(pattern);
                if (regex.test(fullUrl)) {
                    return rule.file;
                }
            }
        }
        return null;
    }

    // Apply stylesheet
    function applyStylesheet() {
        const cssFile = getMatchingStylesheet();
        if (!cssFile) return;

        const cssUrl = cssBaseUrl + '/' + cssFile;

        if (typeof GM_addStyle !== 'undefined') {
            fetch(cssUrl)
                .then(response => response.text())
                .then(css => {
                    GM_addStyle(css);
                    console.log('[Custom Font Styler] Loaded:', cssFile, 'for', window.location.hostname);
                })
                .catch(err => {
                    console.error('[Custom Font Styler] Failed to load:', err);
                });
        } else {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssUrl;
            (document.head || document.documentElement).appendChild(link);
        }
    }

    // Load config via GM_xmlhttpRequest (supports CORS)
    function loadConfig() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: configUrl,
            onload: function(response) {
                try {
                    eval(response.responseText);
                } catch (e) {
                    console.error('[Custom Font Styler] Failed to load config:', e);
                }
            },
            onerror: function() {
                console.error('[Custom Font Styler] Failed to fetch config');
            }
        });
    }

    // Initialize
    loadConfig();
})();
