// ==UserScript==
// @name         Custom Font Styler
// @namespace    http://tampermonkey.net/
// @version      1.0.16
// @description  Apply custom fonts and styles to various websites
// @author       flinhong
// @homepage     https://github.com/flinhong/userscripts
// @supportURL   https://github.com/flinhong/userscripts/issues
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/tampermonkey.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/tampermonkey.js
// @icon         https://cdn.frankindev.com/favicon.ico
// @resource     config https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/domain.1.0.16.jsonp
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
// @grant        GM_getResourceURL
// @grant        GM_getResourceText
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
        console.log('[CFS] Config loaded:', config.rules.length, 'rules');
        applyStylesheet();
    };

    // Extract hostname from @match pattern
    function extractHostnameFromPattern(pattern) {
        const match = pattern.match(/\*:\/\/([^\/]+)/);
        return match ? match[1] : null;
    }

    // Get matching CSS file for current URL
    function getMatchingStylesheet() {
        if (!domainConfig || !domainConfig.rules) return null;

        const hostname = window.location.hostname;
        for (const rule of domainConfig.rules) {
            const patterns = rule.domains || rule.match || [];
            for (const pattern of patterns) {
                const patternHostname = extractHostnameFromPattern(pattern);
                if (hostname === patternHostname || hostname.endsWith("." + patternHostname)) {
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

    // Load config - try @resource first, fallback to GM_xmlhttpRequest
    function loadConfig() {
        if (typeof GM_getResourceText !== 'undefined') {
            // Tampermonkey with @resource support
            try {
                const configText = GM_getResourceText('config');
                eval(configText);
                console.log('[CFS] Loaded config from @resource');
            } catch (e) {
                console.error('[CFS] Failed to load @resource:', e);
                loadConfigFallback();
            }
        } else if (typeof GM_xmlhttpRequest !== 'undefined') {
            // Fallback for Safari/others
            loadConfigFallback();
        }
    }

    // Fallback: load config via GM_xmlhttpRequest
    function loadConfigFallback() {
        console.log('[CFS] Loading config from:', configUrl);
        GM_xmlhttpRequest({
            method: 'GET',
            url: configUrl,
            onload: function(response) {
                if (response.status !== 200) {
                    console.error('[CFS] HTTP error:', response.status, response.statusText);
                    return;
                }
                try {
                    eval(response.responseText);
                    console.log('[CFS] Loaded config from CDN');
                } catch (e) {
                    console.error('[CFS] Failed to load config:', e);
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
