from typing import Optional, Literal
from pydantic import BaseModel, Field


class CloudProviderInfo(BaseModel):
    provider_id: str
    name: str
    description: str
    is_active: bool = False
    has_key: bool = False
    masked_key: Optional[str] = None
    credits_remaining: Optional[float] = None
    status: Literal["active", "unconfigured", "invalid_key", "error"] = "unconfigured"


class CloudProviderListResponse(BaseModel):
    providers: list[CloudProviderInfo]


class CloudProviderUpdate(BaseModel):
    api_key: str = Field(..., min_length=1)
    is_active: bool = True


class CloudProviderTestResponse(BaseModel):
    provider_id: str
    valid: bool
    message: str
    credits_remaining: Optional[float] = None
