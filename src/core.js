// Tampermonkey version: Use GM APIs
function tampermonkeyCore() {
    'use strict';

    // Extract main domain name for CSS resource lookup (elegant approach)
    const domain = (function() {
        const [, ...parts] = window.location.hostname.replace(/^www\./, "").split('.');
        const len = parts.length;
        
        // Handle special TLD patterns (.co.xx, .com.xx)
        const specialTLDs = ['co', 'com'];
        const isSpecialTLD = len >= 2 && specialTLDs.includes(parts[len - 2]);
        
        return isSpecialTLD ? parts[len - 3] : parts[len - 2] || parts[0];
    })();

    // Map domain to resource key
    function getResourceKey(domain) {
        // Domain is already processed and standardized, use it directly
        return domain;
    }

    try {
        const resourceKey = getResourceKey(domain);
        const styleFont = GM_getResourceText("css_" + resourceKey);
        if (styleFont) {
            GM_addStyle(styleFont);
        }
    } catch (e) {
        // Resource not found, do nothing
    }
}

// Userscripts version: Use standard Web APIs
function userscriptsCore() {
    'use strict';

    // Extract main domain name for CSS resource lookup (elegant approach)
    const domain = (function() {
        const [, ...parts] = window.location.hostname.replace(/^www\./, "").split('.');
        const len = parts.length;
        
        // Handle special TLD patterns (.co.xx, .com.xx)
        const specialTLDs = ['co', 'com'];
        const isSpecialTLD = len >= 2 && specialTLDs.includes(parts[len - 2]);
        
        return isSpecialTLD ? parts[len - 3] : parts[len - 2] || parts[0];
    })();

    // Function to inject CSS via link tag
    function injectCss(cssContent) {
        const style = document.createElement('style');
        style.textContent = cssContent;
        document.head.appendChild(style);
    }

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
            const cssUrl = `https://cdn.jsdelivr.net/gh/flinhong/userscripts/dist/styles/${domain}.css`;
            injectCssLink(cssUrl);
        }
    }

    loadDomainCss();
}
