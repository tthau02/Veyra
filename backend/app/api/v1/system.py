from fastapi import APIRouter
from backend.app.schemas.system import SystemInfoResponse
from backend.app.services.system_service import system_service

router = APIRouter(tags=["System"])


@router.get("/system/info", response_model=SystemInfoResponse)
def get_system_info() -> SystemInfoResponse:
    """Returns host operating system, hardware, CPU, RAM, and GPU status."""
    return system_service.get_system_info()
