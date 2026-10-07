from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ProjectEntity:
    id: str
    name: str
    prompt: str
    negative_prompt: str
    model_name: str
    aspect_ratio: str
    resolution: str
    duration_seconds: int
    seed: Optional[int]
    status: str
    thumbnail_url: Optional[str]
    created_at: datetime
    updated_at: datetime
