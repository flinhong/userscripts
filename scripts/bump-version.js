const fs = require('fs');
const path = require('path');

// Get the version type from command line arguments (patch, minor, major)
const versionType = process.argv[2] || 'patch';
const dryRun = process.argv.includes('--dry-run');

// Path to version files
const configVersionPath = path.join(__dirname, '..', 'configs', 'version.json');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read the current version files
const configVersionData = JSON.parse(fs.readFileSync(configVersionPath, 'utf8'));
const packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Determine which version to use as source (package.json takes precedence)
const sourceVersion = packageJsonData.version || configVersionData.version;
const [major, minor, patch] = sourceVersion.split('.').map(Number);

// Increment the version based on type
let newMajor = major, newMinor = minor, newPatch = patch;
switch (versionType) {
    case 'major':
        newMajor++;
        newMinor = 0;
        newPatch = 0;
        break;
    case 'minor':
        newMinor++;
        newPatch = 0;
        break;
    case 'patch':
    default:
        newPatch++;
        break;
}

// Create the new version string
const newVersion = `${newMajor}.${newMinor}.${newPatch}`;

// Update config version data
configVersionData.version = newVersion;
configVersionData.lastUpdated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
configVersionData.description = `Updated ${versionType} version`;

// Update package.json version
packageJsonData.version = newVersion;

// Write updates (unless dry run)
if (!dryRun) {
    // Write updated config version file
    fs.writeFileSync(configVersionPath, JSON.stringify(configVersionData, null, 2));
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonData, null, 2));
    
    console.log(`✅ Version bumped from ${sourceVersion} to ${newVersion} (${versionType})`);
    console.log(`📄 Config version file updated: ${configVersionPath}`);
    console.log(`📦 Package.json updated: ${packageJsonPath}`);
} else {
    console.log(`🔍 Dry run: Would bump version from ${sourceVersion} to ${newVersion} (${versionType})`);
    console.log(`📄 Would update: ${configVersionPath}`);
    console.log(`📦 Would update: ${packageJsonPath}`);
}

// Also update template files that contain version
const templateFiles = [
    path.join(__dirname, '..', 'templates', 'tampermonkey.headers'),
    path.join(__dirname, '..', 'templates', 'userscripts.headers')
];

templateFiles.forEach(templatePath => {
    if (fs.existsSync(templatePath)) {
        let content = fs.readFileSync(templatePath, 'utf8');
        const versionRegex = /\/\/ @version\s+\d+\.\d+\.\d+/;
        const newVersionLine = `// @version      ${newVersion}`;
        
        if (versionRegex.test(content)) {
            content = content.replace(versionRegex, newVersionLine);
            
            if (!dryRun) {
                fs.writeFileSync(templatePath, content);
                console.log(`📋 Template updated: ${path.basename(templatePath)}`);
            } else {
                console.log(`📋 Would update template: ${path.basename(templatePath)}`);
            }
        }
    }
});