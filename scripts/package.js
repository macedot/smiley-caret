#!/usr/bin/env node

/**
 * Packages the built extension into a zip file ready for the Chrome Web Store.
 * 
 * Usage:
 *   npm run package
 * 
 * Output:
 *   smiley-caret-vX.Y.Z.zip  (in the project root)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXTENSION_DIR = path.join(ROOT, 'extension');
const MANIFEST_PATH = path.join(EXTENSION_DIR, 'manifest.json');

function main() {
  // Read version from the extension manifest (source of truth)
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('Error: extension/manifest.json not found. Run from project root.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const version = manifest.version || '0.0.0';
  const zipName = `smiley-caret-v${version}.zip`;
  const zipPath = path.join(ROOT, zipName);

  console.log(`\n📦 Packaging Smiley Caret v${version}...\n`);

  // 1. Build the extension
  console.log('→ Running build...');
  try {
    execSync('npm run build', {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true
    });
  } catch (err) {
    console.error('\nBuild failed.');
    process.exit(1);
  }

  // 2. Create the zip (manifest.json must be at the root of the zip)
  console.log(`\n→ Creating ${zipName}...`);

  // Remove old zip if it exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // cd into extension/ and zip its contents (.) so manifest is at zip root
  const zipCmd = `cd extension && zip -r ../${zipName} . -x "*.map" -x "*/.DS_Store" -x ".DS_Store" -x "*/__MACOSX/*"`;

  try {
    execSync(zipCmd, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true
    });
  } catch (err) {
    console.error('\nFailed to create zip.');
    process.exit(1);
  }

  // Verify
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`\n✅ Successfully created ${zipName} (${sizeKB} KB)`);
    console.log(`   Location: ${zipPath}`);
    console.log(`\n   Upload this file to the Chrome Web Store Developer Dashboard.`);
    console.log(`   (manifest.json will be at the root of the zip)\n`);
  } else {
    console.error('\nZip file was not created.');
    process.exit(1);
  }
}

main();
