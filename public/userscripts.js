// ==UserScript==
// @name         Custom Font Styler
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Apply custom fonts and styles to various websites
// @author       flinhong
// @homepage     https://github.com/flinhong/userscripts
// @supportURL   https://github.com/flinhong/userscripts/issues
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/userscripts.js
// @icon         https://cdn.frankindev.com/favicon.ico
// @match        *://baidu.com/*
// @match        *://www.baidu.com/*
// @match        *://github.com/*
// @match        *://www.zhihu.com/*
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
    const configUrl = cdnBase + '@v' + scriptVersion + '/public/domain.jsonp';
    const cssBaseUrl = cdnBase + '@v' + scriptVersion + '/public/styles';

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

    // Get matching rule for current URL
    function getMatchingRule() {
        if (!domainConfig || !domainConfig.rules) return null;

        const hostname = window.location.hostname;
        for (const rule of domainConfig.rules) {
            const patterns = rule.domains || rule.match || [];
            for (const pattern of patterns) {
                const patternHostname = extractHostnameFromPattern(pattern);
                if (hostname === patternHostname || hostname.endsWith("." + patternHostname)) {
                    return rule;
                }
            }
        }
        return null;
    }

    // Apply stylesheet
    function applyStylesheet() {
        const rule = getMatchingRule();
        if (!rule) return;

        const cssUrl = cssBaseUrl + '/' + rule.file;
        if (typeof GM_addStyle !== 'undefined') {
            fetch(cssUrl)
                .then(response => response.text())
                .then(css => {
                    GM_addStyle(css);
                    console.log('[CFS] Loaded:', rule.file, 'for', window.location.hostname);
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

    // Load Google Fonts - try @resource first, fallback to link tag
    function loadFonts() {
        const rule = getMatchingRule();
        if (!rule || !rule.fonts) {
            console.log('[CFS] Fonts disabled for this site');
            return;
        }
        if (typeof GM_getResourceText !== 'undefined') {
            // Tampermonkey with @resource support
            try {
                const fontsText = GM_getResourceText('fonts');
                GM_addStyle(fontsText);
                console.log('[CFS] Loaded fonts from @resource');
            } catch (e) {
                console.error('[CFS] Failed to load fonts from @resource:', e);
                loadFontsFallback();
            }
        } else {
            // Fallback for Safari/others
            loadFontsFallback();
        }
    }

    // Fallback: load fonts via link tag
    function loadFontsFallback() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.frankindev.com/fonts/g/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Serif+SC:wght@200..900&family=Outfit:wght@100..900&display=swap';
        (document.head || document.documentElement).appendChild(link);
        console.log('[CFS] Loaded fonts via link tag');
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
    loadFonts();
})();
