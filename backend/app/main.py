from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.router import api_router
from backend.app.core.config import settings
from backend.app.core.database import db_manager
from backend.app.services.model_manager_service import model_manager_service
from backend.app.services.engines.hub import engine_hub


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup actions
    settings.init_directories()
    try:
        db_manager.initialize_schema()
        model_manager_service.initialize()
        engine_hub.initialize()
    except Exception as exc:
        print(f"[WARN] Database initialization skipped: {exc}")
    yield
    model_manager_service.shutdown()
    engine_hub.shutdown()
    # Shutdown actions
    print("[INFO] Shutting down Local AI Video Studio backend.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Local AI Video Studio - Python AI Core & Desktop Service Layer",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all localhost/tauri webview origins in desktop mode
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes under /api
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_url": f"{settings.API_PREFIX}/health",
    }
