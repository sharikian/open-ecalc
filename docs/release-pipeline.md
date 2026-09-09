# Release pipeline

The workflow in `.github/workflows/release.yml` runs for `workflow_dispatch` and tags matching `v*`.

## Artifacts

- `open-ecalc-android-arm-universal.apk`: one signed APK containing only ARMv8a (`arm64-v8a`) and ARMv7 (`armeabi-v7a`). x86 and x86_64 are intentionally excluded to keep the download smaller.
- `open-ecalc-windows`: Windows NSIS installer bundle.
- `open-ecalc-macos-x86_64` and `open-ecalc-macos-arm64`: macOS DMG bundles.

Tagged runs also publish the collected files to a GitHub Release. Desktop packages are unsigned by default; platform certificates can be added later without changing the Android signing flow.

## Required repository secrets

The keystore itself is stored only as the masked `ANDROID_KEYSTORE_BASE64` secret. The workflow also requires `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, and `ANDROID_KEY_ALIAS`. It creates `src-tauri/gen/android/keystore.properties` only inside the ephemeral runner and never commits it.
