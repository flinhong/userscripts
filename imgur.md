```js
(function() {
  'use strict';

  const PROXY = 'https://proxy.duckduckgo.com/iu/?u=';
  const IS_IMGUR = /^https?:\/\/(?:[a-z0-9-.]+\.)?imgur\.com\//i;

  const fixImage = (img) => {
    if (!img || img.tagName !== 'IMG' || !img.src) return;
    
    // Check if it's an imgur link and not already proxied
    if (IS_IMGUR.test(img.src) && !img.src.startsWith(PROXY)) {
      // Use encodeURIComponent for safety with the proxy URL
      img.src = PROXY + encodeURIComponent(img.src);
    }
  };

  // Observe early for all added nodes (MutationObserver)
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            fixImage(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('img').forEach(fixImage);
          }
        }
      });
    }
  });

  // Start observing as soon as possible
  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true
  });

  // Initial pass for any images already in the DOM
  const runInitialPass = () => {
    document.querySelectorAll('img').forEach(fixImage);
  };

  if (document.readyState !== 'loading') {
    runInitialPass();
  } else {
    document.addEventListener('DOMContentLoaded', runInitialPass);
  }
})();
```
