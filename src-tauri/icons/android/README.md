# Android launcher icon source

`ic_launcher_foreground.png` is a transparent 432×432 layer with a safe inset;
`ic_launcher_background.png` is the opaque cobalt background layer. The adaptive
icon XML keeps the mark inside Android's 66% safe zone after `tauri android init`.

When regenerating the Android project, copy these two PNGs into
`src-tauri/gen/android/app/src/main/res/drawable/` and the XML into
`mipmap-anydpi-v26/`, or run the icon generation step from the release workflow.
