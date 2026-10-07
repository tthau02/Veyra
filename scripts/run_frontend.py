"""
Local AI Video Studio - Frontend Dev Server Runner
Starts Vite development server on http://localhost:5173.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

def main():
    print("==================================================")
    print("  Starting Frontend Vite Dev Server")
    print("==================================================")
    try:
        subprocess.run(["npm", "run", "dev"], cwd=str(FRONTEND_DIR), check=True, shell=True)
    except KeyboardInterrupt:
        print("\n[INFO] Frontend server stopped.")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to run frontend server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
