# System Cloud — Mobile Distribution Guide

> **The quickest way to get System Cloud on your phone:**
> 1. Deploy the PWA to a free hosting service (GitHub Pages, Netlify, Vercel)
> 2. Visit the URL on your phone → "Add to Home Screen"
> 3. It works offline, looks like a real app, no store needed

But if you want a **downloadable APK** (for Itch.io, sideloading, etc.), keep reading.

---

## 📱 Option 1: APK Sideloading (Best for Itch.io)

Android lets you install apps directly from `.apk` files — no Google Play required.
Users just need to enable "Install from unknown sources" in settings.

### 🔄 Automated Build (Recommended)

This repo includes a **GitHub Actions workflow** that builds the APK for free:

1. Push your code to **GitHub**
2. Create a tag: `git tag v1.0.0 && git push --tags`
3. Go to your repo → **Actions** tab → workflow runs
4. Download the `System-Cloud-Android` artifact
5. Upload the `.apk` to Itch.io

The workflow is at `.github/workflows/build-all.yml`.

### 💻 Manual Build

**Prerequisites:** Java 17+, Android SDK 34, Node.js 20+

```bash
# Install dependencies
npm install @capacitor/core @capacitor/android @capacitor/cli
pip install Pillow

# Build the Android APK
npm run build-android

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 🧪 Testing the APK locally

```bash
# Install on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 Option 2: PWA (Works on ALL platforms, no install needed)

The app is already a fully-functional PWA. Host it free on:

| Service | How |
|---------|-----|
| **GitHub Pages** | Push to `gh-pages` branch or use Actions |
| **Netlify** | Drag `www/` folder to netlify.com |
| **Vercel** | Connect repo, auto-deploys |
| **Firebase Hosting** | `firebase deploy` |

Once live, users visit the URL on their phone → get an "Add to Home Screen" prompt → it appears as an app with the icon.

### PWA Advantages
- ✅ No installation barriers — just visit a URL
- ✅ Works offline (service worker caches everything)
- ✅ Push notifications (if added later)
- ✅ Works on iOS too (Safari → Share → Add to Home Screen)
- ✅ No app store review process

### PWA Limitations
- ❌ Can't appear in app store search results
- ❌ No background services on iOS
- ❌ Users must visit the URL first

---

## 🍏 Option 3: iOS (Free approach)

Apple requires a $99/year developer account to publish on the App Store.
For free distribution on iOS, the **PWA is the only option**:

1. Deploy to GitHub Pages / Netlify
2. Users open in **Safari**
3. Tap **Share** → **Add to Home Screen**
4. It appears as an app with the icon, works offline

---

## 📦 Which file to upload to Itch.io?

| Platform | File | How users install |
|----------|------|-------------------|
| **Android** | `SystemCloud.apk` | Download on phone → tap → install |
| **Windows** | `Setup.exe` | Download → run → appears in Start Menu |
| **macOS/Linux** | PWA URL | Visit in browser → Add to Home Screen |
| **iOS** | PWA URL | Safari → Share → Add to Home Screen |

For the best mobile experience on Itch.io, **upload the APK** — that's what
apps like Hivemind do. Android users can download and install it directly.
