// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.7
// @description  Apply custom fonts and styles to supported websites
// @author       Frank Lin
// @icon         https://frankindev.com/assets/img/logo.svg
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
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const BASE_URL = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts@v0.0.7/public';

    const hostname = window.location.hostname;

    console.log('[Custom Styles] Script loaded, version 0.0.7');
    console.log('[Custom Styles] Hostname:', hostname);
    console.log('[Custom Styles] Base URL:', BASE_URL);

    function matchesPattern(hostname, pattern) {
        const regex = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp('^' + regex + '$').test('https://' + hostname);
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
                for (const rule of config.rules) {
                    for (const pattern of rule.match) {
                        if (matchesPattern(hostname, pattern)) {
                            console.log('[Custom Styles] Pattern matched:', pattern);
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
