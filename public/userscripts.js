// ==UserScript==
// @name         Custom Font Styler
// @namespace    http://tampermonkey.net/
// @version      1.0.12
// @description  Apply custom fonts and styles to various websites
// @author       flinhong
// @homepage     https://github.com/flinhong/userscripts
// @supportURL   https://github.com/flinhong/userscripts/issues
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/userscripts.js
// @icon         https://cdn.frankindev.com/favicon.ico
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

    const scriptVersion = typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown';
    let domainConfig = null;
    // Parse CDN base URL from @updateURL in GM_info
    let cdnBase = '';
    if (typeof GM_info !== 'undefined' && GM_info.scriptMetaStr) {
        const updateUrlMatch = GM_info.scriptMetaStr.match(/@updateURL\s+(\S+)/);
        if (updateUrlMatch) {
            cdnBase = updateUrlMatch[1].replace(/\/public\/userscripts\.js$/, '');
        }
    }
    const configUrl = cdnBase + '/public/domain.' + scriptVersion + '.jsonp';
    const cssBaseUrl = cdnBase + '/public/styles';

    // JSONP callback function
    window.domainConfigCallback = function(config) {
        domainConfig = config;
        console.log('[CFS] Script version:', scriptVersion);
        console.log('[CFS] Config loaded:', config.rules.length, 'rules');
        console.log('[CFS] Current hostname:', window.location.hostname);
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
                    console.log('[CFS] Loaded:', cssFile, 'for', window.location.hostname);
                })
                .catch(err => {
                    console.error('[CFS] Failed to load:', err);
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
        console.log('[CFS] Fetching config:', configUrl);
        GM_xmlhttpRequest({
            method: 'GET',
            url: configUrl,
            onload: function(response) {
                console.log('[CFS] Response status:', response.status);
                console.log('[CFS] Response length:', response.responseText?.length || 0);
                if (response.status !== 200) {
                    console.error('[CFS] HTTP error:', response.status, response.statusText);
                    console.error('[CFS] Response:', response.responseText?.substring(0, 200) || 'empty');
                    return;
                }
                try {
                    eval(response.responseText);
                } catch (e) {
                    console.error('[CFS] Failed to load config:', e);
                    console.error('[CFS] Response:', response.responseText?.substring(0, 200) || 'empty');
                }
            },
            onerror: function(err) {
                    console.error('[CFS] Network error:', err);
            }
        });
    }

    // Initialize
    loadConfig();
})();
