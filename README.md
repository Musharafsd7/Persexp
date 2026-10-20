# PersExp

Personal finance app: expense tracking, receipt vault with on-device OCR, stock watchlist with price-drop alerts.
Next.js (static export) wrapped as an Android app with Capacitor. Data is stored on the device (IndexedDB).

## Get the APK (no Android Studio needed)
1. Create a new GitHub repository and push this folder to it (branch `main`).
2. Open the repo's **Actions** tab. The **Build Android APK** workflow runs automatically (about 5–8 min).
3. Download `PersExp.apk` from the repo's **Releases** page (tag `latest`) on your phone, open it, and allow
   "Install unknown apps" when Android asks.

## Build locally
Requires Node 22, pnpm, JDK 21 and the Android SDK.
```
pnpm install
pnpm apk        # -> android/app/build/outputs/apk/debug/app-debug.apk
```

## Develop in the browser
```
pnpm dev
```
(Stock quotes need the native app; in a browser they fall back to "—" because of CORS.)
