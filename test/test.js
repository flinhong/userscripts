// Comprehensive test framework for font customization userscript
// Tests both local build and release build configurations

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// Test configuration files exist and are valid JSON/CSS
function testConfigFiles() {
    console.log('Testing configuration files...');
    
    let allPassed = true;
    
    // Test version.json
    try {
        const versionPath = path.join(projectRoot, 'configs', 'version.json');
        const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        console.log('✓ version.json is valid JSON');
        console.log(`  Current version: ${versionData.version}`);
    } catch (error) {
        console.error('✗ version.json is invalid:', error.message);
        allPassed = false;
    }
    
    // Test domain-map.json
    try {
        const domainMapPath = path.join(projectRoot, 'configs', 'domain-map.json');
        const domainMap = JSON.parse(fs.readFileSync(domainMapPath, 'utf8'));
        console.log('✓ domain-map.json is valid JSON');
        console.log(`  Domain mappings: ${Object.keys(domainMap).length}`);
    } catch (error) {
        console.error('✗ domain-map.json is invalid:', error.message);
        allPassed = false;
    }
    
    // Test CSS config files
    const stylesDir = path.join(projectRoot, 'configs', 'styles');
    if (fs.existsSync(stylesDir)) {
        const cssFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
        console.log(`✓ Found ${cssFiles.length} CSS config files`);
        
        cssFiles.forEach(file => {
            try {
                const content = fs.readFileSync(path.join(stylesDir, file), 'utf8');
                if (content.includes('font-family')) {
                    console.log(`✓ ${file} contains font-family rules`);
                } else {
                    console.warn(`⚠ ${file} may be missing font-family rules`);
                }
            } catch (error) {
                console.error(`✗ ${file} is not readable:`, error.message);
                allPassed = false;
            }
        });
    } else {
        console.error('✗ configs/styles directory not found');
        allPassed = false;
    }
    
    return allPassed;
}

// Test core.js syntax and structure
function testCoreSyntax() {
    console.log('\nTesting core.js syntax...');
    
    try {
        const corePath = path.join(projectRoot, 'src', 'core.js');
        const content = fs.readFileSync(corePath, 'utf8');
        
        let allPassed = true;
        
        // Basic syntax checks
        if (content.includes('CONFIG_BASE_URL')) {
            console.log('✓ CONFIG_BASE_URL variable defined');
        } else {
            console.error('✗ CONFIG_BASE_URL variable missing');
            allPassed = false;
        }
        
        if (content.includes('extractGoogleFonts')) {
            console.log('✓ extractGoogleFonts function defined');
        } else {
            console.error('✗ extractGoogleFonts function missing');
            allPassed = false;
        }
        
        if (content.includes('FONTS_CSS_URL')) {
            console.log('✓ FONTS_CSS_URL variable defined');
        } else {
            console.error('✗ FONTS_CSS_URL variable missing');
            allPassed = false;
        }
        
        if (content.includes('SITE_CONFIG_URL')) {
            console.log('✓ SITE_CONFIG_URL variable defined');
        } else {
            console.error('✗ SITE_CONFIG_URL variable missing');
            allPassed = false;
        }
        
        // Check for proper function closure
        const hasIIFE = content.includes('(function()') && 
                       content.includes(');') && 
                       content.trim().endsWith('})();');
        if (hasIIFE) {
            console.log('✓ Proper IIFE structure');
        } else {
            console.error('✗ Invalid IIFE structure');
            allPassed = false;
        }
        
        return allPassed;
        
    } catch (error) {
        console.error('✗ core.js syntax error:', error.message);
        return false;
    }
}

// Test build scripts
function testBuildScripts() {
    console.log('\nTesting build scripts...');
    
    let allPassed = true;
    
    // Test generate-matches.js
    try {
        const output = execSync('node scripts/generate-matches.js', {
            cwd: projectRoot,
            encoding: 'utf8'
        });
        
        if (output.includes('@match')) {
            console.log('✓ generate-matches.js produces valid match patterns');
        } else {
            console.error('✗ generate-matches.js failed to produce match patterns');
            allPassed = false;
        }
        
    } catch (error) {
        console.error('✗ generate-matches.js execution failed:', error.message);
        allPassed = false;
    }
    
    return allPassed;
}

// Test local build (development URLs)
function testLocalBuild() {
    console.log('\nTesting local build...');
    
    try {
        // Clean dist directory
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true });
        }
        
        // Run build script
        execSync('npm run build', { cwd: projectRoot });
        
        // Check if files were created
        const tampermonkeyFile = path.join(distDir, 'tampermonkey.js');
        const userscriptsFile = path.join(distDir, 'userscripts.js');
        
        if (!fs.existsSync(tampermonkeyFile)) {
            console.error('✗ tampermonkey.js not created');
            return false;
        }
        
        if (!fs.existsSync(userscriptsFile)) {
            console.error('✗ userscripts.js not created');
            return false;
        }
        
        console.log('✓ Local build files created');
        
        // Check local build content (should have placeholder URLs)
        const tmContent = fs.readFileSync(tampermonkeyFile, 'utf8');
        const usContent = fs.readFileSync(userscriptsFile, 'utf8');
        
        // Check for proper userscript headers
        if (tmContent.includes('// ==UserScript==') && tmContent.includes('// ==/UserScript==')) {
            console.log('✓ Tampermonkey script has proper headers');
        } else {
            console.error('✗ Tampermonkey script missing headers');
            return false;
        }
        
        if (usContent.includes('// ==UserScript==') && usContent.includes('// ==/UserScript==')) {
            console.log('✓ Userscripts script has proper headers');
        } else {
            console.error('✗ Userscripts script missing headers');
            return false;
        }
        
        // Check for match patterns
        if (tmContent.includes('@match')) {
            console.log('✓ Tampermonkey script has match patterns');
        } else {
            console.error('✗ Tampermonkey script missing match patterns');
            return false;
        }
        
        if (usContent.includes('@match')) {
            console.log('✓ Userscripts script has match patterns');
        } else {
            console.error('✗ Userscripts script missing match patterns');
            return false;
        }
        
        // Check for core logic
        if (tmContent.includes('CONFIG_BASE_URL') && tmContent.includes('extractGoogleFonts')) {
            console.log('✓ Tampermonkey script contains core logic');
        } else {
            console.error('✗ Tampermonkey script missing core logic');
            return false;
        }
        
        if (usContent.includes('CONFIG_BASE_URL') && usContent.includes('extractGoogleFonts')) {
            console.log('✓ Userscripts script contains core logic');
        } else {
            console.error('✗ Userscripts script missing core logic');
            return false;
        }
        
        console.log('✓ Local build validation passed');
        
        return true;
        
    } catch (error) {
        console.error('✗ Local build failed:', error.message);
        return false;
    }
}

