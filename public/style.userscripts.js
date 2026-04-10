// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.1
// @description  Apply custom fonts and styles to supported websites
// @author       flinhong
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
// @grant        GM.addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const BASE_URL = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts/@v0.0.1/public';

    const hostname = window.location.hostname;

    function matchesPattern(hostname, pattern) {
        const regex = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp('^' + regex + '$').test('https://' + hostname);
    }

    function loadCSS(file) {
        GM.xmlHttpRequest({
            method: 'GET',
            url: BASE_URL + '/styles/' + file,
            onload: function(response) {
                GM.addStyle(response.responseText);
            }
        });
    }

    GM.xmlHttpRequest({
        method: 'GET',
        url: BASE_URL + '/domain.json',
        onload: function(response) {
            const config = JSON.parse(response.responseText);
            for (const rule of config.rules) {
                for (const pattern of rule.match) {
                    if (matchesPattern(hostname, pattern)) {
                        loadCSS(rule.file);
                        return;
                    }
                }
            }
        }
    });
})();
