from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator

ModelDownloadState = Literal["idle", "queued", "downloading", "verifying", "completed", "interrupted", "failed", "paused", "waiting_network"]
GenerationState = Literal["queued", "generating", "decoding", "muxing", "completed", "failed"]


class VideoGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    negative_prompt: Optional[str] = ""
    model_name: str = "Veyra-Diffusion-v1"
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    resolution: Literal["512p", "720p", "1080p"] = "720p"
    duration_seconds: Literal[5, 10] = 5
    seed: Optional[int] = Field(default=None, ge=0, le=4294967295)
    simulate_progress: bool = False
    engine_mode: Literal["local", "cloud"] = "local"

    @field_validator("prompt")
    @classmethod
    def strip_prompt(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Nhập mô tả video.")
        return value.strip()


class VideoGenerationResponse(BaseModel):
    status: str = "not_implemented"
    message: str = "AI video generation will be implemented in a later phase."
    job_id: Optional[str] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: GenerationState
    progress: int = Field(ge=0, le=100)
    current_step: str
    output_url: Optional[str] = None
    error_message: Optional[str] = None
    width: int | None = None
    height: int | None = None
    frame_count: int | None = None
    seed: int | None = None


class ModelInfo(BaseModel):
    id: str
    name: str
    type: str
    size_gb: float
    status: Literal["Installed", "Not Installed", "Downloading"]
    description: str
    download_progress: Optional[int] = None
    supported: bool = True
    download_status: ModelDownloadState = "idle"
    downloaded_bytes: int = 0
    total_bytes: int = 0
    error_message: str | None = None
    files_complete: bool = False


class ModelDownloadStatus(BaseModel):
    model_id: str
    status: ModelDownloadState = "idle"
    progress: int = Field(default=0, ge=0, le=100)
    downloaded_bytes: int = 0
    total_bytes: int = 0
    error_message: str | None = None


class ModelPreparation(BaseModel):
    model_id: str
    total_bytes: int
    remaining_bytes: int
    required_bytes: int


class ModelListResponse(BaseModel):
    models: list[ModelInfo]
