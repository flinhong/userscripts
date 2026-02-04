const fs = require('fs')
const path = require('path')

// Read configuration files
const domainConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../configs/domain.json'), 'utf-8'),
)
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
)

const version = packageJson.version
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
  path.join(__dirname, '../public/domain.jsonp'),
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
  '@v' + version +
  '/public/domain.jsonp\n'
tampermonkeyHeader += '// @resource     fonts https://cdn.frankindev.com/fonts/g/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Serif+SC:wght@200..900&family=Outfit:wght@100..900&display=swap\n'
uniqueMatches.forEach(function (match) {
  tampermonkeyHeader += '// @match        ' + match + '\n'
})
tampermonkeyHeader += '// @grant        GM_getResourceURL\n'
tampermonkeyHeader += '// @grant        GM_getResourceText\n'
tampermonkeyHeader += '// @grant        GM_addStyle\n'
tampermonkeyHeader += '// @run-at       document-start\n'
tampermonkeyHeader += '// ==/UserScript=='

// Generate common body content
function generateBody(scriptName) {
  let body = '\n\n(function() {\n'
  body += "    'use strict';\n\n"
  body += '    const scriptVersion = typeof GM_info !== \'undefined\' ? GM_info.script.version : \'unknown\';\n'
  body += '    let domainConfig = null;\n'
  body += "    // Parse CDN base URL from @updateURL in GM_info\n"
  body += "    let cdnBase = '';\n"
  body += "    if (typeof GM_info !== 'undefined' && GM_info.scriptMetaStr) {\n"
  body += "        const updateUrlMatch = GM_info.scriptMetaStr.match(/@updateURL\\s+(\\S+)/);\n"
  body += "        if (updateUrlMatch) {\n"
  body += "            cdnBase = updateUrlMatch[1].replace(/\\/public\\/" + scriptName + "\\.js$/, '');\n"
  body += "        }\n"
  body += "    }\n"
  body += "    const configUrl = cdnBase + '@v' + scriptVersion + '/public/domain.jsonp';\n"
  body += "    const cssBaseUrl = cdnBase + '@v' + scriptVersion + '/public/styles';\n\n"
  body += '    // JSONP callback function\n'
  body += '    window.domainConfigCallback = function(config) {\n'
  body += '        domainConfig = config;\n'
  body +=
    "        console.log('[CFS] Config loaded:', config.rules.length, 'rules');\n"
  body += '        applyStylesheet();\n'
  body += '    };\n\n'
  body += '    // Extract hostname from @match pattern\n'
  body += '    function extractHostnameFromPattern(pattern) {\n'
  body += '        const match = pattern.match(/\\*:\\/\\/([^\\/]+)/);\n'
  body += '        return match ? match[1] : null;\n'
  body += '    }\n\n'
  body += '    // Get matching rule for current URL\n'
  body += '    function getMatchingRule() {\n'
  body +=
    '        if (!domainConfig || !domainConfig.rules) return null;\n\n'
  body += '        const hostname = window.location.hostname;\n'
  body += '        for (const rule of domainConfig.rules) {\n'
  body +=
    '            const patterns = rule.domains || rule.match || [];\n'
  body += '            for (const pattern of patterns) {\n'
  body +=
    '                const patternHostname = extractHostnameFromPattern(pattern);\n'
  body += '                if (hostname === patternHostname || hostname.endsWith("." + patternHostname)) {\n'
  body += '                    return rule;\n'
  body += '                }\n'
  body += '            }\n'
  body += '        }\n'
  body += '        return null;\n'
  body += '    }\n\n'
  body += '    // Apply stylesheet\n'
  body += '    function applyStylesheet() {\n'
  body += '        const rule = getMatchingRule();\n'
  body += '        if (!rule) return;\n\n'
  body += "        const cssUrl = cssBaseUrl + '/' + rule.file;\n"
  body += "        if (typeof GM_addStyle !== 'undefined') {\n"
  body += '            fetch(cssUrl)\n'
  body += '                .then(response => response.text())\n'
  body += '                .then(css => {\n'
  body += '                    GM_addStyle(css);\n'
  body +=
    "                    console.log('[CFS] Loaded:', rule.file, 'for', window.location.hostname);\n"
  body += '                })\n'
  body += '                .catch(err => {\n'
  body +=
    "                    console.error('[CFS] Failed to load:', err);\n"
  body += '                });\n'
  body += '        } else {\n'
  body += "            const link = document.createElement('link');\n"
  body += "            link.rel = 'stylesheet';\n"
  body += '            link.href = cssUrl;\n'
  body +=
    '            (document.head || document.documentElement).appendChild(link);\n'
  body += '        }\n'
  body += '    }\n\n'
  body += '    // Load Google Fonts - try @resource first, fallback to link tag\n'
  body += '    function loadFonts() {\n'
  body += '        const rule = getMatchingRule();\n'
  body += '        if (!rule || !rule.fonts) {\n'
  body += "            console.log('[CFS] Fonts disabled for this site');\n"
  body += '            return;\n'
  body += '        }\n'
  body += "        if (typeof GM_getResourceText !== 'undefined') {\n"
  body += "            // Tampermonkey with @resource support\n"
  body += "            try {\n"
  body += "                const fontsText = GM_getResourceText('fonts');\n"
  body += "                GM_addStyle(fontsText);\n"
  body += "                console.log('[CFS] Loaded fonts from @resource');\n"
  body += "            } catch (e) {\n"
  body += "                console.error('[CFS] Failed to load fonts from @resource:', e);\n"
  body += "                loadFontsFallback();\n"
  body += "            }\n"
  body += "        } else {\n"
  body += "            // Fallback for Safari/others\n"
  body += "            loadFontsFallback();\n"
  body += "        }\n"
  body += "    }\n\n"
  body += '    // Fallback: load fonts via link tag\n'
  body += '    function loadFontsFallback() {\n'
  body += "        const link = document.createElement('link');\n"
  body += "        link.rel = 'stylesheet';\n"
  body += "        link.href = 'https://cdn.frankindev.com/fonts/g/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Serif+SC:wght@200..900&family=Outfit:wght@100..900&display=swap';\n"
  body += "        (document.head || document.documentElement).appendChild(link);\n"
  body += "        console.log('[CFS] Loaded fonts via link tag');\n"
  body += "    }\n\n"
  body += '    // Load config - try @resource first, fallback to GM_xmlhttpRequest\n'
  body += '    function loadConfig() {\n'
  body += "        if (typeof GM_getResourceText !== 'undefined') {\n"
  body += "            // Tampermonkey with @resource support\n"
  body += "            try {\n"
  body += "                const configText = GM_getResourceText('config');\n"
  body += "                eval(configText);\n"
  body += "                console.log('[CFS] Loaded config from @resource');\n"
  body += "            } catch (e) {\n"
  body += "                console.error('[CFS] Failed to load @resource:', e);\n"
  body += "                loadConfigFallback();\n"
  body += "            }\n"
  body += "        } else if (typeof GM_xmlhttpRequest !== 'undefined') {\n"
  body += "            // Fallback for Safari/others\n"
  body += "            loadConfigFallback();\n"
  body += "        }\n"
  body += "    }\n\n"
  body += '    // Fallback: load config via GM_xmlhttpRequest\n'
  body += '    function loadConfigFallback() {\n'
  body += "        console.log('[CFS] Loading config from:', configUrl);\n"
  body += '        GM_xmlhttpRequest({\n'
  body += "            method: 'GET',\n"
  body += '            url: configUrl,\n'
  body += '            onload: function(response) {\n'
  body += '                if (response.status !== 200) {\n'
  body +=
    "                    console.error('[CFS] HTTP error:', response.status, response.statusText);\n"
  body += '                    return;\n'
  body += '                }\n'
  body += '                try {\n'
  body += '                    eval(response.responseText);\n'
  body +=
    "                    console.log('[CFS] Loaded config from CDN');\n"
  body += '                } catch (e) {\n'
  body +=
    "                    console.error('[CFS] Failed to load config:', e);\n"
  body += '                }\n'
  body += '            },\n'
  body += '            onerror: function(err) {\n'
  body +=
    "                    console.error('[CFS] Network error:', err);\n"
  body += '            }\n'
  body += '        });\n'
  body += '    }\n\n'
  body += '    // Initialize\n'
  body += '    loadConfig();\n'
  body += '    loadFonts();\n'
  body += '})();\n'
  return body
}

const userscriptBody = generateBody('userscripts')
const tampermonkeyBody = generateBody('tampermonkey')


const userscript = userscriptHeader + userscriptBody
const tampermonkeyScript = tampermonkeyHeader + tampermonkeyBody

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
console.log('  Generated: public/domain.jsonp')
console.log('  Copied ' + cssFiles.length + ' CSS files to public/styles')
console.log('  CDN URL: ' + cdnBase + '/public/userscripts.js')
