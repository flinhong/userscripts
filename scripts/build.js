const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

const distDir = path.join(projectRoot, 'dist');
const srcDir = path.join(projectRoot, 'src');
const templatesDir = path.join(projectRoot, 'templates');
const configsDir = path.join(projectRoot, 'configs');
const stylesDir = path.join(configsDir, 'styles');
const distStylesDir = path.join(distDir, 'styles');

const repoBaseUrl = 'https://cdn.jsdelivr.net/gh/flinhong/userscripts';

function getVersion() {
    const versionPath = path.join(configsDir, 'version.json');
    const versionFile = fs.readFileSync(versionPath, 'utf8');
    return JSON.parse(versionFile).version;
}

function getDomainMappings() {
    const domainMapPath = path.join(configsDir, 'domain-map.json');
    const sourceMap = JSON.parse(fs.readFileSync(domainMapPath, 'utf8'));
    
    const runtimeMap = {};
    const allDomains = new Set();

    for (const group of sourceMap) {
        const styleName = group.name;
        for (const domain of group.domains) {
            runtimeMap[domain] = styleName;
            allDomains.add(domain);
        }
    }
    return { runtimeMap, allDomains };
}

function getMatchPatterns(allDomains) {
    const patterns = [];
    Array.from(allDomains).forEach(domain => {
        patterns.push(`*://${domain}/*`);
        patterns.push(`*://*.${domain}/*`);
    });
    return patterns;
}

function buildCss() {
    if (!fs.existsSync(distStylesDir)) {
        fs.mkdirSync(distStylesDir, { recursive: true });
    }

    const fontsCss = fs.readFileSync(path.join(stylesDir, 'fonts.css'), 'utf8');
    const defaultCss = fs.readFileSync(path.join(stylesDir, 'default.css'), 'utf8');
    
    const baseCssWithoutFonts = defaultCss;
    const baseCssWithFonts = `${fontsCss}\n${defaultCss}`;

    fs.writeFileSync(path.join(distStylesDir, 'default.css'), baseCssWithFonts);

    const sourceMap = JSON.parse(fs.readFileSync(path.join(configsDir, 'domain-map.json'), 'utf8'));
    const styleGroups = new Map(sourceMap.map(g => [g.name, g]));

    fs.readdirSync(stylesDir).forEach(file => {
        if (file.endsWith('.css') && !['default.css', 'fonts.css', 'main.css'].includes(file)) {
            const styleName = file.replace('.css', '');
            if (!styleGroups.has(styleName)) {
                styleGroups.set(styleName, { name: styleName, useGoogleFonts: true });
            }
        }
    });
    
    styleGroups.forEach(group => {
        const styleName = group.name;
        const styleFilePath = path.join(stylesDir, `${styleName}.css`);
        const useGoogleFonts = group.useGoogleFonts !== false;
        
        if (fs.existsSync(styleFilePath)) {
            const siteCss = fs.readFileSync(styleFilePath, 'utf8');
            const base = useGoogleFonts ? baseCssWithFonts : baseCssWithoutFonts;
            const fullCss = `${base}\n${siteCss}`;
            fs.writeFileSync(path.join(distStylesDir, `${styleName}.css`), fullCss);
        }
    });

    console.log('Successfully built CSS bundles.');
}

function build() {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    buildCss();

    const version = getVersion();
    const { runtimeMap, allDomains } = getDomainMappings();
    const matchPatterns = getMatchPatterns(allDomains);

    const coreJs = fs.readFileSync(path.join(srcDir, 'core.js'), 'utf8')
        .replace(/__VERSION__/g, version)
        .replace('__DOMAIN_MAP__', JSON.stringify(runtimeMap, null, 4))
        .replace('__SORTED_DOMAIN_KEYS__', JSON.stringify(Object.keys(runtimeMap).sort((a, b) => b.length - a.length), null, 4));

    // --- Build Tampermonkey Script ---
    const tampermonkeyDownloadUrl = `${repoBaseUrl}@${version}/dist/tampermonkey.js`;
    const tampermonkeyUpdateUrl = `${repoBaseUrl}@${version}/dist/tampermonkey.meta.js`;

    const tampermonkeyHeader = fs.readFileSync(path.join(templatesDir, 'tampermonkey.headers'), 'utf8')
        .replace(/__VERSION__/g, version)
        .replace('__MATCH_PATTERNS__', matchPatterns.join('\n// @match        '))
        .replace('__DOWNLOAD_URL__', tampermonkeyDownloadUrl)
        .replace('__UPDATE_URL__', tampermonkeyUpdateUrl);

    // Write .meta.js file
    fs.writeFileSync(path.join(distDir, 'tampermonkey.meta.js'), tampermonkeyHeader);
    console.log('Successfully built tampermonkey.meta.js');
    
    // Write .user.js file
    const tampermonkeyScript = `${tampermonkeyHeader}\n\n${coreJs}`;
    fs.writeFileSync(path.join(distDir, 'tampermonkey.js'), tampermonkeyScript);
    console.log('Successfully built tampermonkey.js');

    // --- Build Userscripts Script ---
    const userscriptsDownloadUrl = `${repoBaseUrl}@${version}/dist/userscripts.js`;
    const userscriptsUpdateUrl = `${repoBaseUrl}@${version}/dist/userscripts.meta.js`;

    const userscriptsHeader = fs.readFileSync(path.join(templatesDir, 'userscripts.headers'), 'utf8')
        .replace(/__VERSION__/g, version)
        .replace('__MATCH_PATTERNS__', matchPatterns.join('\n// @match        '))
        .replace('__DOWNLOAD_URL__', userscriptsDownloadUrl)
        .replace('__UPDATE_URL__', userscriptsUpdateUrl);

    // Write .meta.js file
    fs.writeFileSync(path.join(distDir, 'userscripts.meta.js'), userscriptsHeader);
    console.log('Successfully built userscripts.meta.js');

    // Write .user.js file
    const userscriptsScript = `${userscriptsHeader}\n\n${coreJs}`;
    fs.writeFileSync(path.join(distDir, 'userscripts.js'), userscriptsScript);
    console.log('Successfully built userscripts.js');
}

// Only run build() if not being imported (i.e., not during testing)
if (require.main === module) {
    build();
}