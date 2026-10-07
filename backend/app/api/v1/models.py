from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.ai_engine import ModelListResponse, ModelInfo
from backend.app.services.ai_engine_service import ai_engine_service

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", response_model=ModelListResponse)
def list_models() -> ModelListResponse:
    """Lists available AI models and their installation state."""
    return ai_engine_service.list_models()


@router.post("/{model_id}/install", response_model=ModelInfo)
def install_model(model_id: str) -> ModelInfo:
    """Triggers mock model installation."""
    model = ai_engine_service.install_model(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_id}' not found",
        )
    return model
