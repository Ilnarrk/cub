# CubeSolver Android

This is an additive Android client for CubeSolver. It does not replace or modify the existing
`frontend/` and `backend/` applications. Shared domain constants, validation helpers, and the 3D
cube component are imported from the web frontend at build time; Android-only navigation, storage,
offline solving, and native configuration stay in this directory.

## Requirements

- Node.js 22+
- JDK 21
- Android Studio / Android SDK 36
- `ANDROID_HOME` configured, or `android/local.properties` created by Android Studio

## Commands

```powershell
npm install
npm test
npm run build
npm run android:sync
npm run android:debug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Signed release APK

1. Create a release keystore outside the repository.
2. Copy `keystore.properties.example` to `keystore.properties` and enter the keystore path and
   credentials. Both files are ignored by Git.
3. Run `npm run android:release`.

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Without
`keystore.properties`, the release build fails on purpose because unsigned APKs cannot be installed
on most devices.

## Troubleshooting install errors

If Android shows **«Ошибка синтаксического анализа пакета»** / **Problem parsing the package**:

1. Download the `.apk` asset from the GitHub Release, not the `.apk.sha256` checksum file.
2. Make sure the device runs **Android 10 (API 29) or newer** — that is the app minimum.
3. Re-download the APK if the file size does not match the published SHA-256 checksum.
4. For sideloading, allow installation from your browser or file manager in system settings.

## GitHub Releases

The workflow `.github/workflows/android-release.yml` builds, verifies, and publishes a signed APK
when a tag matching `android-v*` is pushed. It can also be started manually from the Actions tab.

Create these repository secrets under **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64` — release `.jks` encoded as a single-line Base64 value
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

PowerShell can encode the keystore without writing an intermediate file:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\secure\cubesolver-release.jks'))
```

Publish a stable release:

```powershell
git tag android-v1.0.0
git push origin android-v1.0.0
```

Tags must follow `android-vMAJOR.MINOR.PATCH`; suffixes such as `android-v1.1.0-rc.1` are published
as pre-releases. The workflow derives Android `versionName` and `versionCode` from the tag, runs the
offline solver tests and production dependency audit, verifies the APK signature, and attaches both
the APK and its SHA-256 checksum to the GitHub Release.

## Architecture

- Capacitor 8, package `com.cubesolver.app`
- Android 10+ (`minSdk 29`), `compileSdk/targetSdk 36`
- Hash-based routing for packaged web assets
- Capacitor Preferences for the current cube, solution, and step
- `cubejs` 1.3.2 running in a dedicated Web Worker
- No Android permissions and no network dependency

`cubejs` is distributed under the MIT license. Its pinned runtime and license are vendored in
`vendor/cubejs/`; the unused legacy `npm@6` dependency from the upstream package is intentionally
excluded from the Android production dependency tree.
