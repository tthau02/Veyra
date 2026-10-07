# Tauri v2 Sidecar Packaging Guide

This reference explains how to package a Python FastAPI backend into a production Tauri sidecar.

---

## 1. Directory Structure for Sidecars

Place compiled binary executables in `src-tauri/binaries/`:

```
src-tauri/
├── binaries/
│   ├── veyra-backend-x86_64-pc-windows-msvc.exe
│   └── veyra-backend-aarch64-apple-darwin
└── tauri.conf.json
```

---

## 2. Spawning the Sidecar in Rust

Add `tauri-plugin-shell = "2"` to `src-tauri/Cargo.toml`.

In `src-tauri/src/lib.rs`:

```rust
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let sidecar = app.shell().sidecar("veyra-backend").unwrap();
            let (mut rx, mut child) = sidecar.spawn().expect("failed to spawn backend sidecar");
            
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    // Monitor backend stdout / stderr logs
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
```
