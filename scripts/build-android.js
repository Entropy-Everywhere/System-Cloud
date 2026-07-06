/**
 * Build script for System Cloud Android APK
 * 
 * This script:
 * 1. Creates a www/ directory with the web files
 * 2. Syncs with Capacitor
 * 3. Builds the Android APK using Gradle
 * 
 * Run: node scripts/build-android.js
 * Requires: Java 17+, Android SDK
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WWW_DIR = path.join(ROOT, 'www');
const ANDROID_DIR = path.join(ROOT, 'android');
const PUBLIC_DIR = path.join(ANDROID_DIR, 'app', 'src', 'main', 'assets', 'public');

// Files and folders to include in the mobile build (exclude dev-only stuff)
const INCLUDE_PATTERNS = [
  'index.html',
  'style.css',
  'manifest.json',
  'service-worker.js',
  'icons',
  'pages',
  'favicon.ico',
];

function log(msg) { console.log(`[build-android] ${msg}`); }

function cleanWWW() {
  log('Cleaning www/ ...');
  if (fs.existsSync(WWW_DIR)) {
    fs.rmSync(WWW_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(WWW_DIR, { recursive: true });
}

function copyWebFiles() {
  log('Copying web files to www/ ...');
  for (const pattern of INCLUDE_PATTERNS) {
    const src = path.join(ROOT, pattern);
    const dest = path.join(WWW_DIR, pattern);
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true, force: true });
        log(`  📁 ${pattern}/ → www/${pattern}/`);
      } else {
        fs.copyFileSync(src, dest);
        log(`  📄 ${pattern} → www/${pattern}`);
      }
    } else {
      log(`  ⚠️  ${pattern} not found, skipping`);
    }
  }
}

function updateCapacitorConfig() {
  log('Updating capacitor.config.json ...');
  const configPath = path.join(ROOT, 'capacitor.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  config.webDir = 'www';
  config.appName = 'System Cloud';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  log('  ✅ webDir set to www');
}

function syncAndroid() {
  log('Syncing with Capacitor...');
  execSync('npx cap sync android', { cwd: ROOT, stdio: 'inherit' });
  log('  ✅ Sync complete');
}

function copyCustomIcons() {
  log('Copying custom icons to Android project...');
  const iconDir = path.join(ROOT, 'icons');
  const mipmapDirs = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };
  
  // Use Python to resize if available
  for (const [dir, size] of Object.entries(mipmapDirs)) {
    const targetDir = path.join(ANDROID_DIR, 'app', 'src', 'main', 'res', dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  }
  
  try {
    execSync(`python -c "
from PIL import Image
import os
src = Image.open('${iconDir.replace(/\\/g, '/')}/SystemCloudLogo.png')
base = '${ANDROID_DIR.replace(/\\/g, '/')}/app/src/main/res'
sizes = {'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192}
for folder, size in sizes.items():
    img = src.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(base, folder, 'ic_launcher.png'), 'PNG')
    img.save(os.path.join(base, folder, 'ic_launcher_round.png'), 'PNG')
    print(f'  {folder}/ic_launcher.png ({size}x{size})')
"`, { stdio: 'inherit' });
    log('  ✅ Icons generated');
  } catch (e) {
    log('  ⚠️  Could not generate icons (Pillow not available?), using defaults');
  }
}

function buildAPK() {
  log('Building Android APK...');
  log('This requires Java 17+ and Android SDK 34.');
  log('Running on a GitHub Actions runner? These are pre-installed!\n');
  
  try {
    execSync('npx cap build android --keystorepath ""', { 
      cwd: ROOT, 
      stdio: 'inherit',
      env: { ...process.env, CAPACITOR_ANDROID_STUDIO_PATH: '' }
    });
    log('  ✅ Build complete!');
  } catch (e) {
    // Fallback to direct Gradle
    log('  Trying direct Gradle build...');
    try {
      if (process.platform === 'win32') {
        execSync('.\\gradlew.bat assembleDebug', { cwd: ANDROID_DIR, stdio: 'inherit' });
      } else {
        execSync('./gradlew assembleDebug', { cwd: ANDROID_DIR, stdio: 'inherit' });
      }
      log('  ✅ Gradle build complete!');
    } catch (e2) {
      log('  ❌ Gradle build failed. Is Android SDK installed?');
      log('  Error: ' + e2.message);
      process.exit(1);
    }
  }
}

function locateAPK() {
  const apkDir = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk');
  const apks = [];
  
  function findAPK(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isDirectory()) findAPK(fp);
      else if (f.endsWith('.apk')) apks.push(fp);
    }
  }
  
  findAPK(apkDir);
  
  if (apks.length > 0) {
    log('\n📱 Android APK(s) generated:');
    for (const apk of apks) {
      const size = (fs.statSync(apk).size / 1024 / 1024).toFixed(1);
      log(`  📄 ${apk} (${size} MB)`);
    }
  } else {
    log('\n⚠️  No APK found. Check the build output above for errors.');
  }
}

// ── Main ──
console.log('\n═══ System Cloud Android Build ═══\n');

const args = process.argv.slice(2);
const skipBuild = args.includes('--sync-only');

cleanWWW();
copyWebFiles();
updateCapacitorConfig();
syncAndroid();
copyCustomIcons();

if (!skipBuild) {
  buildAPK();
  locateAPK();
}

console.log('\n═══ Done ═══\n');
