// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.12
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
// @inject-into  content
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
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        console.log('[Custom Styles] CSS loaded:', file);
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
