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
    const domainMapPath = path.join(configsDir, 'domain.json');
    const config = JSON.parse(fs.readFileSync(domainMapPath, 'utf8'));
    const domains = config.domains;
    
    const allDomains = [];
    const allMatchPatterns = [];
    
    // Flatten all matches from all domain groups
    domains.forEach(domainGroup => {
        domainGroup.matches.forEach(match => {
            if (match.startsWith('*.')) {
                allDomains.push(match.substring(2)); // Remove '*.'
            } else {
                allDomains.push(match);
            }
            allMatchPatterns.push(match);
        });
    });
    
    return { domains, allDomains, allMatchPatterns };
}

function getMatchPatterns(allMatchPatterns) {
    const patterns = allMatchPatterns.map(match => `*://${match}/*`);
    return Array.from(new Set(patterns)).sort();
}

function buildCss() {
    if (!fs.existsSync(distStylesDir)) {
        fs.mkdirSync(distStylesDir, { recursive: true });
    }

    const { domains } = getDomainMappings();
    const uniqueStyles = new Set();

    // Collect all unique styles
    domains.forEach(domainGroup => {
        uniqueStyles.add(domainGroup.style);
    });

    // Copy CSS files directly to dist/styles
    uniqueStyles.forEach((styleName) => {
        const styleFilePath = path.join(stylesDir, `${styleName}.css`);
        
        if (fs.existsSync(styleFilePath)) {
            const cssContent = fs.readFileSync(styleFilePath, 'utf8');
            fs.writeFileSync(path.join(distStylesDir, `${styleName}.css`), cssContent);
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
    const { domains, allDomains, allMatchPatterns } = getDomainMappings();
    const matchPatterns = getMatchPatterns(allMatchPatterns);

    // Generate resource declarations for CSS files (only for Tampermonkey)
    function generateResourceDeclarations() {
        const resourceLines = [];
        const processedDomainGroups = new Set();
        
        domains.forEach(domainGroup => {
            const { name, style } = domainGroup;
            
            if (!processedDomainGroups.has(name)) {
                const cssContent = fs.readFileSync(path.join(distStylesDir, `${style}.css`), 'utf8');
                
                // Escape CSS content for resource declaration
                const escapedCss = cssContent
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '');
                
                resourceLines.push(`// @resource css_${name} data:text/css;charset=utf-8,${escapedCss}`);
                processedDomainGroups.add(name);
            }
        });
        
        return resourceLines.join('\n');
    }
    
    const resourceDeclarations = generateResourceDeclarations();
    const fullCoreJs = fs.readFileSync(path.join(srcDir, 'core.js'), 'utf8');
    
    // Extract tampermonkey function
    const tampermonkeyMatch = fullCoreJs.match(/function tampermonkeyCore\(\) \{[\s\S]*?\n\}/);
    const tampermonkeyCoreJs = tampermonkeyMatch ? `(${tampermonkeyMatch[0]});\n\ntampermonkeyCore();` : '';
    
    // Extract userscripts function
    const userscriptsMatch = fullCoreJs.match(/function userscriptsCore\(\) \{[\s\S]*?\n\}/);
    const userscriptsCoreJs = userscriptsMatch ? `(${userscriptsMatch[0]});\n\nuserscriptsCore();` : '';

    // --- Build Tampermonkey Script ---
    const tampermonkeyDownloadUrl = `${repoBaseUrl}/dist/tampermonkey.js`;
    const tampermonkeyUpdateUrl = `${repoBaseUrl}/dist/tampermonkey.meta.js`;

    const tampermonkeyHeader = fs.readFileSync(path.join(templatesDir, 'tampermonkey.headers'), 'utf8')
        .replace(/__VERSION__/g, version)
        .replace('__MATCH_PATTERNS__', matchPatterns.join('\n// @match        '))
        .replace('__DOWNLOAD_URL__', tampermonkeyDownloadUrl)
        .replace('__UPDATE_URL__', tampermonkeyUpdateUrl)
        .replace('__RESOURCE_DECLARATIONS__', resourceDeclarations);

    // Write .meta.js file
    fs.writeFileSync(path.join(distDir, 'tampermonkey.meta.js'), tampermonkeyHeader);
    console.log('Successfully built tampermonkey.meta.js');
    
    // Write .user.js file
    const tampermonkeyScript = `${tampermonkeyHeader}\n\n${tampermonkeyCoreJs}`;
    fs.writeFileSync(path.join(distDir, 'tampermonkey.js'), tampermonkeyScript);
    console.log('Successfully built tampermonkey.js');

    // --- Build Userscripts Script ---
    const userscriptsDownloadUrl = `${repoBaseUrl}/dist/userscripts.js`;
    const userscriptsUpdateUrl = `${repoBaseUrl}/dist/userscripts.meta.js`;

    const userscriptsHeader = fs.readFileSync(path.join(templatesDir, 'userscripts.headers'), 'utf8')
        .replace(/__VERSION__/g, version)
        .replace('__MATCH_PATTERNS__', matchPatterns.join('\n// @match        '))
        .replace('__DOWNLOAD_URL__', userscriptsDownloadUrl)
        .replace('__UPDATE_URL__', userscriptsUpdateUrl)
        .replace('__RESOURCE_DECLARATIONS__', ''); // No resource declarations for userscripts

    // Write .meta.js file
    fs.writeFileSync(path.join(distDir, 'userscripts.meta.js'), userscriptsHeader);
    console.log('Successfully built userscripts.meta.js');

    // Write .user.js file
    const userscriptsScript = `${userscriptsHeader}\n\n${userscriptsCoreJs}`;
    fs.writeFileSync(path.join(distDir, 'userscripts.js'), userscriptsScript);
    console.log('Successfully built userscripts.js');
}

// Only run build() if not being imported (i.e., not during testing)
if (require.main === module) {
    build();
}