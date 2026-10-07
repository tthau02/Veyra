import os
import platform
import shutil
import subprocess
import sys
import psutil
from backend.app.schemas.system import GPUInfo, SystemInfoResponse


class SystemService:
    """Provides system telemetry, resource detection, and GPU/CUDA capability checking."""

    @staticmethod
    def get_gpu_info() -> GPUInfo:
        """
        Safely inspects GPU and CUDA capabilities without crashing if NVIDIA drivers or PyTorch are absent.
        """
        cuda_available = False
        gpu_name = "Not Detected"
        device_count = 0
        driver_version: str | None = None
        vram_total_gb: float | None = None
        vram_free_gb: float | None = None

        # 1. Safely check PyTorch CUDA if available (will safely fall through if torch is not installed)
        try:
            import torch  # type: ignore
            if torch.cuda.is_available():
                cuda_available = True
                device_count = torch.cuda.device_count()
                gpu_name = torch.cuda.get_device_name(0)
        except Exception:
            pass

        # 2. Check via nvidia-smi if available on Windows PATH
        nvidia_smi_path = shutil.which("nvidia-smi") or r"C:\Windows\System32\nvidia-smi.exe"
        if os.path.exists(nvidia_smi_path):
            try:
                result = subprocess.run(
                    [
                        nvidia_smi_path,
                        "--query-gpu=name,driver_version,memory.total,memory.free",
                        "--format=csv,noheader,nounits",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=2,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                )
                if result.returncode == 0 and result.stdout.strip():
                    first_line = result.stdout.strip().splitlines()[0]
                    parts = [p.strip() for p in first_line.split(",")]
                    if len(parts) >= 4:
                        gpu_name = parts[0]
                        driver_version = parts[1]
                        vram_total_gb = round(float(parts[2]) / 1024.0, 2)
                        vram_free_gb = round(float(parts[3]) / 1024.0, 2)
                        device_count = max(device_count, len(result.stdout.strip().splitlines()))
                        # If nvidia driver is active, cuda hardware is supported
                        cuda_available = True
            except Exception:
                # Fallback safely without raising
                pass

        return GPUInfo(
            name=gpu_name,
            cuda_available=cuda_available,
            device_count=device_count,
            driver_version=driver_version,
            vram_total_gb=vram_total_gb,
            vram_free_gb=vram_free_gb,
        )

    @classmethod
    def get_system_info(cls) -> SystemInfoResponse:
        """Collects complete host system metrics."""
        cpu_count_phys = psutil.cpu_count(logical=False) or 1
        cpu_count_log = psutil.cpu_count(logical=True) or 1
        cpu_percent = psutil.cpu_percent(interval=None)

        mem = psutil.virtual_memory()
        ram_total_gb = round(mem.total / (1024**3), 2)
        ram_avail_gb = round(mem.available / (1024**3), 2)

        gpu_info = cls.get_gpu_info()

        return SystemInfoResponse(
            python_version=sys.version.split()[0],
            os_name=platform.system(),
            os_release=platform.release(),
            os_architecture=platform.machine(),
            cpu_name=platform.processor() or "Generic x86_64 Processor",
            cpu_cores_physical=cpu_count_phys,
            cpu_cores_logical=cpu_count_log,
            cpu_usage_percent=float(cpu_percent),
            ram_total_gb=ram_total_gb,
            ram_available_gb=ram_avail_gb,
            ram_usage_percent=float(mem.percent),
            cuda_available=gpu_info.cuda_available,
            gpu=gpu_info,
            backend_status="online",
        )


system_service = SystemService()
