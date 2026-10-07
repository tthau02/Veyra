import asyncio
import time
import uuid
from typing import Optional
from backend.app.schemas.ai_engine import (
    VideoGenerationRequest,
    VideoGenerationResponse,
    JobStatusResponse,
    ModelInfo,
    ModelListResponse,
)


class AIEngineService:
    """
    AI Engine Service Stub for Phase 1.
    Provides contract interfaces and mock job orchestrator for UI verification.
    """

    def __init__(self) -> None:
        self._models: dict[str, ModelInfo] = {
            "model-example": ModelInfo(
                id="model-example",
                name="Example Video Model",
                type="Text to Video",
                size_gb=0.0,
                status="Not Installed",
                description="Lightweight reference model specification for architectural verification.",
            ),
            "model-veyra-v1": ModelInfo(
                id="model-veyra-v1",
                name="Veyra Diffusion v1",
                type="Text to Video",
                size_gb=4.2,
                status="Installed",
                description="Default latent diffusion pipeline optimized for local generation.",
            ),
            "model-animatediff": ModelInfo(
                id="model-animatediff",
                name="AnimateDiff Lightning",
                type="Image/Text to Video",
                size_gb=2.8,
                status="Not Installed",
                description="High-speed distilled motion adapter for rapid prototype sequences.",
            ),
            "model-cogvideox": ModelInfo(
                id="model-cogvideox",
                name="CogVideoX-2B Stub",
                type="Text to Video",
                size_gb=5.1,
                status="Not Installed",
                description="Next-generation transformer-based video synthesis architecture.",
            ),
        }
        self._jobs: dict[str, dict] = {}

    def generate_video(self, request: VideoGenerationRequest) -> VideoGenerationResponse:
        """
        Phase 1 contract endpoint. Returns standard not_implemented response.
        """
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        return VideoGenerationResponse(
            status="not_implemented",
            message="AI video generation will be implemented in a later phase.",
            job_id=job_id,
        )

    def list_models(self) -> ModelListResponse:
        return ModelListResponse(models=list(self._models.values()))

    def get_model(self, model_id: str) -> Optional[ModelInfo]:
        return self._models.get(model_id)

    def install_model(self, model_id: str) -> Optional[ModelInfo]:
        if model_id in self._models:
            model = self._models[model_id]
            self._models[model_id] = ModelInfo(
                id=model.id,
                name=model.name,
                type=model.type,
                size_gb=model.size_gb,
                status="Installed",
                description=model.description,
            )
            return self._models[model_id]
        return None

    def start_mock_job(self, request: VideoGenerationRequest) -> JobStatusResponse:
        """
        Allows frontend to test realistic job state machines (Queued -> Generating -> Completed)
        without invoking heavy deep learning hardware.
        """
        job_id = f"mock-job-{uuid.uuid4().hex[:8]}"
        job_data = {
            "job_id": job_id,
            "created_at": time.time(),
            "prompt": request.prompt,
            "resolution": request.resolution,
            "duration": request.duration_seconds,
        }
        self._jobs[job_id] = job_data
        return JobStatusResponse(
            job_id=job_id,
            status="queued",
            progress=0,
            current_step="Initializing latent canvas and parameters...",
        )

    def get_mock_job_status(self, job_id: str) -> JobStatusResponse:
        job = self._jobs.get(job_id)
        if not job:
            return JobStatusResponse(
                job_id=job_id,
                status="failed",
                progress=0,
                current_step="Job not found",
                error_message="Unknown job identifier",
            )

        elapsed = time.time() - job["created_at"]
        if elapsed < 2.0:
            return JobStatusResponse(
                job_id=job_id,
                status="queued",
                progress=int(elapsed * 10),
                current_step="Queued in scheduler pipeline...",
            )
        elif elapsed < 7.0:
            progress = min(95, int(20 + ((elapsed - 2.0) / 5.0) * 75))
            step = f"Sampling diffusion latent frames (step {int(progress / 5)}/20)..."
            return JobStatusResponse(
                job_id=job_id,
                status="generating",
                progress=progress,
                current_step=step,
            )
        else:
            return JobStatusResponse(
                job_id=job_id,
                status="completed",
                progress=100,
                current_step="Simulation render complete (Placeholder preview ready)",
                output_url=f"/outputs/{job_id}.mp4",
            )


ai_engine_service = AIEngineService()
