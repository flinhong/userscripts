(function() {
    'use strict';

    const version = '__VERSION__';
    const domainMap = __DOMAIN_MAP__;
    const sortedDomainKeys = __SORTED_DOMAIN_KEYS__;

    function getCssFileName() {
        const hostname = window.location.hostname;

        // Try exact match first
        if (domainMap[hostname]) {
            return domainMap[hostname];
        }

        // Then try endsWith for subdomains, longest first
        for (const key of sortedDomainKeys) {
            if (hostname.endsWith(key)) {
                return domainMap[key];
            }
        }
        return 'default';
    }

    function getCssUrl(fileName) {
        return `https://cdn.jsdelivr.net/gh/flinhong/userscripts@${version}/dist/styles/${fileName}.css`;
    }

    function addStyle(css) {
        if (typeof GM_addStyle === 'function') {
            GM_addStyle(css);
        } else {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    const cssFileName = getCssFileName();
    const cssUrl = getCssUrl(cssFileName);

    fetch(cssUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch CSS: ${response.statusText}`);
            }
            return response.text();
        })
        .then(css => {
            addStyle(css);
        })
        .catch(err => console.error('Failed to load custom styles:', err));

})();
