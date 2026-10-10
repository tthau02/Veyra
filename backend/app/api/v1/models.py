from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.ai_engine import ModelListResponse, ModelInfo
from backend.app.services.ai_engine_service import ai_engine_service
from backend.app.services.model_manager_service import model_manager_service

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", response_model=ModelListResponse)
def list_models() -> ModelListResponse:
    """Lists available AI models and their installation state based on actual local disk files."""
    return ai_engine_service.list_models()


@router.get("/{model_id}", response_model=ModelInfo)
def get_model(model_id: str) -> ModelInfo:
    model = ai_engine_service.get_model(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_id}' not found",
        )
    return model


@router.post("/{model_id}/install", response_model=ModelInfo)
async def install_model(model_id: str) -> ModelInfo:
    """Triggers model installation and background download."""
    model = await ai_engine_service.install_model(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_id}' not found",
        )
    return model


@router.get("/{model_id}/download-status")
def get_download_status(model_id: str) -> dict:
    status_info = model_manager_service.get_download_status(model_id)
    if not status_info:
        return {"status": "idle", "progress": 0}
    return status_info
