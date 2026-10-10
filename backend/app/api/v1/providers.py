from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.cloud_provider import (
    CloudProviderListResponse,
    CloudProviderUpdate,
    CloudProviderTestResponse,
)
from backend.app.services.cloud_provider_service import cloud_provider_service

router = APIRouter(prefix="/providers", tags=["Cloud Providers"])


@router.get("", response_model=CloudProviderListResponse)
def list_providers() -> CloudProviderListResponse:
    """List all supported Cloud Video AI providers and configuration state."""
    return cloud_provider_service.list_providers()


@router.post("/{provider_id}", status_code=status.HTTP_200_OK)
def save_provider_key(provider_id: str, payload: CloudProviderUpdate) -> dict:
    """Save or update an API Key for a cloud provider in SQLite."""
    success = cloud_provider_service.save_provider_key(
        provider_id=provider_id,
        api_key=payload.api_key,
        is_active=payload.is_active,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nhà cung cấp '{provider_id}' không được hỗ trợ.",
        )
    return {"status": "success", "message": f"Đã lưu API Key cho {provider_id}."}


@router.delete("/{provider_id}", status_code=status.HTTP_200_OK)
def remove_provider_key(provider_id: str) -> dict:
    """Remove configured API Key for a provider."""
    cloud_provider_service.remove_provider_key(provider_id)
    return {"status": "success", "message": f"Đã xóa cấu hình API Key của {provider_id}."}


@router.post("/{provider_id}/test", response_model=CloudProviderTestResponse)
def test_provider_key(provider_id: str, payload: CloudProviderUpdate) -> CloudProviderTestResponse:
    """Verify validity of an API key."""
    return cloud_provider_service.test_provider_key(provider_id, payload.api_key)
