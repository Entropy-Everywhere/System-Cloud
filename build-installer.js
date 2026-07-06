// Build a proper Windows installer using electron-winstaller (Squirrel.Windows)
// This creates a Setup.exe that installs System Cloud with:
//   - Start Menu shortcut
//   - Add/Remove Programs entry
//   - Desktop shortcut
//   - Auto-updater support (optional)

const { createWindowsInstaller } = require('electron-winstaller');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.join(__dirname, 'dist', 'System-Cloud-win32-x64');
const OUT_DIR = path.join(__dirname, 'dist', 'installer');

// Verify the app directory exists
if (!fs.existsSync(APP_DIR)) {
  console.error(`❌ App directory not found: ${APP_DIR}`);
  console.error('   Run `npm run build` first to create the Electron build.');
  process.exit(1);
}

async function buildInstaller() {
  console.log('🔧 Creating System Cloud installer...');
  console.log(`   Source: ${APP_DIR}`);
  console.log(`   Output: ${OUT_DIR}`);

  try {
    await createWindowsInstaller({
      appDirectory: APP_DIR,
      outputDirectory: OUT_DIR,
      authors: 'System Cloud',
      exe: 'System-Cloud.exe',
      description: 'System Cloud - A personal dashboard for plural systems',
      version: '1.0.0',
      title: 'System Cloud',
      name: 'SystemCloud',
      // Use our icon
      iconUrl: path.join(__dirname, 'icons', 'icon-512.png'),
      setupIcon: path.join(__dirname, 'icons', 'icon-512.ico'),
      // Loading GIF shown during install
      loadingGif: undefined,
      // No certificate = unsigned, still installable but shows "unknown publisher"
      certificateFile: undefined,
      // Skip auto-updater config for now
      remoteReleases: undefined,
      // Create desktop shortcut
      createDesktopShortcut: true,
      // Create start menu shortcut
      createStartMenuShortcut: true,
      // Shortcut name
      shortcutName: 'System Cloud',
      // Per-machine install (requires admin) or per-user
      noMsi: true,
    });

    console.log(`✅ Installer created!`);
    console.log(`   📁 ${OUT_DIR}`);
    
    // List the output files
    const files = fs.readdirSync(OUT_DIR);
    for (const f of files) {
      const stat = fs.statSync(path.join(OUT_DIR, f));
      const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
      console.log(`   📄 ${f} (${sizeMB} MB)`);
    }
    
    console.log('');
    console.log('🚀 Upload the Setup.exe to Itch.io!');
    console.log('   Users download and run it — it installs System Cloud properly.');
  } catch (err) {
    console.error('❌ Installer build failed:', err.message);
    process.exit(1);
  }
}

buildInstaller();
