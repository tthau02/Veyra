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
        vram_used_gb: float | None = None
        vram_free_gb: float | None = None
        gpu_usage_percent: float | None = None
        vram_used_percent: float | None = None
        temperature_celsius: float | None = None

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
                        "--query-gpu=name,driver_version,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu",
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
                        vram_total_gb = round(float(parts[2]) / 1024.0, 1)
                        vram_used_gb = round(float(parts[3]) / 1024.0, 1)
                        if len(parts) >= 5:
                            vram_free_gb = round(float(parts[4]) / 1024.0, 1)
                        if vram_total_gb and vram_total_gb > 0 and vram_used_gb is not None:
                            vram_used_percent = round((vram_used_gb / vram_total_gb) * 100, 1)
                        if len(parts) >= 6:
                            try:
                                gpu_usage_percent = float(parts[5])
                            except ValueError:
                                gpu_usage_percent = 0.0
                        if len(parts) >= 7:
                            try:
                                temperature_celsius = float(parts[6])
                            except ValueError:
                                temperature_celsius = None
                        device_count = max(device_count, len(result.stdout.strip().splitlines()))
                        # If nvidia driver is active, cuda hardware is supported
                        cuda_available = True
            except Exception:
                # Fallback safely without raising
                pass

        if vram_total_gb and vram_free_gb and vram_used_gb is None:
            vram_used_gb = round(max(0.0, vram_total_gb - vram_free_gb), 1)

        return GPUInfo(
            name=gpu_name,
            cuda_available=cuda_available,
            device_count=device_count,
            driver_version=driver_version,
            vram_total_gb=vram_total_gb,
            vram_used_gb=vram_used_gb,
            vram_free_gb=vram_free_gb,
            gpu_usage_percent=gpu_usage_percent,
            vram_used_percent=vram_used_percent,
            temperature_celsius=temperature_celsius,
        )

    @staticmethod
    def _get_cpu_temperature() -> float | None:
        """Safely queries CPU thermal sensor if accessible."""
        if os.name != "nt":
            try:
                temps = getattr(psutil, "sensors_temperatures", lambda: {})()
                if temps:
                    for key in ("coretemp", "cpu_thermal", "k10temp"):
                        if key in temps and temps[key]:
                            return round(float(temps[key][0].current), 1)
            except Exception:
                pass
            return None

        # Windows ACPI WMI fallback
        try:
            res = subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-Command",
                    "try { (Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop).CurrentTemperature } catch {}",
                ],
                capture_output=True,
                text=True,
                timeout=1.2,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            if res.returncode == 0 and res.stdout.strip():
                raw = float(res.stdout.strip().splitlines()[0])
                celsius = round((raw - 2732.0) / 10.0, 1)
                if 0 < celsius < 125:
                    return celsius
        except Exception:
            pass
        return None

    @classmethod
    def get_system_info(cls) -> SystemInfoResponse:
        """Collects complete host system metrics."""
        cpu_count_phys = psutil.cpu_count(logical=False) or 1
        cpu_count_log = psutil.cpu_count(logical=True) or 1
        cpu_percent = psutil.cpu_percent(interval=None)
        cpu_temp = cls._get_cpu_temperature()

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
            cpu_temperature_celsius=cpu_temp,
            ram_total_gb=ram_total_gb,
            ram_available_gb=ram_avail_gb,
            ram_usage_percent=float(mem.percent),
            cuda_available=gpu_info.cuda_available,
            gpu=gpu_info,
            backend_status="online",
        )


system_service = SystemService()
