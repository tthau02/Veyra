"""
Tauri CLI wrapper that ensures Cargo and MinGW toolchain are in PATH.
"""

import os
import sys
import subprocess
from pathlib import Path

def ensure_toolchain_path():
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

def main():
    ensure_toolchain_path()
    cmd = ["npx", "tauri"] + sys.argv[1:]
    project_root = Path(__file__).resolve().parent.parent
    try:
        proc = subprocess.run(cmd, cwd=str(project_root), shell=True)
        sys.exit(proc.returncode)
    except KeyboardInterrupt:
        sys.exit(0)

if __name__ == "__main__":
    main()
