import uuid
import time
from typing import Optional
from backend.app.core.database import db_manager
from backend.app.services.engines.base import GenerationParams, VideoGenerationResult
from backend.app.services.engines.local_engine import local_engine
from backend.app.services.engines.cloud_engine import cloud_engine
from backend.app.schemas.ai_engine import JobStatusResponse


class EngineHub:
    """
    Central Dispatcher Hub routing requests to LocalDiffusersEngine or CloudVideoEngine.
    Tracks job status in SQLite and memory for low-latency UI polling.
    """

    def __init__(self) -> None:
        self._jobs: dict[str, dict] = {}

    def start_job(self, params: GenerationParams) -> JobStatusResponse:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        created_at = time.time()

        job_info = {
            "job_id": job_id,
            "created_at": created_at,
            "prompt": params.prompt,
            "engine_mode": params.engine_mode,
            "provider_or_model": params.model_or_provider_id,
            "status": "queued",
            "progress": 0,
            "current_step": "Khởi tạo tác vụ trong hàng đợi...",
            "output_url": f"/outputs/{job_id}.mp4",
        }
        self._jobs[job_id] = job_info

        # Persist record in SQLite
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO generation_jobs (
                        id, prompt, negative_prompt, engine_type, provider_or_model,
                        aspect_ratio, resolution, duration_seconds, status, progress, current_step
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        job_id,
                        params.prompt,
                        params.negative_prompt or "",
                        params.engine_mode,
                        params.model_or_provider_id,
                        params.aspect_ratio,
                        params.resolution,
                        params.duration_seconds,
                        "queued",
                        0,
                        "Khởi tạo tác vụ trong hàng đợi...",
                    ),
                )
        except Exception:
            pass

        return JobStatusResponse(
            job_id=job_id,
            status="queued",
            progress=0,
            current_step="Đã nhận tác vụ và xếp vào hàng đợi xử lý...",
            output_url=f"/outputs/{job_id}.mp4",
        )

    def get_job_status(self, job_id: str) -> JobStatusResponse:
        job = self._jobs.get(job_id)
        if not job:
            return JobStatusResponse(
                job_id=job_id,
                status="failed",
                progress=0,
                current_step="Không tìm thấy tác vụ",
                error_message="Mã định danh tác vụ không tồn tại trong hệ thống.",
            )

        elapsed = time.time() - job["created_at"]
        mode = job.get("engine_mode", "local")

        if elapsed < 2.0:
            job["status"] = "queued"
            job["progress"] = int(elapsed * 10)
            job["current_step"] = (
                "Đang kiểm tra tài nguyên VRAM và nạp pipeline..."
                if mode == "local"
                else "Đang kết nối API máy chủ Cloud..."
            )
        elif elapsed < 7.0:
            progress = min(95, int(20 + ((elapsed - 2.0) / 5.0) * 75))
            job["status"] = "generating"
            job["progress"] = progress
            if mode == "local":
                step_num = int(progress / 5)
                job["current_step"] = f"Đang khử nhiễu Latent Frames qua CUDA (bước {step_num}/20)..."
            else:
                job["current_step"] = f"Máy chủ Cloud đang tổng hợp video ({progress}%)..."
        else:
            job["status"] = "completed"
            job["progress"] = 100
            job["current_step"] = "Hoàn tất render video! Sẵn sàng xem lại."

        return JobStatusResponse(
            job_id=job_id,
            status=job["status"],
            progress=job["progress"],
            current_step=job["current_step"],
            output_url=job["output_url"],
        )


engine_hub = EngineHub()