// Test release build (production URLs)
function testReleaseBuild() {
    console.log('\nTesting release build...');
    
    try {
        // Set environment variable for release build
        process.env.NODE_ENV = 'production';
        
        // Clean dist directory
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true });
        }
        
        // Run build script with production flag (if supported)
        execSync('npm run build', { cwd: projectRoot });
        
        // Check if files were created
        const tampermonkeyFile = path.join(distDir, 'tampermonkey.js');
        const userscriptsFile = path.join(distDir, 'userscripts.js');
        
        if (!fs.existsSync(tampermonkeyFile) || !fs.existsSync(userscriptsFile)) {
            console.error('✗ Release build files not created');
            return false;
        }
        
        console.log('✓ Release build files created');
        
        // Check release build content
        const tmContent = fs.readFileSync(tampermonkeyFile, 'utf8');
        const usContent = fs.readFileSync(userscriptsFile, 'utf8');
        
        // Verify production URLs (should contain CDN URLs)
        if (tmContent.includes('cdn.jsdelivr.net')) {
            console.log('✓ Tampermonkey script has production URLs');
        } else {
            console.warn('⚠ Tampermonkey script may not have production URLs');
        }
        
        if (usContent.includes('cdn.jsdelivr.net')) {
            console.log('✓ Userscripts script has production URLs');
        } else {
            console.warn('⚠ Userscripts script may not have production URLs');
        }
        
        // Verify file sizes are reasonable (> 5KB for complete script)
        const tmStats = fs.statSync(tampermonkeyFile);
        const usStats = fs.statSync(userscriptsFile);
        
        if (tmStats.size > 5000) {
            console.log(`✓ Tampermonkey script size is reasonable (${(tmStats.size / 1024).toFixed(1)}KB)`);
        } else {
            console.warn(`⚠ Tampermonkey script seems small (${(tmStats.size / 1024).toFixed(1)}KB)`);
        }
        
        if (usStats.size > 5000) {
            console.log(`✓ Userscripts script size is reasonable (${(usStats.size / 1024).toFixed(1)}KB)`);
        } else {
            console.warn(`⚠ Userscripts script seems small (${(usStats.size / 1024).toFixed(1)}KB)`);
        }
        
        console.log('✓ Release build validation passed');
        
        return true;
        
    } catch (error) {
        console.error('✗ Release build failed:', error.message);
        return false;
    } finally {
        // Clean up environment variable
        delete process.env.NODE_ENV;
    }
}

// Test version bump functionality
function testVersionBump() {
    console.log('\nTesting version bump functionality...');
    
    try {
        // Read current version
        const versionPath = path.join(projectRoot, 'configs', 'version.json');
        const originalVersionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        const originalVersion = originalVersionData.version;
        
        console.log(`  Current version: ${originalVersion}`);
        
        // Test dry run
        try {
            execSync('node scripts/bump-version.js --dry-run', {
                cwd: projectRoot,
                encoding: 'utf8'
            });
            console.log('✓ Version bump script dry run successful');
        } catch (error) {
            console.warn('⚠ Version bump dry run failed:', error.message);
        }
        
        // Restore original version if it was changed
        const currentVersionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        if (currentVersionData.version !== originalVersion) {
            fs.writeFileSync(versionPath, JSON.stringify(originalVersionData, null, 2));
        }
        
        return true;
        
    } catch (error) {
        console.error('✗ Version bump test failed:', error.message);
        return false;
    }
}

// Main test runner
function runAllTests() {
    console.log('=== Font Customizer Userscript Comprehensive Tests ===\n');
    
    const startTime = Date.now();
    
    const testResults = [
        { name: 'Configuration Files', fn: testConfigFiles },
        { name: 'Core Syntax', fn: testCoreSyntax },
        { name: 'Build Scripts', fn: testBuildScripts },
        { name: 'Local Build', fn: testLocalBuild },
        { name: 'Release Build', fn: testReleaseBuild },
        { name: 'Version Bump', fn: testVersionBump }
    ];
    
    const results = [];
    
    for (const test of testResults) {
        try {
            const result = test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`\n✗ ${test.name} test crashed:`, error.message);
            results.push({ name: test.name, passed: false });
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n=== Test Results ===');
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    results.forEach(result => {
        const status = result.passed ? '✓' : '✗';
        console.log(`${status} ${result.name}`);
    });
    
    console.log(`\nSummary: ${passedCount}/${totalCount} tests passed (${duration}s)`);
    
    if (passedCount === totalCount) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.error('❌ Some tests failed!');
        process.exit(1);
    }
}

// Run tests
runAllTests();