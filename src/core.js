(function() {
    'use strict';

    // Base URLs - to be replaced during build process
    const CONFIG_BASE_URL = 'https://cdn.jsdelivr.net/gh/frank-zsy/userscripts@main/';
    const FONTS_CSS_URL = CONFIG_BASE_URL + 'styles/fonts.css';
    const SITE_CONFIG_URL = CONFIG_BASE_URL + 'styles/'; // Unified config URL
    const DOMAIN_MAP_URL = CONFIG_BASE_URL + 'domain-map.json';
    const VERSION_URL = CONFIG_BASE_URL + 'version.json';
    
    // Google Fonts mirror - using SJTU mirror for better performance in China
    const GOOGLE_FONTS_MIRROR = 'https://google-fonts.mirrors.sjtug.sjtu.edu.cn';
    
    // Cache for loaded resources
    const cache = new Map();
    const loadedFonts = new Set();
    
    // Domain mapping configuration
    let domainMap = {};
    
    // Version tracking
    let currentVersion = '1.0.0';
    
    // Initialize script
    async function init() {
        try {
            // Check for version updates
            await checkVersion();
            
            // Load domain mapping first
            await loadDomainMap();
            
            // Load site configuration (unified approach)
            await loadSiteConfiguration();
            
            // Setup observer for dynamic content
            setupMutationObserver();
        } catch (error) {
            console.error('Font Customizer Error:', error);
        }
    }
    
    // Check for version updates
    async function checkVersion() {
        try {
            const versionData = await fetchResource(VERSION_URL, true); // Skip cache
            if (versionData) {
                const versionInfo = JSON.parse(versionData);
                currentVersion = versionInfo.version || currentVersion;
            }
        } catch (error) {
            console.debug('No version info available');
        }
    }
    
    // Load domain mapping configuration
    async function loadDomainMap() {
        try {
            const mapContent = await fetchResource(DOMAIN_MAP_URL);
            if (mapContent) {
                domainMap = JSON.parse(mapContent);
            }
        } catch (error) {
            console.warn('Failed to load domain map:', error);
            // Use default empty map
            domainMap = {};
        }
    }
    
    // Get configuration URLs for current domain
    function getConfigUrls(hostname) {
        const urls = [];
        const baseUrl = SITE_CONFIG_URL;
        
        // Add version parameter to bust cache when needed
        const versionParam = `v=${currentVersion}`;
        
        // 1. Check domain mapping first
        if (domainMap[hostname]) {
            const mappedDomains = Array.isArray(domainMap[hostname]) 
                ? domainMap[hostname] 
                : [domainMap[hostname]];
            
            mappedDomains.forEach(domain => {
                urls.push(`${baseUrl}${domain}.css?${versionParam}`);
            });
        }
        
        // 2. Exact match
        urls.push(`${baseUrl}${hostname}.css?${versionParam}`);
        
        // 3. Domain level matches (remove subdomains)
        const parts = hostname.split('.');
        for (let i = 1; i < parts.length - 1; i++) {
            const domain = parts.slice(i).join('.');
            urls.push(`${baseUrl}${domain}.css?${versionParam}`);
        }
        
        // 4. Wildcard fallback
        urls.push(`${baseUrl}default.css?${versionParam}`);
        
        return urls;
    }
    
    // Load site configuration (unified approach)
    async function loadSiteConfiguration() {
        const urls = getConfigUrls(window.location.hostname);
        await loadFirstAvailableResource(urls, (cssContent) => {
            // Extract and load Google Fonts
            const googleFonts = extractGoogleFonts(cssContent);
            loadGoogleFonts(googleFonts);
            
            // Apply all styles
            applyStyles(cssContent);
        });
    }
    
    // Load global font definitions
    async function loadGlobalFonts() {
        try {
        // Add version parameter to fonts CSS URL
        const versionParam = `v=${currentVersion}`;
        const fontsCssUrl = `${FONTS_CSS_URL}?${versionParam}`;
        
        const fontsCss = await fetchResource(fontsCssUrl);
        if (fontsCss) {
            // Extract and load Google Fonts in parallel with style application
            const googleFonts = extractGoogleFonts(fontsCss);
            const fontLoadPromise = loadGoogleFonts(googleFonts);
            
            // Apply font definitions immediately
            applyStyles(fontsCss);
            
            // Wait for fonts to load
            await fontLoadPromise;
        }
        } catch (error) {
            console.warn('Failed to load global fonts:', error);
        }
    }
    
    // Apply styles to document
    function applyStyles(cssContent) {
        // This function will be implemented differently for Tampermonkey vs Safari
        if (typeof GM_addStyle !== 'undefined') {
            // Tampermonkey version
            GM_addStyle(cssContent);
        } else {
            // Safari version
            if (document.head) {
                const style = document.createElement('style');
                style.textContent = cssContent;
                document.head.appendChild(style);
            } else {
                // Wait for head to be available
                const observer = new MutationObserver(() => {
                    if (document.head) {
                        observer.disconnect();
                        const style = document.createElement('style');
                        style.textContent = cssContent;
                        document.head.appendChild(style);
                    }
                });
                
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
        }
    }
    
    // Load first available resource
    async function loadFirstAvailableResource(urls, onSuccess) {
        for (const url of urls) {
            try {
                const content = await fetchResource(url);
                if (content) {
                    onSuccess(content);
                    return true;
                }
            } catch (error) {
                continue;
            }
        }
        return false;
    }
    
    // Fetch resource with caching
    function fetchResource(url, skipCache = false) {
        // Return cached version if available and not skipping cache
        if (!skipCache && cache.has(url)) {
            return Promise.resolve(cache.get(url));
        }
        
        // Different implementation for Tampermonkey vs Safari
        if (typeof GM_xmlhttpRequest !== 'undefined') {
            // Tampermonkey version
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: function(response) {
                        if (response.status === 200) {
                            if (!skipCache) {
                                cache.set(url, response.responseText);
                            }
                            resolve(response.responseText);
                        } else {
                            resolve(null);
                        }
                    },
                    onerror: function(error) {
                        console.warn(`Failed to fetch ${url}:`, error);
                        resolve(null);
                    }
                });
            });
        } else {
            // Safari version
            return fetch(url)
                .then(response => {
                    if (response.ok) {
                        return response.text();
                    }
                    return null;
                })
                .then(text => {
                    if (text && !skipCache) {
                        cache.set(url, text);
                    }
                    return text;
                })
                .catch(error => {
                    console.warn(`Failed to fetch ${url}:`, error);
                    return null;
                });
        }
    }
    
    // Extract Google Fonts from CSS comments
    function extractGoogleFonts(cssContent) {
        const fontImports = [];
        const importRegex = /\/\*\s*google-font:\s*([^\*]+)\s*\*\//gi;
        let match;
        
        while ((match = importRegex.exec(cssContent)) !== null) {
            fontImports.push(match[1].trim());
        }
        
        return fontImports;
    }
    
    // Load Google Fonts with mirror support
    async function loadGoogleFonts(fontNames) {
        const newFonts = fontNames.filter(fontName => !loadedFonts.has(fontName));
        
        if (newFonts.length === 0) return;
        
        const promises = newFonts.map(fontName => {
            return new Promise((resolve) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                // Use mirror for Google Fonts
                const fontPath = encodeURIComponent(fontName.replace(/ /g, '+'));
                link.href = `${GOOGLE_FONTS_MIRROR}/css2?family=${fontPath}&display=swap`;
                
                link.onload = () => {
                    loadedFonts.add(fontName);
                    resolve(true);
                };
                
                link.onerror = () => {
                    console.warn(`Failed to load Google Font: ${fontName}`);
                    // Try fallback to original Google Fonts if mirror fails
                    if (!link.fallbackAttempted) {
                        link.fallbackAttempted = true;
                        link.href = `https://fonts.googleapis.com/css2?family=${fontPath}&display=swap`;
                        // Don't add to loadedFonts yet, wait for fallback result
                    } else {
                        // Both mirror and fallback failed, mark as loaded to prevent retry
                        loadedFonts.add(fontName);
                        resolve(false);
                    }
                };
                
                document.head.appendChild(link);
            });
        });
        
        return Promise.allSettled(promises);
    }
    
    // Setup mutation observer for dynamic content
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            // Most CSS changes will automatically apply to new elements
        });
        
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }
    
    // Start the script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();