// ==UserScript==
// @name         Imgur Proxy Fix
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.8
// @description  Proxy Imgur images to avoid 403 errors (DuckDuckGo Proxy)
// @author       Frank Lin
// @icon         https://frankindev.com/assets/img/logo.svg
// @match        *://*/*
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const PROXY = 'https://proxy.duckduckgo.com/iu/?u=';
    const IS_IMGUR = /^https?:\/\/(?:[a-z0-9-.]+\.)?imgur\.com\//i;

    const fixImage = (img) => {
        const src = img.src || img.srcset;
        if (src && IS_IMGUR.test(src)) {
            const url = src.split(' ')[0];
            img.src = PROXY + encodeURIComponent(url);
            if (img.srcset) {
                img.srcset = img.srcset.split(',').map(s => {
                    const [url, dpr] = s.trim().split(' ');
                    return IS_IMGUR.test(url) ? (PROXY + encodeURIComponent(url) + (dpr ? ' ' + dpr : '')) : s;
                }).join(', ');
            }
        }
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'IMG') fixImage(node);
                else if (node.querySelectorAll) {
                    node.querySelectorAll('img').forEach(fixImage);
                }
            });
        });
    });

    document.querySelectorAll('img').forEach(fixImage);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();