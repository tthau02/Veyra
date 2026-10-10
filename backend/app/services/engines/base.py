from abc import ABC, abstractmethod
from typing import Optional, Literal
from pydantic import BaseModel, Field


class GenerationParams(BaseModel):
    prompt: str = Field(..., min_length=1)
    negative_prompt: Optional[str] = ""
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    resolution: Literal["512p", "720p", "1080p"] = "720p"
    duration_seconds: int = 5
    seed: Optional[int] = None
    model_or_provider_id: str = "model-animatediff"
    engine_mode: Literal["local", "cloud"] = "local"


class VideoGenerationResult(BaseModel):
    job_id: str
    status: Literal["queued", "generating", "completed", "failed"]
    video_path: Optional[str] = None
    progress: int = 0
    current_step: str = ""
    error_message: Optional[str] = None


class BaseVideoEngine(ABC):
    """Abstract interface for Video Synthesis Engines."""

    @abstractmethod
    async def generate_video(self, params: GenerationParams, job_id: str) -> VideoGenerationResult:
        """Start or execute video generation task."""
        pass

    @abstractmethod
    def is_available(self) -> tuple[bool, str]:
        """Check if engine requirements (CUDA, PyTorch weights, or API Key) are met."""
        pass
