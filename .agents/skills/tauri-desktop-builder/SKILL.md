---
name: tauri-desktop-builder
description: >-
  Use this skill when configuring Tauri desktop windows, packaging production executables,
  bundling Python sidecar binaries with PyInstaller, or managing cross-platform installers (EXE, MSI, DMG).
---

# Tauri Desktop Builder Skill

This skill documents how to package, bundle, and release Veyra as a native standalone desktop application for Windows and macOS.

---

## 1. Tauri v2 Desktop Configuration

The primary configuration is defined in [`src-tauri/tauri.conf.json`](file:///d:/CodeDenChet/Veyra/src-tauri/tauri.conf.json):

* **Window dimensions**: 1280 width x 820 height (min width 1024, min height 700).
* **Center**: `true` on display open.
* **Frontend Dist**: `../frontend/dist`.
* **Dev URL**: `http://localhost:5173`.

---

## 2. Python Sidecar Bundling Architecture

To distribute Veyra as a single installer that does not require users to install Python:

1. **Compile Python Backend with PyInstaller**:
   ```powershell
   pyinstaller --onedir --name veyra-backend backend/app/main.py
   ```
2. **Rename to Target-Triple Suffix**:
   Tauri requires sidecars to have the target triple suffix:
   - Windows x64: `veyra-backend-x86_64-pc-windows-msvc.exe` (or `...-windows-gnu.exe`)
   - macOS Apple Silicon: `veyra-backend-aarch64-apple-darwin`
   - macOS Intel: `veyra-backend-x86_64-apple-darwin`
3. **Configure `bundle.externalBin` in `tauri.conf.json`**:
   ```json
   {
     "bundle": {
       "externalBin": ["binaries/veyra-backend"]
     }
   }
   ```
4. **Rust Lifecycle Supervision**:
   In `src-tauri/src/lib.rs`, use `tauri_plugin_shell` to spawn the sidecar on app startup and terminate it when the window is closed.

---

## 3. Production Build Commands

```powershell
# 1. Compile React production assets
npm run build:frontend

# 2. Compile standalone Tauri desktop app
npm run tauri:build
```

Outputs will be generated in `src-tauri/target/release/`.

---

## 4. References

- [Sidecar Bundling Guide](./references/sidecar-guide.md)
