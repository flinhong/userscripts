// ==UserScript==
// @name          Enhanced Font Customizer
// @namespace     https://github.com/flinhong/userscripts
// @version       1.0.0
// @description   根据用户需求，自定义网页字体风格，提升阅读体验。
// @author        flinhong
// @match         *://*.bing.com/*
// @match         *://*.chatgpt.com/*
// @match         *://*.github.com/*
// @match         *://*.google.co.uk/*
// @match         *://*.google.com.hk/*
// @match         *://*.google.com/*
// @match         *://*.google.de/*
// @match         *://bing.com/*
// @match         *://chatgpt.com/*
// @match         *://github.com/*
// @match         *://google.co.uk/*
// @match         *://google.com.hk/*
// @match         *://google.com/*
// @match         *://google.de/*
// @run-at        document-start
// @downloadURL   https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/userscripts.js
// @updateURL     https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/userscripts.meta.js
// ==/UserScript==


(function userscriptsCore(cssBaseUrl) {
    'use strict';

    // Extract main domain name for CSS resource lookup (elegant approach)
    const domain = (function() {
        // Correctly split hostname into parts
        const parts = window.location.hostname.replace(/^www\./, "").split('.');
        const len = parts.length;
        
        // Handle TLDs like .co.uk, .com.au, etc.
        // A simple heuristic for ccSLDs (country-code second-level domains).
        const specialTLDs = ['co', 'com'];
        const isSpecialTLD = len >= 3 && specialTLDs.includes(parts[len - 2]);
        
        if (len === 1) {
            // Handles 'localhost' or other single-word hostnames
            return parts[0];
        }
        
        // For isSpecialTLD (e.g., news.google.co.uk), return the part before the ccSLD ('google').
        // For normal subdomains (e.g., news.google.com), return the part before the TLD ('google').
        // For base domains (e.g., google.com), also return the part before the TLD ('google').
        return isSpecialTLD ? parts[len - 3] : parts[len - 2];
    })();

    // Function to inject CSS via external link
    function injectCssLink(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        document.head.appendChild(link);
    }

    // Load CSS based on domain
    function loadDomainCss() {
        // Domain is already processed and standardized, use it directly
        if (domain) {
            const cssUrl = `${cssBaseUrl}${domain}.css`;
            injectCssLink(cssUrl);
        }
    }

    loadDomainCss();
});

userscriptsCore("https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/styles/");