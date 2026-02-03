const fs = require('fs')
const path = require('path')
const semver = require('semver')

// File paths
const packageJsonPath = path.join(__dirname, '../package.json')
const versionJsonPath = path.join(__dirname, '../configs/version.json')

// Parse arguments
const args = process.argv.slice(2)
const bumpType = args[0] === 'bump' ? args[1] : 'patch'
const dryRun = args.includes('--dryrun')

// Validate bump type
const validTypes = ['major', 'minor', 'patch']
if (!validTypes.includes(bumpType)) {
  console.error(`Invalid bump type: ${bumpType}`)
  console.error(`Valid types: ${validTypes.join(', ')}`)
  process.exit(1)
}

// Read current versions
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'))

const currentVersion = packageJson.version
const newVersion = semver.inc(currentVersion, bumpType)

console.log('Current version:', currentVersion)
console.log(`Bumping ${bumpType} version...`)
console.log('New version:', newVersion)

if (dryRun) {
  console.log('\n[DRY RUN] No files will be modified.')
  process.exit(0)
}

// Update package.json
packageJson.version = newVersion
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
console.log('✓ Updated package.json')

// Update configs/version.json
versionJson.version = newVersion
fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2) + '\n')
console.log('✓ Updated configs/version.json')

// Build the project
console.log('\nRunning build...')
require('./build.js')

console.log('\n✓ Release complete!')
console.log("  Don't forget to commit and push changes:")
console.log(`  git add package.json configs/version.json public/`)
console.log('  git commit -m "chore: bump version to ' + newVersion + '"')
console.log('  git push origin main')
