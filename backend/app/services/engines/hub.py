"""Single GPU worker with durable, actual generation state."""
import json
import logging
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from backend.app.core.config import settings
from backend.app.core.database import DatabaseManager, db_manager
from backend.app.services.engines.base import GenerationParams
from backend.app.services.engines.local_engine import LocalDiffusersEngine, local_engine
from backend.app.services.model_manager_service import model_manager_service
from backend.app.schemas.ai_engine import JobStatusResponse

logger = logging.getLogger(__name__)


class GenerationError(Exception):
    def __init__(self, message: str, code: int = 400) -> None:
        super().__init__(message)
        self.code = code


class EngineHub:
    def __init__(self, database: DatabaseManager = db_manager, engine: LocalDiffusersEngine = local_engine) -> None:
        self.database = database
        self.engine = engine
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="video-generation")
        self._lock = threading.Lock()
        self._closed = False

    def initialize(self) -> None:
        if self._closed:
            self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="video-generation")
            self._closed = False
        with self.database.get_connection() as conn:
            conn.execute("UPDATE generation_jobs SET status='failed', output_video_path=NULL, error_message='Tác vụ bị gián đoạn. Hãy tạo lại.', current_step='Gián đoạn' WHERE status IN ('queued','generating','decoding','muxing')")

    def shutdown(self) -> None:
        self._closed = True
        self._executor.shutdown(wait=False, cancel_futures=True)

    def _validate(self, params: GenerationParams) -> None:
        if params.engine_mode != "local":
            raise GenerationError("Dịch vụ đám mây chưa hỗ trợ tạo video.", 501)
        model = model_manager_service.get_model(params.model_or_provider_id)
        if model is None or not model.supported:
            raise GenerationError("Mô hình chưa hỗ trợ tạo video.")
        if model.status != "Installed" or not model.files_complete:
            raise GenerationError("Tải đầy đủ mô hình trước khi tạo video.", 409)
        available, reason = self.engine.is_available()
        if not available:
            raise GenerationError(reason, 503)

    def start_job(self, params: GenerationParams) -> JobStatusResponse:
        with model_manager_service._lock, self._lock:
            self._validate(params)
            if self._closed:
                raise GenerationError("Máy chủ đang đóng.", 503)
            job_id = f"job-{uuid.uuid4().hex}"
            with self.database.get_connection() as conn:
                conn.execute("""INSERT INTO generation_jobs(id,prompt,negative_prompt,engine_type,provider_or_model,aspect_ratio,resolution,duration_seconds,status,progress,current_step)
                    VALUES(?,?,?,?,?,?,?,?,'queued',0,'Đang chờ xử lý…')""", (job_id, params.prompt, params.negative_prompt or "", params.engine_mode, params.model_or_provider_id, params.aspect_ratio, params.resolution, params.duration_seconds))
            self._executor.submit(self._execute, params, job_id)
        return self.get_job_status(job_id)

    def _update(self, job_id: str, state: str, progress: int, step: str, error: str | None = None, metadata: dict[str, Any] | None = None) -> None:
        with self.database.get_connection() as conn:
            conn.execute("UPDATE generation_jobs SET status=?,progress=?,current_step=?,error_message=?,output_video_path=?,metadata=COALESCE(?,metadata),updated_at=CURRENT_TIMESTAMP WHERE id=?", (state, progress, step, error, f"/api/generate/jobs/{job_id}/video" if state == "completed" else None, json.dumps(metadata) if metadata else None, job_id))

    def _execute(self, params: GenerationParams, job_id: str) -> None:
        try:
            def progress(state: str, percent: int, step: str) -> None:
                if self._closed:
                    raise RuntimeError("Generation interrupted")
                self._update(job_id, state, min(99, percent), step)
            metadata = self.engine.render(params, job_id, progress)
            path = settings.OUTPUTS_DIR / f"{job_id}.mp4"
            if not path.is_file() or path.stat().st_size < 1024:
                raise RuntimeError("Missing output")
            self._update(job_id, "completed", 100, "Hoàn tất", metadata=metadata)
        except Exception as exc:
            logger.exception("Generation failed: %s", job_id)
            message = "Không thể tạo video. Kiểm tra mô hình và thử lại."
            if "out of memory" in str(exc).lower():
                message = "Không đủ bộ nhớ GPU. Đóng ứng dụng dùng GPU hoặc giảm thời lượng."
            elif isinstance(exc, (ImportError, ModuleNotFoundError)):
                message = "Thiếu thư viện tạo video. Cài bộ xử lý AI trước khi chạy."
            elif self._closed:
                message = "Tác vụ bị gián đoạn. Hãy tạo lại."
            self._update(job_id, "failed", 0, "Không thể tạo video", error=message)

    def get_job_status(self, job_id: str) -> JobStatusResponse:
        with self.database.get_connection() as conn:
            row = conn.execute("SELECT * FROM generation_jobs WHERE id=?", (job_id,)).fetchone()
        if row is None:
            raise GenerationError("Không tìm thấy tác vụ.", 404)
        metadata = json.loads(row["metadata"] or "{}")
        if row["status"] == "completed" and not (settings.OUTPUTS_DIR / f"{job_id}.mp4").is_file():
            self._update(job_id, "failed", 0, "Không tìm thấy video", error="File video không còn tồn tại. Hãy tạo lại.")
            return self.get_job_status(job_id)
        return JobStatusResponse(job_id=job_id, status=row["status"], progress=row["progress"], current_step=row["current_step"] or "", output_url=f"/api/generate/jobs/{job_id}/video" if row["status"] == "completed" else None, error_message=row["error_message"], **metadata)


engine_hub = EngineHub()
