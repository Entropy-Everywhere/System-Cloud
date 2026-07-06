# Microsoft Store Listing — System Cloud

## Approach Options

### Option 1: Electron MSIX Package (Recommended)
Uses the existing Electron build wrapped in an MSIX installer.

**Prerequisites:**
- Windows SDK (get it from https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)
- A code signing certificate (or self-signed for sideloading)

**Steps:**
1. Open a **Developer Command Prompt for VS 2022**
2. Run the packaging script:
   ```
   powershell -ExecutionPolicy Bypass -File windows\package-msix.ps1
   ```
3. Sign the `.msix`:
   ```
   signtool sign /a /fd SHA256 /f your-cert.pfx /p password dist\System-Cloud.msix
   ```
4. Upload to Partner Center

### Option 2: PWABuilder Windows Package
1. Go to https://pwabuilder.com
2. Enter your deployed PWA URL
3. Download the Windows package
4. Open in Visual Studio and publish

---

## Store Details

**App name:** System Cloud
**Description:**
> System Cloud is a private, secure dashboard designed for plural systems to manage alters, track fronters, and organize their inner world.
>
> Features:
> • Full alter directory with profiles, roles, and descriptions
> • Fronter tracking — log who's fronting in real time
> • Custom interaction statuses and privacy settings
> • Markdown support for rich descriptions
> • Data stored locally on your device (optional Firebase sync)
> • Offline-capable — works without internet
> • Beautiful dark theme with customizable accent colors
> • Completely private — your data stays yours

**Category:** Productivity
**Price:** Free
**Trial:** None (free app)

---

## Assets Required

| Asset | Size | Notes |
|-------|------|-------|
| App icon | 300×300 | PNG, transparent background |
| Small Tile | 71×71 | Use `icons/icon-192.png` resized |
| Medium Tile | 150×150 | Use `icons/icon-192.png` |
| Wide Tile | 310×150 | Create from `icons/icon-512.png` |
| Large Tile | 310×310 | Create from `icons/icon-512.png` |
| Screenshots | 1366×768 min | At least 1 |
| Store Logo | 50×50 | PNG |

The packaging script in `windows/package-msix.ps1` handles all of this automatically.
