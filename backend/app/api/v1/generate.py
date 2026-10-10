from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.core.config import settings
from backend.app.services.engines.hub import engine_hub, GenerationError
from backend.app.schemas.ai_engine import (
    VideoGenerationRequest,
    VideoGenerationResponse,
    JobStatusResponse,
)
from backend.app.services.ai_engine_service import ai_engine_service

router = APIRouter(prefix="/generate", tags=["Generation"])


@router.post("", response_model=VideoGenerationResponse)
def generate_video(req: VideoGenerationRequest) -> VideoGenerationResponse:
    """Dispatch real inference after validating model and local runtime."""
    if req.simulate_progress:
        raise HTTPException(status_code=400, detail="Chế độ mô phỏng không còn hỗ trợ.")
    try:
        return ai_engine_service.generate_video(req)
    except GenerationError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


@router.post("/simulate", response_model=JobStatusResponse)
def simulate_generation(req: VideoGenerationRequest) -> JobStatusResponse:
    """Retired simulation contract; never report fabricated output."""
    raise HTTPException(status_code=410, detail="Chế độ mô phỏng không còn hỗ trợ.")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str) -> JobStatusResponse:
    """Read persistent inference progress without changing job state."""
    try:
        return ai_engine_service.get_job_status(job_id)
    except GenerationError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc


@router.get("/jobs/{job_id}/video")
def get_video(job_id: str, download: bool = False) -> FileResponse:
    try:
        job = engine_hub.get_job_status(job_id)
    except GenerationError as exc:
        raise HTTPException(status_code=exc.code, detail=str(exc)) from exc
    if job.status != "completed":
        raise HTTPException(status_code=409, detail="Video chưa sẵn sàng.")
    path = (settings.OUTPUTS_DIR / f"{job_id}.mp4").resolve()
    if not path.is_relative_to(settings.OUTPUTS_DIR.resolve()):
        raise HTTPException(status_code=404, detail="Không tìm thấy video.")
    return FileResponse(path, media_type="video/mp4", filename=f"{job_id}.mp4", content_disposition_type="attachment" if download else "inline")
