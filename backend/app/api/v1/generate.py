from fastapi import APIRouter
from backend.app.schemas.ai_engine import (
    VideoGenerationRequest,
    VideoGenerationResponse,
    JobStatusResponse,
)
from backend.app.services.ai_engine_service import ai_engine_service

router = APIRouter(prefix="/generate", tags=["Generation"])


@router.post("", response_model=VideoGenerationResponse)
def generate_video(req: VideoGenerationRequest) -> VideoGenerationResponse:
    """
    Standard Phase 1 endpoint.
    Returns not_implemented stub as specified in requirements.
    """
    return ai_engine_service.generate_video(req)


@router.post("/simulate", response_model=JobStatusResponse)
def simulate_generation(req: VideoGenerationRequest) -> JobStatusResponse:
    """
    Simulates a video generation job for UI state and progress verification.
    """
    return ai_engine_service.start_mock_job(req)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str) -> JobStatusResponse:
    """
    Retrieves the status and progress of a mock generation job.
    """
    return ai_engine_service.get_mock_job_status(job_id)
