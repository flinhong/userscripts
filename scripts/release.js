const fs = require('fs');
const path = require('path');
const semver = require('semver');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const versionConfigPath = path.join(projectRoot, 'configs/version.json');
const packageJsonPath = path.join(projectRoot, 'package.json');

// Read version config
let versionConfig = JSON.parse(fs.readFileSync(versionConfigPath, 'utf8'));

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get command line arguments
const args = process.argv.slice(2);
const action = args[0];
const type = args[1];
const dryrun = args.includes('--dryrun');
const noBuild = args.includes('--no-build');

function bumpVersion(type) {
  if (!type) {
    console.error('Error: Version type is required (major, minor, or patch)');
    process.exit(1);
  }

  const newVersion = semver.inc(versionConfig.version, type);
  if (!newVersion) {
    console.error(`Error: Invalid version type '${type}'`);
    process.exit(1);
  }

  versionConfig.version = newVersion;
  packageJson.version = newVersion;

  if (dryrun) {
    console.log(`[Dry Run] Would bump version from ${versionConfig.version} to ${newVersion}`);
  } else {
    // Write updated version to configs/version.json
    fs.writeFileSync(versionConfigPath, JSON.stringify(versionConfig, null, 2));

    // Write updated version to package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log(`✓ Version bumped to ${newVersion}`);
    console.log(`✓ Updated: configs/version.json`);
    console.log(`✓ Updated: package.json`);

    // Build public directory
    if (!noBuild) {
      buildPublic();
    }
  }
}

function setVersion() {
  // Try multiple sources for version
  let newVersion = args[2] || process.env.VERSION;

  if (!newVersion) {
    console.error('Error: Version is required');
    console.error('Usage:');
    console.error('  npm run version:set 2.0.0');
    console.error('  node scripts/release.js set 2.0.0');
    console.error('  VERSION=2.0.0 npm run version:set');
    process.exit(1);
  }

  if (!semver.valid(newVersion)) {
    console.error(`Error: Invalid version format '${newVersion}'`);
    process.exit(1);
  }

  versionConfig.version = newVersion;
  packageJson.version = newVersion;

  if (dryrun) {
    console.log(`[Dry Run] Would set version to ${newVersion}`);
  } else {
    fs.writeFileSync(versionConfigPath, JSON.stringify(versionConfig, null, 2));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log(`✓ Version set to ${newVersion}`);
    console.log(`✓ Updated: configs/version.json`);
    console.log(`✓ Updated: package.json`);

    // Build public directory
    if (!noBuild) {
      buildPublic();
    }
  }
}

function resetVersion() {
  // Reset to 1.0.0
  const currentVersion = versionConfig.version;

  if (dryrun) {
    console.log(`[Dry Run] Would reset version to 1.0.0 (current: ${currentVersion})`);
  } else {
    versionConfig.version = '1.0.0';
    packageJson.version = '1.0.0';

    fs.writeFileSync(versionConfigPath, JSON.stringify(versionConfig, null, 2));
    packageJson.version = '1.0.0';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log(`✓ Version reset to 1.0.0`);
    console.log(`✓ Updated: configs/version.json`);
    console.log(`✓ Updated: package.json`);

    // Build public directory
    if (!noBuild) {
      buildPublic();
    }
  }
}

function buildPublic() {
  console.log('');
  console.log('Building public directory...');
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  } catch (error) {
    console.error('Error: Build failed');
    process.exit(1);
  }
}

// Execute action
switch (action) {
  case 'bump':
    bumpVersion(type);
    break;
  case 'set':
    setVersion();
    break;
  case 'reset':
    resetVersion();
    break;
  case 'build-only':
    buildPublic();
    break;
  default:
    console.log('Usage:');
    console.log('  node scripts/release.js bump <type>    - Bump version and build (major, minor, patch)');
    console.log('  node scripts/release.js reset          - Reset version to 1.0.0 and build');
    console.log('  node scripts/release.js build-only     - Build public directory only');
    console.log('');
    console.log('Options:');
    console.log('  --dryrun        Preview changes without applying them');
    console.log('  --no-build      Update version files only, skip build');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/release.js bump patch');
    console.log('  node scripts/release.js bump minor');
    console.log('  node scripts/release.js reset');
    console.log('  node scripts/release.js build-only');
    console.log('');
    console.log('Dry run:');
    console.log('  node scripts/release.js bump patch --dryrun');
    console.log('  node scripts/release.js bump patch --no-build');
    break;
}
