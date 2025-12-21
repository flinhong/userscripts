const fs = require('fs');
const path = require('path');

// Check if this is a reset operation (no arguments) or set operation (with version)
const isReset = !process.argv[2];
const newVersion = isReset ? '0.0.1' : process.argv[2];

if (!isReset && !newVersion) {
    console.log('Usage: node scripts/reset-version.js [X.Y.Z]');
    console.log('Example: node scripts/reset-version.js 2.0.0');
    console.log('Or use without arguments to reset to 0.0.1');
    process.exit(1);
}

// Validate version format (X.Y.Z where X,Y,Z are numbers)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
    console.error('❌ Invalid version format. Use X.Y.Z format (e.g., 1.2.3)');
    process.exit(1);
}

const action = isReset ? 'Resetting' : 'Setting';
console.log(`🔄 ${action} version to ${newVersion}...`);

// Files to update
const filesToUpdate = [
    {
        path: path.join(__dirname, '..', 'package.json'),
        description: 'package.json',
        update: (data) => {
            const packageData = JSON.parse(data);
            const oldVersion = packageData.version;
            packageData.version = newVersion;
            return JSON.stringify(packageData, null, 2);
        }
    },
    {
        path: path.join(__dirname, '..', 'configs', 'version.json'),
        description: 'configs/version.json',
        update: (data) => {
            const versionData = JSON.parse(data);
            const oldVersion = versionData.version;
            versionData.version = newVersion;
            versionData.lastUpdated = new Date().toISOString().split('T')[0];
            versionData.description = isReset ? 'Version reset to 0.0.1' : 'Manual version set';
            return JSON.stringify(versionData, null, 2);
        }
    },
    {
        path: path.join(__dirname, '..', 'templates', 'tampermonkey.headers'),
        description: 'templates/tampermonkey.headers',
        update: (data) => {
            return data.replace(/\/\/ @version\s+\d+\.\d+\.\d+/, `// @version      ${newVersion}`);
        }
    },
    {
        path: path.join(__dirname, '..', 'templates', 'userscripts.headers'),
        description: 'templates/userscripts.headers',
        update: (data) => {
            return data.replace(/\/\/ @version\s+\d+\.\d+\.\d+/, `// @version      ${newVersion}`);
        }
    }
];

let successCount = 0;
let errorCount = 0;

filesToUpdate.forEach(({ path: filePath, description, update }) => {
    try {
        const currentContent = fs.readFileSync(filePath, 'utf8');
        const updatedContent = update(currentContent);
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ Updated ${description}`);
        successCount++;
    } catch (error) {
        console.error(`❌ Failed to update ${description}:`, error.message);
        errorCount++;
    }
});

console.log(`\n📊 Summary: ${successCount} files updated, ${errorCount} errors`);

if (errorCount === 0) {
    console.log(`\n🎉 Version successfully ${isReset ? 'reset' : 'set'} to ${newVersion}`);
    console.log('💡 Run "npm run build" to update the distribution files');
} else {
    console.log('\n❌ Some files could not be updated');
    process.exit(1);
}