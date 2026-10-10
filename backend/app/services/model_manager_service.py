"""Persistent and verified model bundles, independent of CUDA and inference."""
import hashlib
import json
import math
import os
import shutil
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from backend.app.core.config import settings
from backend.app.core.database import DatabaseManager, db_manager
from backend.app.schemas.ai_engine import ModelDownloadStatus, ModelInfo, ModelListResponse, ModelPreparation


class ModelDownloadError(Exception):
    def __init__(self, message: str, code: int = 400) -> None:
        super().__init__(message)
        self.code = code


CATALOG = {
    "model-animatediff": ("AnimateDiff Lightning 4-step", "Văn bản sang Video", "animatediff", "AnimateDiff kết hợp epiCRealism."),
    "model-cogvideox": ("CogVideoX-2B", "Văn bản sang Video", "cogvideox-2b", "Tạo video từ văn bản."),
    "model-ltx": ("LTX-Video", "Văn bản / Ảnh sang Video", "ltx-video", "Mô hình video của Lightricks."),
    "model-svd": ("Stable Video Diffusion XT", "Ảnh sang Video", "svd-xt", "Tạo chuyển động từ ảnh."),
}
SOURCES = {
    "model-animatediff": [("ByteDance/AnimateDiff-Lightning", "adapter"), ("emilianJR/epiCRealism", "base")],
    "model-cogvideox": [("zai-org/CogVideoX-2b", "pipeline")],
}
ACTIVE = {"queued", "downloading", "verifying"}
AUTOMATIC = ACTIVE | {"waiting_network", "interrupted"}


class DownloadStopped(Exception):
    """Cooperative interruption preserving the Hub incomplete file."""


