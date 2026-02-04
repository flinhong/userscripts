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
  'https://cdn.frankindev.com/statically/gh/' + repoOwner + '/' + repoName
const cssBaseUrl = cdnBase + '/public/styles'

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Copy CSS files from configs/styles to public/styles
const sourceStylesDir = path.join(__dirname, '../configs/styles')
const targetStylesDir = path.join(__dirname, '../public/styles')
if (!fs.existsSync(targetStylesDir)) {
  fs.mkdirSync(targetStylesDir, { recursive: true })
}

// Function to extract hostname from @match pattern
function extractHostname(pattern) {
  const match = pattern.match(/\*:\/\/([^\/]+)/)
  if (match) {
    return match[1].replace(/\*/g, 'www')
  }
  return null
}

// Copy original CSS files to public/styles
const cssFiles = fs.readdirSync(sourceStylesDir).filter(function (file) {
  return file.endsWith('.css')
})

cssFiles.forEach(function (cssFile) {
  const sourcePath = path.join(sourceStylesDir, cssFile)
  const targetPath = path.join(targetStylesDir, cssFile)
  fs.copyFileSync(sourcePath, targetPath)
})

// Create domain-specific CSS copies based on domain.json rules
domainConfig.rules.forEach(function (rule) {
  const sourceCssFile = rule.file
  const sourceCssPath = path.join(sourceStylesDir, sourceCssFile)

  if (!fs.existsSync(sourceCssPath)) {
    console.warn('  Warning: CSS file not found:', sourceCssFile)
    return
  }

  const cssContent = fs.readFileSync(sourceCssPath, 'utf-8')

  const domains = rule.domains || rule.match || []
  domains.forEach(function (domainPattern) {
    const hostname = extractHostname(domainPattern)
    if (hostname) {
      const domainCssFile = hostname + '.css'
      const targetCssPath = path.join(targetStylesDir, domainCssFile)
      fs.writeFileSync(targetCssPath, cssContent)
    }
  })
})

// Generate domain.jsonp for public directory
const domainJsonp =
  'domainConfigCallback(' + JSON.stringify(domainConfig, null, 2) + ');'
fs.writeFileSync(
  path.join(__dirname, '../public/domain.' + version + '.jsonp'),
  domainJsonp
)

// Generate tampermonkey.js
const matchRules = domainConfig.rules.flatMap(function (rule) {
  return rule.domains || rule.match || []
})
const uniqueMatches = [...new Set(matchRules)]

// Generate userscripts.js (Safari compatible)
let userscriptHeader = '// ==UserScript==\n'
userscriptHeader += '// @name         Custom Font Styler\n'
userscriptHeader += '// @namespace    http://tampermonkey.net/\n'
userscriptHeader += '// @version      ' + version + '\n'
userscriptHeader +=
  '// @description  Apply custom fonts and styles to various websites\n'
userscriptHeader += '// @author       flinhong\n'
userscriptHeader +=
  '// @homepage     https://github.com/' + repoOwner + '/' + repoName + '\n'
userscriptHeader +=
  '// @supportURL   https://github.com/' +
  repoOwner +
  '/' +
  repoName +
  '/issues\n'
userscriptHeader +=
  '// @updateURL    ' + cdnBase + '/public/userscripts.js\n'
userscriptHeader +=
  '// @downloadURL  ' + cdnBase + '/public/userscripts.js\n'
userscriptHeader += '// @icon         https://cdn.frankindev.com/favicon.ico\n'
uniqueMatches.forEach(function (match) {
  userscriptHeader += '// @match        ' + match + '\n'
})
userscriptHeader += '// @grant        GM_xmlhttpRequest\n'
userscriptHeader += '// @grant        GM_addStyle\n'
userscriptHeader += '// @run-at       document-start\n'
userscriptHeader += '// ==/UserScript=='

