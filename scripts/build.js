#!/usr/bin/env node

// Build script for font customization userscript
// This script generates distribution files for both Tampermonkey and Userscripts
// It uses different header files for each platform while sharing the same core logic

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Generate dynamic matches
console.log('Generating dynamic matches...');
let generatedMatches;
try {
    generatedMatches = execSync('node scripts/generate-matches.js', { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8' 
    });
} catch (error) {
    console.warn('Failed to generate dynamic matches, using defaults');
    // Fallback to basic matches
    generatedMatches = `// ==UserScript==
// @match        *://*/*
// ==/UserScript==`;
}

// Read source files
const coreLogic = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
const tmHeaders = fs.readFileSync(path.join(__dirname, '..', 'templates', 'tampermonkey.headers'), 'utf8');
const userscriptsHeaders = fs.readFileSync(path.join(__dirname, '..', 'templates', 'userscripts.headers'), 'utf8');

// Build Tampermonkey version with dynamic matches
// Clean up the matches output and ensure proper formatting
const formattedMatches = generatedMatches
    .split('\n')
    .filter(line => line.trim() && !line.includes('==UserScript=='))
    .map(line => line.trim())
    .join('\n');

// Insert matches into Tampermonkey template
const tampermonkeyScript = tmHeaders.replace(
    'DYNAMIC_MATCHES_WILL_BE_INSERTED_HERE',
    formattedMatches
) + `\n\n${coreLogic}`;

// Build Userscripts version with same dynamic matches
const userscriptsScript = userscriptsHeaders.replace(
    'DYNAMIC_MATCHES_WILL_BE_INSERTED_HERE',
    formattedMatches
) + `\n\n${coreLogic}`;

// Write both versions
fs.writeFileSync(path.join(distDir, 'tampermonkey.js'), tampermonkeyScript);
fs.writeFileSync(path.join(distDir, 'userscripts.js'), userscriptsScript);

console.log('Build completed successfully!');
console.log('- Tampermonkey version: dist/tampermonkey.js');
console.log('- Userscripts version: dist/userscripts.js');