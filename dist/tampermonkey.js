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
// @grant         GM_addStyle
// @grant         GM_getResourceText
// @downloadURL   https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/tampermonkey.js
// @updateURL     https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/tampermonkey.meta.js
// @resource      css_github https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/styles/github.css
// @resource      css_bing https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/styles/bing.css
// @resource      css_google https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/styles/google.css
// @resource      css_chatgpt https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/styles/chatgpt.css
// ==/UserScript==


(function tampermonkeyCore() {
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

    // Map domain to resource key
    function getResourceKey(domain) {
        // Domain is already processed and standardized, use it directly
        return domain;
    }

    try {
        const resourceKey = getResourceKey(domain);
        const styleContent = GM_getResourceText("css_" + resourceKey);
        if (styleContent) {
            GM_addStyle(styleContent);
        }
    } catch (e) {
        // Resource not found, do nothing
    }
});

tampermonkeyCore();