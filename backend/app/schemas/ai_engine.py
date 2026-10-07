from typing import Optional, Literal
from pydantic import BaseModel, Field


class VideoGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    negative_prompt: Optional[str] = ""
    model_name: str = "Veyra-Diffusion-v1"
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    resolution: Literal["512p", "720p", "1080p"] = "720p"
    duration_seconds: Literal[5, 10] = 5
    seed: Optional[int] = None
    simulate_progress: bool = False


class VideoGenerationResponse(BaseModel):
    status: str = "not_implemented"
    message: str = "AI video generation will be implemented in a later phase."
    job_id: Optional[str] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["queued", "generating", "completed", "failed"]
    progress: int = Field(ge=0, le=100)
    current_step: str
    output_url: Optional[str] = None
    error_message: Optional[str] = None


class ModelInfo(BaseModel):
    id: str
    name: str
    type: str
    size_gb: float
    status: Literal["Installed", "Not Installed", "Downloading"]
    description: str
    download_progress: Optional[int] = None


class ModelListResponse(BaseModel):
    models: list[ModelInfo]
