"""
Local AI Video Studio - Backend Runner
Starts the FastAPI application service on 127.0.0.1:8000.
"""

import sys
import os
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn
from backend.app.core.config import settings

def main():
    print(f"==================================================")
    print(f"  {settings.APP_NAME} - Backend Service")
    print(f"  Host: http://{settings.HOST}:{settings.PORT}")
    print(f"  API Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"==================================================")
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info",
    )

if __name__ == "__main__":
    main()
