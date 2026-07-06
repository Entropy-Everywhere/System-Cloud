# Google Play Store Listing — System Cloud

## Store Details

**App name:** System Cloud
**Short description (80 chars):**
> A personal dashboard to manage your system's alters and track fronters.

**Full description:**
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
**Tags:** plural, system, DID, OSDD, mental health, journal

---

## Assets Required

| Asset | Size | Notes |
|-------|------|-------|
| Feature Graphic | 1024×500 | Required for store listing |
| Phone Screenshots | 1080×1920 | At least 2, max 8 |
| 7-inch Tablet | 1920×1200 | Optional |
| 10-inch Tablet | 1920×1280 | Optional |
| Icon | 512×512 | Already in `icons/icon-512.png` |
| Promo Video | 30s–2min | Optional .mp4 |

All screenshots should show the app in use: dashboard, alter profiles, fronter tracking, settings.

---

## Build Instructions

1. Open the `android/` folder in **Android Studio**
2. Replace `YOUR-DOMAIN.com` in `app/src/main/res/values/strings.xml` with your deployed PWA URL
3. Generate a **signed bundle** (Android App Bundle / .aab):
   - Build → Generate Signed Bundle / APK → Android App Bundle
   - Create or select a keystore
   - Set the signing key
4. Upload the `.aab` to Google Play Console

### Digital Asset Links

After deploying the PWA to your domain:
1. Get your SHA256 fingerprint:
   ```
   keytool -list -v -keystore your-keystore.jks -alias your-alias | findstr "SHA256"
   ```
2. Update `.well-known/assetlinks.json` with the fingerprint
3. Upload `assetlinks.json` to `https://YOUR-DOMAIN/.well-known/assetlinks.json`
4. Uncomment the `intent-filter` in `AndroidManifest.xml`
5. Rebuild