// Generate tampermonkey.js with @resource
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
tampermonkeyHeader += '// @icon         https://cdn.frankindev.com/favicon.ico\n'
tampermonkeyHeader +=
  '// @resource     config ' +
  cdnBase +
  '/public/domain.' +
  version +
  '.jsonp\n'
uniqueMatches.forEach(function (match) {
  tampermonkeyHeader += '// @match        ' + match + '\n'
})
tampermonkeyHeader += '// @grant        GM_getResourceURL\n'
tampermonkeyHeader += '// @grant        GM_getResourceText\n'
tampermonkeyHeader += '// @grant        GM_addStyle\n'
tampermonkeyHeader += '// @run-at       document-start\n'
tampermonkeyHeader += '// ==/UserScript=='

let userScriptBody = '\n\n(function() {\n'
userScriptBody += "    'use strict';\n\n"
userScriptBody += '    const scriptVersion = typeof GM_info !== \'undefined\' ? GM_info.script.version : \'unknown\';\n'
userScriptBody += '    let domainConfig = null;\n'
userScriptBody += "    // Parse CDN base URL from @updateURL in GM_info\n"
userScriptBody += "    let cdnBase = '';\n"
userScriptBody += "    if (typeof GM_info !== 'undefined' && GM_info.scriptMetaStr) {\n"
userScriptBody += "        const updateUrlMatch = GM_info.scriptMetaStr.match(/@updateURL\\s+(\\S+)/);\n"
userScriptBody += "        if (updateUrlMatch) {\n"
userScriptBody += "            cdnBase = updateUrlMatch[1].replace(/\\/public\\/userscripts\\.js$/, '');\n"
userScriptBody += "        }\n"
userScriptBody += "    }\n"
userScriptBody += "    const configUrl = cdnBase + '/public/domain.' + scriptVersion + '.jsonp';\n"
userScriptBody += "    const cssBaseUrl = cdnBase + '/public/styles';\n\n"

userScriptBody += '    // JSONP callback function\n'
userScriptBody += '    window.domainConfigCallback = function(config) {\n'
userScriptBody += '        domainConfig = config;\n'
userScriptBody +=
  "        console.log('[CFS] Config loaded:', config.rules.length, 'rules');\n"
userScriptBody += '        applyStylesheet();\n'
userScriptBody += '    };\n\n'
userScriptBody += '    // Extract hostname from @match pattern\n'
userScriptBody += '    function extractHostnameFromPattern(pattern) {\n'
userScriptBody += '        const match = pattern.match(/\\*:\\/\\/([^\\/]+)/);\n'
userScriptBody += '        return match ? match[1] : null;\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Get matching CSS file for current URL\n'
userScriptBody += '    function getMatchingStylesheet() {\n'
userScriptBody +=
  '        if (!domainConfig || !domainConfig.rules) return null;\n\n'
userScriptBody += '        const hostname = window.location.hostname;\n'
userScriptBody += '        for (const rule of domainConfig.rules) {\n'
userScriptBody +=
  '            const patterns = rule.domains || rule.match || [];\n'
userScriptBody += '            for (const pattern of patterns) {\n'
userScriptBody +=
  '                const patternHostname = extractHostnameFromPattern(pattern);\n'
userScriptBody += '                if (hostname === patternHostname || hostname.endsWith("." + patternHostname)) {\n'
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
userScriptBody += "        const cssUrl = cssBaseUrl + '/' + cssFile;\n"
userScriptBody += "        if (typeof GM_addStyle !== 'undefined') {\n"
userScriptBody += '            fetch(cssUrl)\n'
userScriptBody += '                .then(response => response.text())\n'
userScriptBody += '                .then(css => {\n'
userScriptBody += '                    GM_addStyle(css);\n'
userScriptBody +=
  "                    console.log('[CFS] Loaded:', cssFile, 'for', window.location.hostname);\n"
userScriptBody += '                })\n'
userScriptBody += '                .catch(err => {\n'
userScriptBody +=
  "                    console.error('[CFS] Failed to load:', err);\n"
