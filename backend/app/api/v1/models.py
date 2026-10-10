from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.ai_engine import ModelListResponse, ModelInfo, ModelDownloadStatus, ModelPreparation
from backend.app.services.ai_engine_service import ai_engine_service
from backend.app.services.model_manager_service import model_manager_service, ModelDownloadError

router = APIRouter(prefix="/models", tags=["Models"])


@router.delete("/{model_id}", response_model=ModelInfo)
def delete_model(model_id: str) -> ModelInfo:
    try:
        return model_manager_service.delete_model(model_id)
    except ModelDownloadError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


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


@router.post("/{model_id}/prepare", response_model=ModelPreparation)
def prepare_model(model_id: str) -> ModelPreparation:
    try:
        return model_manager_service.prepare(model_id)
    except ModelDownloadError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


@router.post("/{model_id}/install", response_model=ModelDownloadStatus, status_code=202)
def install_model(model_id: str) -> ModelDownloadStatus:
    try:
        return model_manager_service.start_model_download(model_id)
    except ModelDownloadError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


@router.get("/{model_id}/download-status", response_model=ModelDownloadStatus)
def get_download_status(model_id: str) -> ModelDownloadStatus:
    try:
        model_manager_service.get_model(model_id)
        return model_manager_service.get_download_status(model_id)
    except ModelDownloadError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


@router.post("/{model_id}/pause", response_model=ModelDownloadStatus)
def pause_model(model_id: str) -> ModelDownloadStatus:
    try:
        return model_manager_service.pause_download(model_id)
    except ModelDownloadError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


@router.post("/{model_id}/resume", response_model=ModelDownloadStatus, status_code=202)
def resume_model(model_id: str) -> ModelDownloadStatus:
    try:
        return model_manager_service.resume_download(model_id)
    except ModelDownloadError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc
