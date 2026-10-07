"""
Master Development Orchestrator for Local AI Video Studio (Veyra).
Starts Python FastAPI backend, waits for health check, and launches Tauri desktop window.
"""

import os
import sys
import time
import signal
import argparse
import subprocess
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

PROJECT_ROOT = Path(__file__).resolve().parent.parent

def ensure_toolchain_path():
    """Ensure ~/.cargo/bin and w64devkit/bin are in PATH for Tauri/Rust toolchain."""
    userprofile = Path(os.environ.get("USERPROFILE", ""))
    cargo_bin = userprofile / ".cargo" / "bin"
    mingw_bin = userprofile / "w64devkit" / "bin"
    path_var = os.environ.get("PATH", "")
    prepend = []
    if cargo_bin.exists() and str(cargo_bin) not in path_var:
        prepend.append(str(cargo_bin))
    if mingw_bin.exists() and str(mingw_bin) not in path_var:
        prepend.append(str(mingw_bin))
    if prepend:
        os.environ["PATH"] = ";".join(prepend) + ";" + path_var

def wait_for_backend(url: str, timeout_sec: int = 15) -> bool:
    """Polls backend health endpoint until it responds or times out."""
    print(f"[DEV] Checking backend health at {url}...")
    start_time = time.time()
    while time.time() - start_time < timeout_sec:
        try:
            with urlopen(url, timeout=1.5) as resp:
                if resp.status == 200:
                    print("[DEV] Backend service is healthy and online.")
                    return True
        except (URLError, TimeoutError, ConnectionRefusedError):
            pass
        time.sleep(0.5)
    return False

def main():
    parser = argparse.ArgumentParser(description="Veyra Desktop Studio Dev Orchestrator")
    parser.add_argument("--no-tauri", action="store_true", help="Run in web mode without launching Tauri desktop window")
    args = parser.parse_args()

    ensure_toolchain_path()

    print("================================================================")
    print("       Local AI Video Studio (Veyra) - Development Mode         ")
    print("================================================================")

    # 1. Start Python backend service
    backend_script = PROJECT_ROOT / "scripts" / "run_backend.py"
    python_exe = sys.executable

    print(f"[DEV] Launching FastAPI backend ({python_exe})...")
    backend_proc = subprocess.Popen(
        [python_exe, str(backend_script)],
        cwd=str(PROJECT_ROOT),
    )

    # 2. Wait for backend health endpoint
    health_url = "http://127.0.0.1:8000/api/health"
    if not wait_for_backend(health_url, timeout_sec=12):
        print("[WARN] Backend took longer than expected to report health. Continuing anyway...")

    desktop_proc = None
    try:
        if args.no_tauri:
            print("[DEV] Running in browser dev mode (Vite only)...")
            frontend_dir = PROJECT_ROOT / "frontend"
            desktop_proc = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=str(frontend_dir),
                shell=True,
            )
        else:
            print("[DEV] Launching Tauri Desktop Application...")
            desktop_proc = subprocess.Popen(
                ["npm", "run", "tauri", "dev"],
                cwd=str(PROJECT_ROOT),
                shell=True,
            )

        # Wait for desktop app to exit
        if desktop_proc:
            desktop_proc.wait()

    except KeyboardInterrupt:
        print("\n[DEV] Received shutdown signal.")
    finally:
        print("[DEV] Terminating background processes...")
        if desktop_proc and desktop_proc.poll() is None:
            try:
                desktop_proc.terminate()
            except Exception:
                pass
        if backend_proc and backend_proc.poll() is None:
            try:
                backend_proc.terminate()
                backend_proc.wait(timeout=3)
            except Exception:
                backend_proc.kill()
        print("[DEV] Studio development session stopped cleanly.")

if __name__ == "__main__":
    main()