class ModelManagerService:
    def __init__(self, database: DatabaseManager = db_manager, root: Path | None = None) -> None:
        self.database = database
        self.root = root or settings.MODELS_DIR
        self._lock = threading.RLock()
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="model-download")
        self._stopping = threading.Event()
        self._verified: dict[str, tuple[tuple[Any, ...], bool]] = {}
        self._controls: dict[str, threading.Event] = {}
        self._timers: dict[str, threading.Timer] = {}
        self._retry_counts: dict[str, int] = {}

    def initialize(self) -> None:
        with self._lock:
            if self._stopping.is_set():
                self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="model-download")
                self._stopping.clear()
            with self.database.get_connection() as conn:
                rows = conn.execute("SELECT model_id FROM model_downloads WHERE status IN ('queued','downloading','verifying','interrupted','waiting_network') ORDER BY updated_at, model_id").fetchall()
            for row in rows:
                if row["model_id"] in SOURCES and row["model_id"] not in self._controls:
                    self._enqueue(row["model_id"])

    def shutdown(self) -> None:
        with self._lock:
            self._stopping.set()
            for timer in self._timers.values():
                timer.cancel()
            self._timers.clear()
            for control in self._controls.values():
                control.set()
            self._controls.clear()
            with self.database.get_connection() as conn:
                conn.execute("UPDATE model_downloads SET status='interrupted', error_message=NULL WHERE status IN ('queued','downloading','verifying','waiting_network')")
            self._executor.shutdown(wait=False, cancel_futures=True)

    def _enqueue(self, model_id: str) -> None:
        """Called under the control lock; only one worker transfers at a time."""
        timer = self._timers.pop(model_id, None)
        if timer:
            timer.cancel()
        old = self._controls.get(model_id)
        if old:
            old.set()
        control = threading.Event()
        self._controls[model_id] = control
        row = self._row(model_id)
        assert row is not None
        self._update(model_id, "queued", row["downloaded_bytes"])
        self._executor.submit(self._worker, model_id, control)

    def pause_download(self, model_id: str) -> ModelDownloadStatus:
        with self._lock:
            status = self.get_download_status(model_id)
            if status.status in AUTOMATIC:
                control = self._controls.pop(model_id, None)
                if control:
                    control.set()
                timer = self._timers.pop(model_id, None)
                if timer:
                    timer.cancel()
                self._update(model_id, "paused", status.downloaded_bytes)
            return self.get_download_status(model_id)

    def resume_download(self, model_id: str) -> ModelDownloadStatus:
        with self._lock:
            status = self.get_download_status(model_id)
            if status.status == "idle":
                raise ModelDownloadError("Chưa bắt đầu tải mô hình.", 409)
            if status.status not in ACTIVE and status.status != "completed":
                if self._stopping.is_set():
                    raise ModelDownloadError("Máy chủ đang đóng.", 503)
                self._enqueue(model_id)
            return self.get_download_status(model_id)

    def _check_control(self, model_id: str, control: threading.Event) -> None:
        if self._stopping.is_set() or control.is_set() or self._controls.get(model_id) is not control:
            raise DownloadStopped()

    def _report(self, model_id: str, control: threading.Event, state: str, downloaded: int) -> None:
        with self._lock:
            self._check_control(model_id, control)
            self._update(model_id, state, downloaded)

    @staticmethod
    def _network_error(exc: Exception) -> bool:
        code = getattr(getattr(exc, "response", None), "status_code", None)
        if code is not None:
            return code in (408, 429) or code >= 500
        import httpx
        if isinstance(exc, (ConnectionError, TimeoutError, httpx.TransportError)):
            return True
        return type(exc).__name__ in {"LocalEntryNotFoundError", "OfflineModeIsEnabled"}

    def _wait_for_network(self, model_id: str, control: threading.Event) -> None:
        with self._lock:
            self._check_control(model_id, control)
            row = self._row(model_id)
            assert row is not None
            cached = sum(self._cached_bytes(model_id, file) for file in json.loads(row["manifest"]))
            self._update(model_id, "waiting_network", cached)
            count = self._retry_counts.get(model_id, 0)
            self._retry_counts[model_id] = count + 1
            delay = min(60, 5 * 2 ** min(count, 4))
            def retry() -> None:
                with self._lock:
                    if not self._stopping.is_set() and not control.is_set() and self._controls.get(model_id) is control:
                        self._enqueue(model_id)
            timer = threading.Timer(delay, retry)
            timer.daemon = True
            self._timers[model_id] = timer
            timer.start()

    def _hub(self) -> Any:
        try:
            import huggingface_hub
            return huggingface_hub
        except ImportError as exc:
            raise ModelDownloadError("Chưa cài thư viện tải mô hình.", 503) from exc

    def _row(self, model_id: str) -> dict[str, Any] | None:
        with self.database.get_connection() as conn:
            row = conn.execute("SELECT * FROM model_downloads WHERE model_id=?", (model_id,)).fetchone()
            return dict(row) if row else None

    def _update(self, model_id: str, status: str, downloaded: int, error: str | None = None) -> None:
        with self.database.get_connection() as conn:
            conn.execute("UPDATE model_downloads SET status=?, downloaded_bytes=?, error_message=?, updated_at=CURRENT_TIMESTAMP WHERE model_id=?", (status, downloaded, error, model_id))

    def _path(self, model_id: str, file: dict[str, Any]) -> Path:
        base = (self.root / CATALOG[model_id][2]).resolve()
        path = (base / file["component"] / file["name"]).resolve()
        if not path.is_relative_to(base):
            raise ModelDownloadError("Đường dẫn mô hình không hợp lệ.")
        return path

    def _partial_path(self, model_id: str, file: dict[str, Any]) -> Path:
        identity = json.dumps([file["repo"], file["revision"], file["name"]]).encode()
        key = hashlib.sha256(identity).hexdigest()
        return self.root / CATALOG[model_id][2] / ".cache" / "veyra" / f"{key}.part"

    def _cached_bytes(self, model_id: str, file: dict[str, Any]) -> int:
        if self._valid(model_id, file):
            return file["size"]
        try:
            return min(self._partial_path(model_id, file).stat().st_size, file["size"])
        except OSError:
            return 0

    def _download_file(self, model_id: str, file: dict[str, Any], control: threading.Event, baseline: int) -> None:
        """Range download to a stable partial file; fsync before closing on interruption.

        Hub 1.24 deliberately deletes its process-unique partials on failure, so
        use Hub URL/auth helpers with our own persistent transfer cache instead.
        """
        import httpx
        hub = self._hub()
        from huggingface_hub.utils import build_hf_headers
        partial = self._partial_path(model_id, file)
        partial.parent.mkdir(parents=True, exist_ok=True)
        offset = partial.stat().st_size if partial.exists() else 0
        if offset > file["size"]:
            offset = 0
        if offset != file["size"]:
            url = hub.hf_hub_url(file["repo"], file["name"], revision=file["revision"])
            headers = build_hf_headers()
            headers["Accept-Encoding"] = "identity"
            if offset:
                headers["Range"] = f"bytes={offset}-"
            with httpx.Client(follow_redirects=True, timeout=httpx.Timeout(10.0), headers=headers) as client:
                with client.stream("GET", url) as response:
                    response.raise_for_status()
                    if response.status_code == 206:
                        expected = f"bytes {offset}-"
                        if not response.headers.get("content-range", "").startswith(expected):
                            raise ModelDownloadError("Dữ liệu tải tiếp không hợp lệ.")
                    else:
                        offset = 0  # Server does not support Range: safely replace the partial.
                    self._report(model_id, control, "downloading", baseline + offset)
                    last_report = time.monotonic()
                    with partial.open("ab" if offset else "wb") as stream:
                        try:
                            for chunk in response.iter_bytes(chunk_size=256 * 1024):
                                self._check_control(model_id, control)
                                if offset + len(chunk) > file["size"]:
                                    raise ModelDownloadError("Dung lượng file tải không hợp lệ.")
                                stream.write(chunk)
                                offset += len(chunk)
                                if time.monotonic() - last_report >= 0.5:
                                    stream.flush()
                                    self._report(model_id, control, "downloading", baseline + offset)
                                    last_report = time.monotonic()
                        finally:
                            stream.flush()
                            os.fsync(stream.fileno())
            if offset != file["size"]:
                raise ConnectionError("Incomplete transfer")
        self._report(model_id, control, "verifying", baseline + offset)
        destination = self._path(model_id, file)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with self._lock:
            self._check_control(model_id, control)
            partial.replace(destination)

    def _valid(self, model_id: str, file: dict[str, Any]) -> bool:
        path = self._path(model_id, file)
        try:
            stat = path.stat()
            if stat.st_size != file["size"]:
                return False
            signature = (stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns, file.get("sha256"), file.get("blob_id"))
            cached = self._verified.get(str(path))
            if cached and cached[0] == signature:
                return cached[1]
            expected = file.get("sha256") or file.get("blob_id")
            digest = hashlib.sha256() if file.get("sha256") else hashlib.sha1()
            if not file.get("sha256"):
                digest.update(f"blob {stat.st_size}\0".encode())
            with path.open("rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(chunk)
            valid = not expected or digest.hexdigest() == expected
            self._verified[str(path)] = (signature, valid)
            return valid
        except OSError:
            return False

    def _manifest(self, model_id: str) -> list[dict[str, Any]]:
        hub = self._hub()
        files: list[dict[str, Any]] = []
        for repo, component in SOURCES[model_id]:
            info = hub.HfApi().model_info(repo, revision="main", files_metadata=True)
            entries = {entry.rfilename: entry for entry in info.siblings}
            if component == "adapter":
                names = {"animatediff_lightning_4step_diffusers.safetensors"}
            else:
                prefixes = {"scheduler", "tokenizer", "text_encoder", "vae", "unet", "safety_checker", "feature_extractor"} if component == "base" else {"scheduler", "tokenizer", "text_encoder", "vae", "transformer"}
                names = {name for name in entries if name == "model_index.json" or (name.split("/")[0] in prefixes and (name.endswith((".json", ".txt", ".model")) or (name.endswith(".safetensors") and ".fp16." not in name and ".bf16." not in name)))}
                required = {"model_index.json", "scheduler/scheduler_config.json", "tokenizer/tokenizer_config.json"}
                required.update({"tokenizer/vocab.json", "tokenizer/merges.txt", "feature_extractor/preprocessor_config.json"} if component == "base" else {"tokenizer/spiece.model", "text_encoder/model.safetensors.index.json"})
                for prefix in prefixes - {"scheduler", "tokenizer", "feature_extractor"}:
                    required.add(f"{prefix}/config.json")
                    if not any(name.startswith(prefix + "/") and name.endswith(".safetensors") for name in names):
                        raise ModelDownloadError("Kho mô hình thiếu trọng số bắt buộc.", 502)
                if not required.issubset(names):
                    raise ModelDownloadError("Kho mô hình thiếu cấu hình bắt buộc.", 502)
            if not names.issubset(entries):
                raise ModelDownloadError("Không tìm thấy file mô hình.", 404)
            for name in sorted(names):
                entry = entries[name]
                if entry.size is None:
                    raise ModelDownloadError("Không xác định được dung lượng mô hình.", 502)
                lfs = entry.lfs
                sha = getattr(lfs, "sha256", None) if lfs else None
                files.append(dict(repo=repo, revision=info.sha, component=component, name=name, size=entry.size, sha256=sha, blob_id=entry.blob_id))
        return files

    def _space(self, remaining: int) -> int:
        try:
            self.root.mkdir(parents=True, exist_ok=True)
            with tempfile.TemporaryFile(dir=self.root):
                pass
            required = math.ceil(remaining * 1.1)
            if shutil.disk_usage(self.root).free < required:
                raise ModelDownloadError("Không đủ dung lượng trống.", 507)
            return required
        except PermissionError as exc:
            raise ModelDownloadError("Không có quyền ghi thư mục mô hình.", 403) from exc

    def prepare(self, model_id: str) -> ModelPreparation:
        if model_id not in CATALOG:
            raise ModelDownloadError("Không tìm thấy mô hình.", 404)
        if model_id not in SOURCES:
            raise ModelDownloadError("Mô hình chưa được hỗ trợ.")
        self._hub()
        with self._lock:
            row = self._row(model_id)
            try:
                manifest = json.loads(row["manifest"]) if row else self._manifest(model_id)
                total = sum(file["size"] for file in manifest)
                complete = sum(self._cached_bytes(model_id, file) for file in manifest)
                required = self._space(total - complete)
                if not row:
                    with self.database.get_connection() as conn:
                        conn.execute("INSERT INTO model_downloads(model_id,manifest,total_bytes,status,downloaded_bytes) VALUES(?,?,?,'idle',?)", (model_id, json.dumps(manifest), total, complete))
                return ModelPreparation(model_id=model_id, total_bytes=total, remaining_bytes=total-complete, required_bytes=required)
            except ModelDownloadError:
                raise
            except Exception as exc:
                raise ModelDownloadError(self._error(exc), 502) from exc

    @staticmethod
    def _error(exc: Exception) -> str:
        code = getattr(getattr(exc, "response", None), "status_code", None)
        if code in (401, 403):
            return "Cần đăng nhập Hugging Face và quyền truy cập mô hình."
        if code == 404:
            return "Không tìm thấy file mô hình."
        if isinstance(exc, PermissionError):
            return "Không có quyền ghi thư mục mô hình."
        if isinstance(exc, OSError) and exc.errno == 28:
            return "Không đủ dung lượng trống."
        return "Không thể tải mô hình. Kiểm tra kết nối và thử lại."

    def start_model_download(self, model_id: str) -> ModelDownloadStatus:
        with self._lock:
            row = self._row(model_id)
            if row and row["status"] in AUTOMATIC:
                return self.get_download_status(model_id)
            self.prepare(model_id)
            row = self._row(model_id)
            assert row is not None
            if row["status"] == "completed":
                self.get_model(model_id)
                row = self._row(model_id)
                assert row is not None
            if row["status"] != "completed":
                self._enqueue(model_id)
            return self.get_download_status(model_id)

    def _worker(self, model_id: str, control: threading.Event) -> None:
        row = self._row(model_id)
        assert row is not None
        manifest = json.loads(row["manifest"])
        complete = 0
        try:
            self._check_control(model_id, control)
            self._hub()
            for file in manifest:
                self._check_control(model_id, control)
                if self._valid(model_id, file):
                    complete += file["size"]
                    continue
                self._space(sum(f["size"] - self._cached_bytes(model_id, f) for f in manifest))
                self._download_file(model_id, file, control, complete)
                self._report(model_id, control, "verifying", complete + file["size"])
                if not self._valid(model_id, file):
                    raise ModelDownloadError("File mô hình không đầy đủ hoặc bị hỏng.")
                complete += file["size"]
            self._report(model_id, control, "completed", complete)
            self._retry_counts.pop(model_id, None)
        except DownloadStopped:
            pass  # pause/shutdown persisted state before signalling the worker
        except Exception as exc:
            try:
                with self._lock:
                    self._check_control(model_id, control)
                    if self._network_error(exc):
                        self._wait_for_network(model_id, control)
                    else:
                        self._update(model_id, "failed", sum(self._cached_bytes(model_id, f) for f in manifest), str(exc) if isinstance(exc, ModelDownloadError) else self._error(exc))
            except DownloadStopped:
                pass
        finally:
            with self._lock:
                row = self._row(model_id)
                if row and row["status"] in ("paused", "interrupted") and model_id not in self._controls:
                    self._update(model_id, row["status"], sum(self._cached_bytes(model_id, f) for f in manifest))
                if self._controls.get(model_id) is control and row and row["status"] not in AUTOMATIC:
                    self._controls.pop(model_id, None)

    def delete_model(self, model_id: str) -> ModelInfo:
        with self._lock:
            if model_id not in CATALOG:
                raise ModelDownloadError("Không tìm thấy mô hình.", 404)
            if self.get_download_status(model_id).status in AUTOMATIC or model_id in self._controls:
                raise ModelDownloadError("Tạm dừng và chờ tải kết thúc trước khi xóa.", 409)
            with self.database.get_connection() as conn:
                running = conn.execute("SELECT 1 FROM generation_jobs WHERE provider_or_model=? AND status IN ('queued','generating','decoding','muxing') LIMIT 1", (model_id,)).fetchone()
            if running:
                raise ModelDownloadError("Mô hình đang tạo video. Hãy chờ hoàn tất.", 409)
            root = self.root.resolve()
            target = self.root / CATALOG[model_id][2]
            resolved = target.resolve()
            if target.is_symlink() or resolved == root or not resolved.is_relative_to(root):
                raise ModelDownloadError("Đường dẫn mô hình không hợp lệ.", 400)
            try:
                if target.exists():
                    shutil.rmtree(target)
            except OSError as exc:
                raise ModelDownloadError("Không thể xóa file mô hình. Kiểm tra quyền truy cập và thử lại.", 409) from exc
            with self.database.get_connection() as conn:
                conn.execute("DELETE FROM model_downloads WHERE model_id=?", (model_id,))
            self._verified.clear()
            self._retry_counts.pop(model_id, None)
            model = self.get_model(model_id)
            assert model is not None
            return model

    def get_download_status(self, model_id: str) -> ModelDownloadStatus:
        if model_id not in CATALOG:
            raise ModelDownloadError("Không tìm thấy mô hình.", 404)
        row = self._row(model_id)
        if not row:
            return ModelDownloadStatus(model_id=model_id)
        total = row["total_bytes"]
        progress = 100 if row["status"] == "completed" else min(99, int(row["downloaded_bytes"] * 100 / total)) if total else 0
        return ModelDownloadStatus(model_id=model_id, status=row["status"], progress=progress, downloaded_bytes=row["downloaded_bytes"], total_bytes=total, error_message=row["error_message"])

    def get_model(self, model_id: str) -> ModelInfo | None:
        if model_id not in CATALOG:
            return None
        name, kind, _, description = CATALOG[model_id]
        download = self.get_download_status(model_id)
        row = self._row(model_id)
        complete = bool(row) and download.status == "completed" and all(self._valid(model_id, file) for file in json.loads(row["manifest"]))
        if download.status == "completed" and not complete:
            self._update(model_id, "failed", 0, "File mô hình bị thiếu hoặc hỏng. Tải lại để khôi phục.")
            download = self.get_download_status(model_id)
        return ModelInfo(id=model_id, name=name, type=kind, size_gb=download.total_bytes / 1024**3, status="Installed" if complete else "Downloading" if download.status in AUTOMATIC else "Not Installed", description=description, supported=model_id in SOURCES, download_status=download.status, download_progress=download.progress, downloaded_bytes=download.downloaded_bytes, total_bytes=download.total_bytes, error_message=download.error_message, files_complete=complete)

    def list_models(self) -> ModelListResponse:
        return ModelListResponse(models=[model for model_id in CATALOG if (model := self.get_model(model_id)) is not None])


model_manager_service = ModelManagerService()
