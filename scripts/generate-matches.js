const fs = require('fs');
const path = require('path');

// Read domain mappings
const domainMapPath = path.join(__dirname, '..', 'configs', 'domain-map.json');
const domainMap = JSON.parse(fs.readFileSync(domainMapPath, 'utf8'));

// Generate match patterns for explicitly configured domains only
const directDomainMatches = [];
const patternDomainMatches = [];

Object.keys(domainMap).forEach(domain => {
  if (domain.includes('*')) {
    // Handle wildcard domains (like *.wikipedia.org)
    patternDomainMatches.push(`*://${domain.replace(/\./g, '\\.').replace(/\*/g, '.*')}/*`);
  } else {
    // For explicit domains, create precise match patterns
    directDomainMatches.push(`*://${domain}/*`);
  }
});

// Combine direct and pattern matches
const allDomainMatches = [...directDomainMatches, ...patternDomainMatches];

// Output the matches for Tampermonkey
allDomainMatches.forEach(match => {
  console.log(`// @match        ${match}`);
});