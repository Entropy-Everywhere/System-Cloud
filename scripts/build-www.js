/**
 * Build the www/ directory for Capacitor mobile builds
 * Copies all web files needed for the mobile app.
 * Run: node scripts/build-www.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WWW_DIR = path.join(ROOT, 'www');

const INCLUDE = [
  'index.html',
  'style.css',
  'manifest.json',
  'service-worker.js',
  'icons',
  'pages',
];

// Clean www
if (fs.existsSync(WWW_DIR)) {
  fs.rmSync(WWW_DIR, { recursive: true, force: true });
}
fs.mkdirSync(WWW_DIR, { recursive: true });

// Copy files
for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  const dest = path.join(WWW_DIR, item);
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true, force: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`  ✓ ${item}`);
  } else {
    console.log(`  ⚠ ${item} not found`);
  }
}

console.log(`\n✅ www/ directory created (${WWW_DIR})`);
console.log('   Run: npx cap sync android');
