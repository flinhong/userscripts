// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.7
// @description  Apply custom fonts and styles to supported websites
// @author       Frank Lin
// @icon         https://frankindev.com/assets/img/logo.svg
// @match        *://baidu.com/*
// @match        *://www.baidu.com/*
// @match        *://news.baidu.com/*
// @match        *://github.com/*
// @match        *://www.zhihu.com/*
// @match        *://bing.com/*
// @match        *://*.bing.com/*
// @match        *://google.com/*
// @match        *://www.google.com/*
// @match        *://www.google.co.uk/*
// @match        *://www.google.com.hk/*
// @match        *://chatgpt.com/*
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Extract version from metadata at runtime
    const scriptMetaStr = GM.info.scriptMetaStr;
    const versionMatch = scriptMetaStr.match(/@version\s+(.+)/);
    const version = versionMatch ? versionMatch[1].trim() : 'unknown';
    const BASE_URL = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts@v' + version + '/public';

    const hostname = window.location.hostname;

    console.log('[Custom Styles] Script loaded, version ' + version);
    console.log('[Custom Styles] Hostname:', hostname);
    console.log('[Custom Styles] Base URL:', BASE_URL);

    function matchHostname(hostname, pattern) {
        // pattern: "*://domain.com/*" or "*://*.domain.com/*"
        const regex = pattern
            .replace(/^\*?:\/\//, '')  // remove "*://"
            .replace(/\/\*$/, '')      // remove "/*"
            .replace(/\./g, '.')        // restore dots
            .replace(/\*/g, '.*');     // wildcards
        const result = new RegExp('^' + regex + '$').test(hostname);
        console.log('[Custom Styles] Testing pattern:', pattern, '->', result ? 'MATCH' : 'no');
        return result;
    }

    function loadCSS(file, css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        console.log('[Custom Styles] CSS applied:', file);
    }

    function fetchCSS(file) {
        console.log('[Custom Styles] Fetching CSS:', file);
        GM.xmlHttpRequest({
            method: 'GET',
            url: BASE_URL + '/styles/' + file,
            onload: function(response) {
                loadCSS(file, response.responseText);
            },
            onerror: function(response) {
                console.error('[Custom Styles] Failed to load CSS:', file);
            }
        });
    }

    console.log('[Custom Styles] Loading domain config...');
    GM.xmlHttpRequest({
        method: 'GET',
        url: BASE_URL + '/domain.json',
        onload: function(response) {
            try {
                const config = JSON.parse(response.responseText);
                let matched = false;
                console.log('[Custom Styles] Checking rules...');
                for (const rule of config.rules) {
                    console.log('[Custom Styles] Rule file:', rule.file, 'patterns:', rule.match);
                    for (const pattern of rule.match) {
                        if (matchHostname(hostname, pattern)) {
                            console.log('[Custom Styles] -> Matched:', pattern);
                            fetchCSS(rule.file);
                            matched = true;
                            break;
                        }
                    }
                    if (matched) break;
                }
                if (!matched) {
                    console.log('[Custom Styles] No matching pattern found');
                }
            } catch (e) {
                console.error('[Custom Styles] Config parse error:', e.message);
            }
        },
        onerror: function(response) {
            console.error('[Custom Styles] Failed to load domain.json from', BASE_URL);
        }
    });
})();
