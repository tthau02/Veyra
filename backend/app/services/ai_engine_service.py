import asyncio
import uuid
from typing import Optional
from backend.app.schemas.ai_engine import (
    VideoGenerationRequest,
    VideoGenerationResponse,
    JobStatusResponse,
    ModelInfo,
    ModelListResponse,
)
from backend.app.services.model_manager_service import model_manager_service
from backend.app.services.engines.base import GenerationParams
from backend.app.services.engines.hub import engine_hub


class AIEngineService:
    """
    Central AI Engine Service for Veyra Phase 2.
    Integrates actual filesystem model management and unified engine hub (Local + Cloud).
    """

    def generate_video(self, request: VideoGenerationRequest) -> VideoGenerationResponse:
        params = GenerationParams(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            aspect_ratio=request.aspect_ratio,
            resolution=request.resolution,
            duration_seconds=request.duration_seconds,
            seed=request.seed,
            model_or_provider_id=request.model_name,
            engine_mode="local",
        )
        job_status = engine_hub.start_job(params)
        return VideoGenerationResponse(
            status="started",
            message="Tác vụ sinh video đã được gửi đến Engine Hub.",
            job_id=job_status.job_id,
        )

    def list_models(self) -> ModelListResponse:
        return model_manager_service.list_models()

    def get_model(self, model_id: str) -> Optional[ModelInfo]:
        return model_manager_service.get_model(model_id)

    async def install_model(self, model_id: str) -> Optional[ModelInfo]:
        res = await model_manager_service.start_model_download(model_id)
        return model_manager_service.get_model(model_id)

    def start_mock_job(self, request: VideoGenerationRequest) -> JobStatusResponse:
        params = GenerationParams(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            aspect_ratio=request.aspect_ratio,
            resolution=request.resolution,
            duration_seconds=request.duration_seconds,
            seed=request.seed,
            model_or_provider_id=request.model_name,
            engine_mode="local",
        )
        return engine_hub.start_job(params)

    def get_mock_job_status(self, job_id: str) -> JobStatusResponse:
        return engine_hub.get_job_status(job_id)


ai_engine_service = AIEngineService()
