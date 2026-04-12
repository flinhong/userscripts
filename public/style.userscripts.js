// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.13
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
// @grant        GM.addStyle
// @run-at       document-start
// @inject-into  auto
// ==/UserScript==

(function() {
    'use strict';

    // Extract version from metadata at runtime
    const scriptMetaStr = GM.info.scriptMetaStr;
    const versionMatch = scriptMetaStr.match(/@version\s+(.+)/);
    const version = versionMatch ? versionMatch[1].trim() : 'unknown';
    const BASE_URL = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts@v' + version + '/public';

    const hostname = window.location.hostname;
    console.log('[Custom Styles] v' + version + ' | ' + hostname);

    function matchHostname(hostname, pattern) {
        const regex = pattern
            .replace(/^\*?:\/\//, '')
            .replace(/\/\*$/, '')
            .replace(/\./g, '.')
            .replace(/\*/g, '.*');
        return new RegExp('^' + regex + '$').test(hostname);
    }

    function loadCSS(file, css) {
        // 方案 1: 优先使用 GM.addStyle（扩展 API，最佳方案）
        if (typeof GM !== 'undefined' && GM.addStyle) {
            GM.addStyle(css)
                .then(() => console.log('[Custom Styles] CSS loaded via GM.addStyle:', file))
                .catch(() => fallbackLinkInject(file, css));
        } else {
            // GM.addStyle 不可用，直接使用 fallback
            fallbackLinkInject(file, css);
        }
    }

    // Fallback: 通过 <link data URI> 注入
    function fallbackLinkInject(file, css) {
        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'data:text/css;base64,' + btoa(unescape(encodeURIComponent(css)));
            document.head.appendChild(link);
            console.log('[Custom Styles] CSS loaded via <link> fallback:', file);
        } catch (e) {
            console.error('[Custom Styles] All injection methods failed for:', file, e);
        }
    }

    GM.xmlHttpRequest({
        method: 'GET',
        url: BASE_URL + '/domain.json',
        onload: function(response) {
            try {
                const config = JSON.parse(response.responseText);
                for (const rule of config.rules) {
                    for (const pattern of rule.match) {
                        if (matchHostname(hostname, pattern)) {
                            GM.xmlHttpRequest({
                                method: 'GET',
                                url: BASE_URL + '/styles/' + rule.file,
                                onload: function(res) {
                                    loadCSS(rule.file, res.responseText);
                                },
                                onerror: function() {
                                    console.error('[Custom Styles] Failed to load:', rule.file);
                                }
                            });
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error('[Custom Styles] Config error:', e.message);
            }
        },
        onerror: function() {
            console.error('[Custom Styles] Failed to load domain.json');
        }
    });
})();
