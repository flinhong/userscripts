const fs = require('fs')
const path = require('path')

// Read configuration files
const domainConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../configs/domain.json'), 'utf-8'),
)
const versionConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../configs/version.json'), 'utf-8'),
)
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
)

const version = versionConfig.version
const repoOwner = 'flinhong'
const repoName = 'userscripts'
const cdnBase =
  'https://cdn.honglin.ac.cn/statically/gh/' + repoOwner + '/' + repoName
const cssBaseUrl = cdnBase + '/configs/styles'

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Generate domain.jsonp for public directory
const domainJsonp =
  'domainConfig(' + JSON.stringify(domainConfig, null, 2) + ');'
fs.writeFileSync(path.join(__dirname, '../public/domain.jsonp'), domainJsonp)

// Generate tampermonkey.js
const matchRules = domainConfig.rules.flatMap(function (rule) {
  return rule.domains || rule.match || []
})
const uniqueMatches = [...new Set(matchRules)]

let tampermonkeyHeader = '// ==UserScript==\n'
tampermonkeyHeader += '// @name         Custom Font Styler\n'
tampermonkeyHeader += '// @namespace    http://tampermonkey.net/\n'
tampermonkeyHeader += '// @version      ' + version + '\n'
tampermonkeyHeader +=
  '// @description  Apply custom fonts and styles to various websites\n'
tampermonkeyHeader += '// @author       flinhong\n'
tampermonkeyHeader +=
  '// @homepage     https://github.com/' + repoOwner + '/' + repoName + '\n'
tampermonkeyHeader +=
  '// @supportURL   https://github.com/' +
  repoOwner +
  '/' +
  repoName +
  '/issues\n'
tampermonkeyHeader +=
  '// @updateURL    ' + cdnBase + '/public/tampermonkey.js\n'
tampermonkeyHeader +=
  '// @downloadURL  ' + cdnBase + '/public/tampermonkey.js\n'
uniqueMatches.forEach(function (match) {
  tampermonkeyHeader += '// @match        ' + match + '\n'
})
tampermonkeyHeader += '// @grant        GM_xmlhttpRequest\n'
tampermonkeyHeader += '// @grant        GM_addStyle\n'
tampermonkeyHeader += '// @run-at       document-start\n'
tampermonkeyHeader += '// ==/UserScript=='

let userScriptBody = '\n\n(function() {\n'
userScriptBody += "    'use strict';\n\n"
userScriptBody += '    let domainConfig = null;\n'
userScriptBody +=
  "    const configUrl = '" + cdnBase + "/public/domain.jsonp';\n"
userScriptBody += "    const cssBaseUrl = '" + cssBaseUrl + "';\n\n"
userScriptBody += '    // JSONP callback function\n'
userScriptBody += '    window.domainConfig = function(config) {\n'
userScriptBody += '        domainConfig = config;\n'
userScriptBody +=
  "        console.log('[Custom Font Styler] Config loaded:', config.rules.length, 'rules');\n"
userScriptBody +=
  "        console.log('[Custom Font Styler] Current hostname:', window.location.hostname);\n"
userScriptBody += '        applyStylesheet();\n'
userScriptBody += '    };\n\n'
userScriptBody += '    // Convert @match pattern to regex\n'
userScriptBody += '    function matchPatternToRegex(pattern) {\n'
userScriptBody += "        let regex = '^' + pattern\n"
userScriptBody += "            .replace(/\\*/g, '.*')\n"
userScriptBody += "            .replace(/\\./g, '\\\\.');\n"
userScriptBody += '        return new RegExp(regex);\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Get matching CSS file for current URL\n'
userScriptBody += '    function getMatchingStylesheet() {\n'
userScriptBody +=
  '        if (!domainConfig || !domainConfig.rules) return null;\n\n'
userScriptBody += '        const fullUrl = window.location.href;\n\n'
userScriptBody += '        for (const rule of domainConfig.rules) {\n'
userScriptBody +=
  '            const patterns = rule.domains || rule.match || [];\n'
userScriptBody += '            for (const pattern of patterns) {\n'
userScriptBody +=
  '                const regex = matchPatternToRegex(pattern);\n'
userScriptBody += '                if (regex.test(fullUrl)) {\n'
userScriptBody += '                    return rule.file;\n'
userScriptBody += '                }\n'
userScriptBody += '            }\n'
userScriptBody += '        }\n'
userScriptBody += '        return null;\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Apply stylesheet\n'
userScriptBody += '    function applyStylesheet() {\n'
userScriptBody += '        const cssFile = getMatchingStylesheet();\n'
userScriptBody += '        if (!cssFile) return;\n\n'
userScriptBody += "        const cssUrl = cssBaseUrl + '/' + cssFile;\n\n"
userScriptBody += "        if (typeof GM_addStyle !== 'undefined') {\n"
userScriptBody += '            fetch(cssUrl)\n'
userScriptBody += '                .then(response => response.text())\n'
userScriptBody += '                .then(css => {\n'
userScriptBody += '                    GM_addStyle(css);\n'
userScriptBody +=
  "                    console.log('[Custom Font Styler] Loaded:', cssFile, 'for', window.location.hostname);\n"
userScriptBody += '                })\n'
userScriptBody += '                .catch(err => {\n'
userScriptBody +=
  "                    console.error('[Custom Font Styler] Failed to load:', err);\n"
userScriptBody += '                });\n'
userScriptBody += '        } else {\n'
userScriptBody += "            const link = document.createElement('link');\n"
userScriptBody += "            link.rel = 'stylesheet';\n"
userScriptBody += '            link.href = cssUrl;\n'
userScriptBody +=
  '            (document.head || document.documentElement).appendChild(link);\n'
userScriptBody += '        }\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Load config via GM_xmlhttpRequest (supports CORS)\n'
userScriptBody += '    function loadConfig() {\n'
userScriptBody += '        GM_xmlhttpRequest({\n'
userScriptBody += "            method: 'GET',\n"
userScriptBody += '            url: configUrl,\n'
userScriptBody += '            onload: function(response) {\n'
userScriptBody += '                try {\n'
userScriptBody += '                    eval(response.responseText);\n'
userScriptBody += '                } catch (e) {\n'
userScriptBody +=
  "                    console.error('[Custom Font Styler] Failed to load config:', e);\n"
userScriptBody += '                }\n'
userScriptBody += '            },\n'
userScriptBody += '            onerror: function() {\n'
userScriptBody +=
  "                console.error('[Custom Font Styler] Failed to fetch config');\n"
userScriptBody += '            }\n'
userScriptBody += '        });\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Initialize\n'
userScriptBody += '    loadConfig();\n'
userScriptBody += '})();\n'

const tampermonkeyScript = tampermonkeyHeader + userScriptBody

fs.writeFileSync(
  path.join(__dirname, '../public/tampermonkey.js'),
  tampermonkeyScript,
)

console.log('✓ Build completed!')
console.log('  Version: ' + version)
console.log('  Generated: public/tampermonkey.js')
console.log('  Generated: public/domain.jsonp')
console.log('  CDN URL: ' + cdnBase + '/public/tampermonkey.js')
