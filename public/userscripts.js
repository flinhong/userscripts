// ==UserScript==
// @name         Custom Font Styler
// @namespace    http://tampermonkey.net/
// @version      0.1.9
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

    const SCRIPT_NAME = 'userscripts.js';
    const FONT_URL = 'https://cdn.frankindev.com/fonts/g/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Serif+SC:wght@200..900&family=Outfit:wght@100..900&display=swap';

    /**
     * State and Configuration
     */
    let domainConfig = null;
    const info = typeof GM_info !== 'undefined' ? GM_info : {};
    const version = info.script ? info.script.version : 'unknown';

    // Derive CDN base from metadata
    let cdnBase = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts';
    if (info.scriptMetaStr) {
        const match = info.scriptMetaStr.match(/@updateURL\s+(\S+)/);
        if (match) {
            cdnBase = match[1].replace(new RegExp(`/public/${SCRIPT_NAME}$`), '');
        }
    }

    const configUrl = `${cdnBase}@v${version}/public/domain.jsonp`;
    const cssBaseUrl = `${cdnBase}@v${version}/public/styles`;

    /**
     * Helpers
     */
    const log = (...args) => console.log('[CFS]', ...args);
    const error = (...args) => console.error('[CFS]', ...args);

    const injectStyle = (css) => {
        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(css);
        } else {
            const style = document.createElement('style');
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        }
    };

    const fetchText = (url) => {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'undefined') {
                return fetch(url).then(r => r.text()).then(resolve).catch(reject);
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: (res) => res.status === 200 ? resolve(res.responseText) : reject(res),
                onerror: reject
            });
        });
    };

    /**
     * Logic
     */
    window.domainConfigCallback = (config) => {
        domainConfig = config;
        log('Config loaded:', config.rules.length, 'rules');
        applyStylesheet();
    };

    function getMatchingRule() {
        if (!domainConfig) return null;
        const hostname = window.location.hostname;
        return domainConfig.rules.find(rule => {
            const patterns = rule.domains || rule.match || [];
            return patterns.some(p => {
                const pHost = (p.match(/\*:\/\/([^\/]+)/) || [])[1];
                return pHost && (hostname === pHost || hostname.endsWith('.' + pHost.replace(/\*\./, '')));
            });
        });
    }

    async function applyStylesheet() {
        const rule = getMatchingRule();
        if (!rule) return;

        try {
            const css = await fetchText(`${cssBaseUrl}/${rule.file}`);
            injectStyle(css);
            log('Applied style:', rule.file);
        } catch (e) {
            error('Failed to apply style:', e);
        }
    }

    async function loadFonts() {
        const rule = getMatchingRule();
        // Check if fonts are explicitly disabled in rule
        if (rule && rule.fonts === false) return;

        try {
            if (typeof GM_getResourceText !== 'undefined') {
                try {
                    const fonts = GM_getResourceText('fonts');
                    if (fonts) {
                        injectStyle(fonts);
                        log('Loaded fonts via @resource');
                        return;
                    }
                } catch (e) {}
            }
            const fonts = await fetchText(FONT_URL);
            injectStyle(fonts);
            log('Loaded fonts via fetch');
        } catch (e) {
            error('Failed to load fonts:', e);
        }
    }

    async function init() {
        if (typeof GM_getResourceText !== 'undefined') {
            try {
                const configText = GM_getResourceText('config');
                if (configText) {
                    eval(configText);
                    log('Loaded config via @resource');
                }
            } catch (e) {
                error('Failed to load config via @resource:', e);
            }
        }

        if (!domainConfig) {
            try {
                const configText = await fetchText(configUrl);
                eval(configText);
                log('Loaded config via fetch');
            } catch (e) {
                error('Failed to load config:', e);
            }
        }

        loadFonts();
    }

    init();
})();
