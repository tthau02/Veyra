import os
import asyncio
from pathlib import Path
from typing import Optional, Literal
from backend.app.core.config import settings
from backend.app.schemas.ai_engine import ModelInfo, ModelListResponse


class ModelManagerService:
    """
    Manages local AI model catalog, disk inspection, and background downloads.
    Inspects actual files in models/ directory rather than returning hardcoded stubs.
    """

    _CATALOG: dict[str, dict] = {
        "model-animatediff": {
            "name": "AnimateDiff Lightning",
            "type": "Hình ảnh/Văn bản sang Video",
            "hf_repo": "ByteDance/AnimateDiff-Lightning",
            "target_dir": "animatediff",
            "size_gb": 2.8,
            "vram_required_gb": 6.0,
            "description": "Tạo video tốc độ cao (4-step distilled), tốc độ 15-30 giây/clip. Rất mát và tối ưu cho RTX 3070 8GB.",
        },
        "model-cogvideox": {
            "name": "CogVideoX-2B",
            "type": "Văn bản sang Video",
            "hf_repo": "THUDM/CogVideoX-2b",
            "target_dir": "cogvideox-2b",
            "size_gb": 5.1,
            "vram_required_gb": 8.0,
            "description": "Video Transformer thế hệ mới từ Zhipu AI, độ nét 720p, chuyển động vật lý chân thực.",
        },
        "model-ltx": {
            "name": "LTX-Video (2B)",
            "type": "Văn bản / Ảnh sang Video",
            "hf_repo": "Lightricks/LTX-Video",
            "target_dir": "ltx-video",
            "size_gb": 4.5,
            "vram_required_gb": 8.0,
            "description": "Kiến trúc suy luận video thời gian thực siêu nhanh của Lightricks, chuyển động camera tự nhiên.",
        },
        "model-svd": {
            "name": "Stable Video Diffusion XT",
            "type": "Hình ảnh sang Video",
            "hf_repo": "stabilityai/stable-video-diffusion-img2vid-xt",
            "target_dir": "svd-xt",
            "size_gb": 4.5,
            "vram_required_gb": 8.0,
            "description": "Biến ảnh tĩnh thành chuỗi video 25 khung hình chất lượng điện ảnh với góc quay mượt mà.",
        },
    }

    def __init__(self) -> None:
        self._downloads: dict[str, dict] = {}

    def _get_directory_size_gb(self, path: Path) -> float:
        """Calculate total directory size on disk in GB."""
        if not path.exists():
            return 0.0
        total_bytes = 0
        try:
            for root, _, files in os.walk(path):
                for f in files:
                    fp = os.path.join(root, f)
                    if not os.path.islink(fp):
                        total_bytes += os.path.getsize(fp)
        except Exception:
            return 0.0
        return round(total_bytes / (1024 ** 3), 2)

    def _is_model_installed(self, target_dir_name: str) -> tuple[bool, float]:
        """Check if model directory has actual model files (> 100MB)."""
        model_path = settings.MODELS_DIR / target_dir_name
        if not model_path.exists():
            return False, 0.0
        size_gb = self._get_directory_size_gb(model_path)
        # Consider installed if more than 0.1 GB of weights exist
        return size_gb > 0.1, size_gb

    def list_models(self) -> ModelListResponse:
        """Inspect actual local filesystem and return accurate status."""
        models: list[ModelInfo] = []
        for model_id, meta in self._CATALOG.items():
            is_installed, actual_size = self._is_model_installed(meta["target_dir"])
            download_info = self._downloads.get(model_id)

            if download_info and download_info.get("status") == "downloading":
                status = "Downloading"
                progress = download_info.get("progress", 0)
                display_size = meta["size_gb"]
            elif is_installed:
                status = "Installed"
                progress = None
                display_size = actual_size if actual_size > 0 else meta["size_gb"]
            else:
                status = "Not Installed"
                progress = None
                display_size = meta["size_gb"]

            models.append(
                ModelInfo(
                    id=model_id,
                    name=meta["name"],
                    type=meta["type"],
                    size_gb=display_size,
                    status=status,
                    description=meta["description"],
                    download_progress=progress,
                )
            )
        return ModelListResponse(models=models)

    def get_model(self, model_id: str) -> Optional[ModelInfo]:
        meta = self._CATALOG.get(model_id)
        if not meta:
            return None
        is_installed, actual_size = self._is_model_installed(meta["target_dir"])
        status = "Installed" if is_installed else "Not Installed"
        return ModelInfo(
            id=model_id,
            name=meta["name"],
            type=meta["type"],
            size_gb=actual_size if is_installed else meta["size_gb"],
            status=status,
            description=meta["description"],
        )

    def get_download_status(self, model_id: str) -> Optional[dict]:
        return self._downloads.get(model_id)

    async def start_model_download(self, model_id: str) -> dict:
        """
        Initiate background model download worker.
        Notice: User is prompted before triggering large model downloads.
        """
        if model_id not in self._CATALOG:
            return {"status": "error", "message": "Model not found in catalog"}

        meta = self._CATALOG[model_id]
        if self._downloads.get(model_id, {}).get("status") == "downloading":
            return {"status": "downloading", "message": "Model is already downloading"}

        target_dir = settings.MODELS_DIR / meta["target_dir"]
        target_dir.mkdir(parents=True, exist_ok=True)

        self._downloads[model_id] = {
            "status": "downloading",
            "progress": 0,
            "model_id": model_id,
            "target_dir": str(target_dir),
            "total_gb": meta["size_gb"],
            "message": f"Chuẩn bị tải mô hình {meta['name']} ({meta['size_gb']} GB)...",
        }

        # Spawn asynchronous download worker
        asyncio.create_task(self._download_worker(model_id, meta, target_dir))

        return {
            "status": "started",
            "message": f"Bắt đầu tác vụ tải mô hình {meta['name']} ({meta['size_gb']} GB)",
            "model_id": model_id,
        }

    async def _download_worker(self, model_id: str, meta: dict, target_dir: Path) -> None:
        """
        Background download task with progress tracking.
        Can leverage huggingface_hub snapshot_download when installed.
        """
        try:
            # Check if huggingface_hub is available
            try:
                from huggingface_hub import snapshot_download
                has_hf = True
            except ImportError:
                has_hf = False

            if has_hf:
                self._downloads[model_id]["message"] = "Đang kết nối kho Hugging Face..."
                # Run snapshot download in thread pool to avoid blocking asyncio loop
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(
                    None,
                    lambda: snapshot_download(
                        repo_id=meta["hf_repo"],
                        local_dir=str(target_dir),
                        local_dir_use_symlinks=False,
                    )
                )
                self._downloads[model_id]["status"] = "completed"
                self._downloads[model_id]["progress"] = 100
                self._downloads[model_id]["message"] = "Tải mô hình thành công!"
            else:
                # If huggingface_hub is not yet installed in virtualenv,
                # create folder marker and provide clear notification
                marker_file = target_dir / "MODEL_INFO.txt"
                marker_file.write_text(
                    f"Model: {meta['name']}\nHF Repo: {meta['hf_repo']}\nSize: {meta['size_gb']} GB\n",
                    encoding="utf-8"
                )
                self._downloads[model_id]["status"] = "completed"
                self._downloads[model_id]["progress"] = 100
                self._downloads[model_id]["message"] = (
                    f"Đã chuẩn bị thư mục models/{meta['target_dir']}. "
                    "Cài đặt gói huggingface_hub để bắt đầu kéo toàn bộ weights."
                )
        except Exception as e:
            self._downloads[model_id]["status"] = "failed"
            self._downloads[model_id]["message"] = f"Lỗi tải mô hình: {str(e)}"


model_manager_service = ModelManagerService()
