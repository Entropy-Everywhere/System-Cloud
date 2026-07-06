# Apple App Store Listing — System Cloud

> ⚠️ **Note:** iOS builds require **macOS** with **Xcode**. These instructions guide you through the process.

## Approach Options

### Option 1: PWABuilder (Easiest)
1. Go to https://pwabuilder.com
2. Enter your deployed PWA URL
3. Click "Package for Stores"
4. Download the iOS package
5. Open in Xcode and publish

### Option 2: Manual WKWebView Wrapper
Create a basic iOS app in Xcode that loads the PWA in a `WKWebView`:
1. Xcode → New App (SwiftUI or UIKit)
2. Add a `WKWebView` loading your PWA URL
3. Set the bundle ID to `com.systemcloud.app`
4. Configure app icon using `icons/apple-touch-icon.png`
5. Build and archive

---

## Store Details

**App name:** System Cloud
**Subtitle (30 chars):** Plural system manager
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

**Keywords:** plural, system, DID, OSDD, mental health, journal, alters, fronting
**Category:** Productivity
**Age Rating:** 17+ (medical/health reference)

---

## Assets Required

| Asset | Size | Notes |
|-------|------|-------|
| App Icon | 1024×1024 | Generate from `icons/icon-512.png` |
| iPhone Screenshots | 1242×2688 (6.5") | At least 2 |
| iPhone Screenshots | 1170×2532 (6.1") | Optional |
| iPad Screenshots | 2048×2732 | At least 2 |
| App Preview (video) | 886×1920 | Optional 30s .mov |

---

## Build Steps (macOS required)

1. Create a new Xcode project (SwiftUI App)
2. Add a `WKWebView` that loads `https://your-domain.com/index.html?source=pwa`
3. Set `UIStatusBarStyle` to `.lightContent`
4. Set bundle ID: `com.systemcloud.app`
5. Add icons from `icons/` folder
6. Product → Archive → Distribute App → App Store Connect
