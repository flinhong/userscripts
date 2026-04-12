// ==UserScript==
// @name         Imgur Proxy
// @namespace    https://github.com/flinhong/userscripts
// @version      0.0.13
// @description  Proxy Imgur images to avoid 403 errors
// @author       Frank Lin
// @icon         https://frankindev.com/assets/img/logo.svg
// @match        *://*/*
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/imgur.userscripts.js
// @grant        none
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(function() {
    'use strict';

    const PROXY = 'https://cdn.frankindev.com/images/ddg/?u=';
    const IMGUR_RE = /^https?:\/\/(?:[a-z0-9-.]+\.)?imgur\.com\//i;

    const fixImage = (img) => {
        if (img.src && IMGUR_RE.test(img.src)) {
            img.src = PROXY + encodeURIComponent(img.src);
        }
        if (img.srcset) {
            const newSrcset = img.srcset.split(',').map(s => {
                const [url, dpr] = s.trim().split(' ');
                if (url && IMGUR_RE.test(url)) {
                    return PROXY + encodeURIComponent(url) + (dpr ? ' ' + dpr : '');
                }
                return s;
            }).join(', ');
            img.srcset = newSrcset;
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.tagName === 'IMG') {
                    fixImage(node);
                } else {
                    node.querySelectorAll?.('img').forEach(fixImage);
                }
            }
        }
    });

    document.querySelectorAll('img').forEach(fixImage);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();