userScriptBody += '                });\n'
userScriptBody += '        } else {\n'
userScriptBody += "            const link = document.createElement('link');\n"
userScriptBody += "            link.rel = 'stylesheet';\n"
userScriptBody += '            link.href = cssUrl;\n'
userScriptBody +=
  '            (document.head || document.documentElement).appendChild(link);\n'
userScriptBody += '        }\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Load config - try @resource first, fallback to GM_xmlhttpRequest\n'
userScriptBody += '    function loadConfig() {\n'
userScriptBody += "        if (typeof GM_getResourceText !== 'undefined') {\n"
userScriptBody += "            // Tampermonkey with @resource support\n"
userScriptBody += "            try {\n"
userScriptBody += "                const configText = GM_getResourceText('config');\n"
userScriptBody += "                eval(configText);\n"
userScriptBody += "                console.log('[CFS] Loaded config from @resource');\n"
userScriptBody += "            } catch (e) {\n"
userScriptBody += "                console.error('[CFS] Failed to load @resource:', e);\n"
userScriptBody += "                loadConfigFallback();\n"
userScriptBody += "            }\n"
userScriptBody += "        } else if (typeof GM_xmlhttpRequest !== 'undefined') {\n"
userScriptBody += "            // Fallback for Safari/others\n"
userScriptBody += "            loadConfigFallback();\n"
userScriptBody += "        }\n"
userScriptBody += "    }\n\n"
userScriptBody += '    // Fallback: load config via GM_xmlhttpRequest\n'
userScriptBody += '    function loadConfigFallback() {\n'
userScriptBody += "        console.log('[CFS] Loading config from:', configUrl);\n"
userScriptBody += '        GM_xmlhttpRequest({\n'
userScriptBody += "            method: 'GET',\n"
userScriptBody += '            url: configUrl,\n'
userScriptBody += '            onload: function(response) {\n'
userScriptBody += '                if (response.status !== 200) {\n'
userScriptBody +=
  "                    console.error('[CFS] HTTP error:', response.status, response.statusText);\n"
userScriptBody += '                    return;\n'
userScriptBody += '                }\n'
userScriptBody += '                try {\n'
userScriptBody += '                    eval(response.responseText);\n'
userScriptBody +=
  "                    console.log('[CFS] Loaded config from CDN');\n"
userScriptBody += '                } catch (e) {\n'
userScriptBody +=
  "                    console.error('[CFS] Failed to load config:', e);\n"
userScriptBody += '                }\n'
userScriptBody += '            },\n'
userScriptBody += '            onerror: function(err) {\n'
userScriptBody +=
  "                    console.error('[CFS] Network error:', err);\n"
userScriptBody += '            }\n'
userScriptBody += '        });\n'
userScriptBody += '    }\n\n'
userScriptBody += '    // Initialize\n'
userScriptBody += '    loadConfig();\n'
userScriptBody += '})();\n'

const userscript = userscriptHeader + userScriptBody
const tampermonkeyScript = tampermonkeyHeader + userScriptBody

fs.writeFileSync(
  path.join(__dirname, '../public/userscripts.js'),
  userscript,
)

fs.writeFileSync(
  path.join(__dirname, '../public/tampermonkey.js'),
  tampermonkeyScript,
)

console.log('✓ Build completed!')
console.log('  Version: ' + version)
console.log('  Generated: public/userscripts.js')
console.log('  Generated: public/tampermonkey.js')
console.log('  Generated: public/domain.' + version + '.jsonp')
console.log('  Copied ' + cssFiles.length + ' CSS files to public/styles')
console.log('  CDN URL: ' + cdnBase + '/public/userscripts.js')
console.log('  Generated: public/domain.' + version + '.jsonp')
console.log('  Copied ' + cssFiles.length + ' CSS files to public/styles')
console.log('  CDN URL: ' + cdnBase + '/public/userscripts.js')
