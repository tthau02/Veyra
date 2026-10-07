from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "Local AI Video Studio"
    version: str = "0.1.0"


class GPUInfo(BaseModel):
    name: str = "Not Detected"
    cuda_available: bool = False
    device_count: int = 0
    driver_version: Optional[str] = None
    vram_total_gb: Optional[float] = None
    vram_free_gb: Optional[float] = None


class SystemInfoResponse(BaseModel):
    python_version: str
    os_name: str
    os_release: str
    os_architecture: str
    cpu_name: str
    cpu_cores_physical: int
    cpu_cores_logical: int
    cpu_usage_percent: float
    ram_total_gb: float
    ram_available_gb: float
    ram_usage_percent: float
    cuda_available: bool
    gpu: GPUInfo
    backend_status: str = "online"
