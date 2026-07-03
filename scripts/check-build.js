#!/usr/bin/env node

/**
 * Verifies that the committed build artifacts (extension/main/js/*.js and
 * extension/options/js/*.js) are in sync with the TypeScript/source files
 * under extension/main/js/src/ and extension/options/js/src/.
 *
 * Catches the "edited source, forgot to rebuild" class of bug by rebuilding
 * into a temp directory and diffing against the committed bundles.
 *
 * Usage:
 *   node scripts/check-build.js         # exit 0 = fresh, exit 1 = stale
 *   npm run check-build
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

// (source entrypoint, committed bundle) pairs. Maps and CSS are ignored --
// only the .js bundles are checked, since those are what Chrome executes.
const PAIRS = [
  [
    'extension/main/js/src/content.js',
    'extension/main/js/content.js'
  ],
  [
    'extension/main/js/src/event.js',
    'extension/main/js/event.js'
  ],
  [
    'extension/options/js/src/main.js',
    'extension/options/js/main.js'
  ]
];

function buildToTemp(entryRel, outDir) {
  const entryAbs = path.join(ROOT, entryRel);
  const base = path.basename(entryRel, '.js');
  const outFile = path.join(outDir, `${base}.js`);
  // Mirror the flags in package.json "build" script.
  execSync(
    `npx esbuild "${entryAbs}" --bundle --format=iife --minify --sourcemap --outfile="${outFile}" --platform=browser`,
    { cwd: ROOT, stdio: 'pipe', shell: true }
  );
  return outFile;
}

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smiley-check-'));
  let stale = false;

  try {
    for (const [entryRel, bundleRel] of PAIRS) {
      const bundleAbs = path.join(ROOT, bundleRel);
      if (!fs.existsSync(bundleAbs)) {
        console.error(`✗ Missing committed bundle: ${bundleRel}`);
        stale = true;
        continue;
      }

      const rebuilt = buildToTemp(entryRel, tmpDir);
      const rebuiltContent = fs.readFileSync(rebuilt, 'utf8');
      const committedContent = fs.readFileSync(bundleAbs, 'utf8');

      if (rebuiltContent !== committedContent) {
        console.error(`✗ Stale bundle: ${bundleRel} does not match source ${entryRel}`);
        stale = true;
      } else {
        console.log(`✓ Fresh: ${bundleRel}`);
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  if (stale) {
    console.error('\nBuild artifacts are out of sync with sources. Run `npm run build` and commit the result.');
    process.exit(1);
  }

  console.log('\nAll build artifacts are fresh.');
}

main();
