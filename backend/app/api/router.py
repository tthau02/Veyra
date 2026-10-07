from fastapi import APIRouter
from backend.app.api.v1 import health, system, projects, models, generate

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(system.router)
api_router.include_router(projects.router)
api_router.include_router(models.router)
api_router.include_router(generate.router)
