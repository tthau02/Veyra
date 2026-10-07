from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    prompt: str = Field(..., min_length=1)
    negative_prompt: Optional[str] = ""
    model_name: str = "Veyra-Diffusion-v1"
    aspect_ratio: str = "16:9"
    resolution: str = "720p"
    duration_seconds: int = 5
    seed: Optional[int] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    model_name: Optional[str] = None
    aspect_ratio: Optional[str] = None
    resolution: Optional[str] = None
    duration_seconds: Optional[int] = None
    seed: Optional[int] = None
    status: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: str
    status: str = "draft"
    thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    total: int
    items: list[ProjectResponse]
