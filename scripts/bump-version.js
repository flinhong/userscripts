const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the version type from command line arguments (patch, minor, major)
const versionType = process.argv[2] || 'patch';
const dryRun = process.argv.includes('--dry-run');
const noGit = process.argv.includes('--no-git');

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

// Git integration (if not disabled and not dry run)
if (!dryRun && !noGit) {
    try {
        // Check if we're in a git repository
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        
        // Build distribution files first
        console.log(`🔨 Building distribution files...`);
        execSync('npm run build', { stdio: 'inherit' });
        
        // Check if release branch exists, if not create it
        let releaseBranchExists = false;
        try {
            execSync('git rev-parse --verify release', { stdio: 'ignore' });
            releaseBranchExists = true;
            console.log(`📋 Release branch exists, updating...`);
        } catch (e) {
            console.log(`📋 Creating release branch...`);
            execSync('git checkout --orphan release', { stdio: 'ignore' });
            execSync('git rm -rf .', { stdio: 'ignore' });
            execSync('echo "# Release Branch\\n\\nThis branch contains the built userscript files for distribution.\\n\\n## Installation\\n\\nUsers can install the userscript by using the raw GitHub URL from this branch.\\n\\n## Files\\n\\n- \\`tampermonkey.js\\` - Tampermonkey userscript\\n- \\`userscripts.js\\` - Safari/userscripts\\n- \\`*.css\\` - Configuration files" > README.md', { stdio: 'ignore' });
            
            // Create release-specific .gitignore that allows tracking built files
            execSync('echo "# Release branch .gitignore\\n# We want to track built files in release branch\\n# Only ignore temporary files and OS files\\n\\n# OS generated files\\n.DS_Store\\n.DS_Store?\\n._*\\n.Spotlight-V100\\n.Trashes\\nehthumbs.db\\nThumbs.db\\n\\n# Temporary files\\n*.tmp\\n*.temp\\n*.bak\\n*.backup\\n\\n# Logs\\n*.log" > .gitignore', { stdio: 'ignore' });
        }
        
        // Switch to release branch
        execSync('git checkout release', { stdio: 'ignore' });
        
        // Copy built files from dist to root
        execSync('cp -r dist/* .', { stdio: 'ignore' });
        
        // Ensure .gitignore exists on release branch (for existing branches)
        if (!fs.existsSync('.gitignore')) {
            execSync('echo "# Release branch .gitignore\\n# We want to track built files in release branch\\n# Only ignore temporary files and OS files\\n\\n# OS generated files\\n.DS_Store\\n.DS_Store?\\n._*\\n.Spotlight-V100\\n.Trashes\\nehthumbs.db\\nThumbs.db\\n\\n# Temporary files\\n*.tmp\\n*.temp\\n*.bak\\n*.backup\\n\\n# Logs\\n*.log" > .gitignore', { stdio: 'ignore' });
        }
        
        // Add all changes
        execSync('git add .', { stdio: 'ignore' });
        
        // Commit changes
        const releaseCommitMessage = `Release version ${newVersion}`;
        execSync(`git commit -m "${releaseCommitMessage}" || true`, { stdio: 'ignore' });
        console.log(`📝 Release commit created: ${releaseCommitMessage}`);
        
        // Push to remote release branch
        try {
            execSync('git remote get-url origin', { stdio: 'ignore' });
            if (releaseBranchExists) {
                execSync('git push origin release', { stdio: 'ignore' });
            } else {
                execSync('git push -u origin release', { stdio: 'ignore' });
            }
            console.log(`🚀 Pushed release branch to remote`);
        } catch (remoteError) {
            console.log(`⚠️  No remote repository found, skipping push`);
        }
        
        // Switch back to main branch
        execSync('git checkout main', { stdio: 'ignore' });
        console.log(`🔄 Switched back to main branch`);
        
        // Now handle the version bump commit on main branch
        // Check if there are changes to commit
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            // Add updated files
            execSync('git add package.json configs/version.json templates/', { stdio: 'ignore' });
            
            // Create commit with conventional commit format
            const commitMessage = `chore(release): bump version to ${newVersion}`;
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'ignore' });
            console.log(`📝 Git commit created: ${commitMessage}`);
            
            // Create and push tag
            const tagMessage = `Release version ${newVersion}`;
            execSync(`git tag -a v${newVersion} -m "${tagMessage}"`, { stdio: 'ignore' });
            console.log(`🏷️  Git tag created: v${newVersion}`);
            
            // Check if remote exists and push
            try {
                execSync('git remote get-url origin', { stdio: 'ignore' });
                execSync('git push origin --follow-tags', { stdio: 'ignore' });
                console.log(`🚀 Pushed commits and tags to remote`);
            } catch (remoteError) {
                console.log(`⚠️  No remote repository found, skipping push`);
            }
        } else {
            console.log(`📝 No changes to commit`);
        }
        
        console.log(`\\n✨ Release process completed successfully!`);
        try {
            const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
            const repoPath = remoteUrl.replace(/^.*github.com[:/]/, '').replace(/\.git$/, '');
            console.log(`📦 Tampermonkey users can install using: https://raw.githubusercontent.com/${repoPath}/release/tampermonkey.js`);
            console.log(`📦 Safari/other userscript users can install using: https://raw.githubusercontent.com/${repoPath}/release/userscripts.js`);
        } catch (e) {
            console.log(`📦 Tampermonkey users can install using: https://raw.githubusercontent.com/USERNAME/userscripts/release/tampermonkey.js`);
            console.log(`📦 Safari/other userscript users can install using: https://raw.githubusercontent.com/USERNAME/userscripts/release/userscripts.js`);
        }
        
    } catch (gitError) {
        console.log(`⚠️  Git integration failed: ${gitError.message}`);
        console.log(`💡 Use --no-git to disable Git integration`);
    }
} else if (!dryRun && noGit) {
    console.log(`🔇 Git integration disabled`);
}