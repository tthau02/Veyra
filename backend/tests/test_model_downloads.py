import hashlib
import json
import threading
from pathlib import Path
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient
import httpx

from backend.app.core.database import DatabaseManager
from backend.app.services.model_manager_service import ModelDownloadError, ModelManagerService


@pytest.fixture
def manager(tmp_path: Path) -> ModelManagerService:
    database = DatabaseManager(str(tmp_path / "downloads.db"))
    database.initialize_schema()
    service = ModelManagerService(database, tmp_path / "models")
    yield service
    service.shutdown()
    service._executor.shutdown(wait=True)


def fake_manifest(service: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> list[dict]:
    files = [dict(repo="test/repo", revision="fixed-commit", component="base", name="weights.safetensors", size=6, sha256=hashlib.sha256(b"weight").hexdigest(), blob_id=None)]
    monkeypatch.setattr(service, "_manifest", lambda _: files)
    return files


def wait(service: ModelManagerService) -> None:
    service._executor.submit(lambda: None).result(timeout=10)


def fake_hub(service: ModelManagerService, monkeypatch: pytest.MonkeyPatch, fail: Exception | None = None) -> list[dict]:
    from huggingface_hub.utils import build_hf_headers
    build_hf_headers(token=False)
    calls: list[dict] = []
    def url(repo: str, filename: str, revision: str) -> str:
        calls.append(dict(repo=repo, filename=filename, revision=revision))
        return "https://hub.test/weights"
    def download(request: httpx.Request) -> httpx.Response:
        if fail:
            raise fail
        offset = int(request.headers.get("range", "bytes=0-").split("=")[1].split("-")[0])
        headers = {"content-range": f"bytes {offset}-5/6"} if offset else {}
        return httpx.Response(206 if offset else 200, content=b"weight"[offset:], headers=headers)
    original = httpx.Client
    monkeypatch.setattr(httpx, "Client", lambda **kwargs: original(transport=httpx.MockTransport(download), **kwargs))
    monkeypatch.setattr(service, "_hub", lambda: SimpleNamespace(hf_hub_url=url))
    return calls


def test_download_verified_offline_and_corruption(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    files = fake_manifest(manager, monkeypatch)
    calls = fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    manager.start_model_download("model-animatediff")
    wait(manager)
    assert calls, manager.get_download_status("model-animatediff")
    assert calls[0]["revision"] == "fixed-commit"
    assert manager.get_model("model-animatediff").status == "Installed"
    monkeypatch.setattr(manager, "_hub", lambda: pytest.fail("Offline listing contacted Hub"))
    restarted = ModelManagerService(manager.database, manager.root)
    assert restarted.get_model("model-animatediff").status == "Installed"
    restarted._path("model-animatediff", files[0]).write_bytes(b"broken")
    assert restarted.get_model("model-animatediff").status == "Not Installed"
    assert restarted.get_download_status("model-animatediff").status == "failed"
    restarted.shutdown()


def test_marker_missing_dependency_and_unsupported(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    path = manager.root / "animatediff"
    path.mkdir(parents=True)
    (path / "MODEL_INFO.txt").write_text("marker")
    assert manager.get_model("model-animatediff").status == "Not Installed"
    assert not manager.get_model("model-ltx").supported
    def missing() -> None:
        raise ModelDownloadError("Chưa cài thư viện tải mô hình.", 503)
    monkeypatch.setattr(manager, "_hub", missing)
    with pytest.raises(ModelDownloadError, match="Chưa cài"):
        manager.prepare("model-animatediff")
    with pytest.raises(ModelDownloadError, match="chưa được hỗ trợ"):
        manager.prepare("model-ltx")


def test_disk_and_write_permission(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch)
    monkeypatch.setattr("backend.app.services.model_manager_service.shutil.disk_usage", lambda _: SimpleNamespace(free=0))
    with pytest.raises(ModelDownloadError, match="dung lượng"):
        manager.prepare("model-animatediff")
    monkeypatch.setattr("backend.app.services.model_manager_service.tempfile.TemporaryFile", lambda **_: (_ for _ in ()).throw(PermissionError()))
    with pytest.raises(ModelDownloadError, match="quyền ghi"):
        manager.prepare("model-animatediff")


def test_restart_resume_pins_revision(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_manifest(manager, monkeypatch)
    calls = fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    manager._update("model-animatediff", "downloading", 3)
    monkeypatch.setattr(manager, "_manifest", lambda _: pytest.fail("Resolved a different revision"))
    manager.initialize()
    wait(manager)
    assert calls[0]["revision"] == "fixed-commit"
    assert manager.get_download_status("model-animatediff").progress == 100


def test_queue_and_duplicate(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch)
    gate = threading.Event()
    entered = threading.Event()
    original = manager._worker
    def worker(model_id: str, control: threading.Event) -> None:
        entered.set()
        gate.wait(5)
        original(model_id, control)
    monkeypatch.setattr(manager, "_worker", worker)
    manager.start_model_download("model-animatediff")
    assert entered.wait(2)
    manager.start_model_download("model-animatediff")
    manager.start_model_download("model-cogvideox")
    assert manager.get_download_status("model-cogvideox").status == "queued"
    gate.set()
    wait(manager)
    assert manager.get_download_status("model-cogvideox").status == "completed"


@pytest.mark.parametrize("code", [401, 403, 404])
def test_terminal_http_errors(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch, code: int) -> None:
    fake_manifest(manager, monkeypatch)
    error = httpx.HTTPStatusError("secret must never appear", request=httpx.Request("GET", "https://hub.test"), response=httpx.Response(code))
    calls = fake_hub(manager, monkeypatch, error)
    manager.start_model_download("model-animatediff")
    wait(manager)
    status = manager.get_download_status("model-animatediff")
    assert status.status == "failed" and status.progress < 100
    assert "secret" not in status.error_message
    assert len(calls) == 1


def test_wrong_size_and_missing_file(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    files = fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    path = manager._path("model-animatediff", files[0])
    path.parent.mkdir(parents=True)
    path.write_bytes(b"short")
    assert not manager._valid("model-animatediff", files[0])
    path.unlink()
    assert not manager._valid("model-animatediff", files[0])


def test_transient_retries(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_manifest(manager, monkeypatch)
    calls = fake_hub(manager, monkeypatch, ConnectionError())
    manager.start_model_download("model-animatediff")
    wait(manager)
    assert len(calls) == 1
    assert manager.get_download_status("model-animatediff").status == "waiting_network"
    timer = manager._timers["model-animatediff"]
    timer.cancel()
    timer.function()
    wait(manager)
    assert len(calls) == 2
    assert manager.get_download_status("model-animatediff").status == "waiting_network"


@pytest.mark.anyio
async def test_api_contract(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.app.api.v1 import models
    from backend.app.main import app
    fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch, PermissionError())
    monkeypatch.setattr(models, "model_manager_service", manager)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        preparation = await client.post("/api/models/model-animatediff/prepare")
        assert preparation.json()["required_bytes"] == 7
        response = await client.post("/api/models/model-animatediff/install")
        assert response.status_code == 202
        wait(manager)
        status = await client.get("/api/models/model-animatediff/download-status")
        assert status.json()["status"] == "failed"
        assert (await client.post("/api/models/model-ltx/install")).status_code == 400
        assert (await client.get("/api/models/unknown/download-status")).status_code == 404
        assert (await client.post("/api/models/unknown/pause")).status_code == 404
        assert (await client.post("/api/models/model-cogvideox/resume")).status_code == 409


def test_pause_survives_restart_and_play_resumes(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    files = fake_manifest(manager, monkeypatch)
    calls = fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    partial = manager._partial_path("model-animatediff", files[0])
    partial.parent.mkdir(parents=True)
    partial.write_bytes(b"wei")
    manager._update("model-animatediff", "waiting_network", 3)
    manager.pause_download("model-animatediff")
    manager.initialize()
    assert manager.get_download_status("model-animatediff").status == "paused"
    assert not calls
    preparation = manager.prepare("model-animatediff")
    assert preparation.remaining_bytes == 3
    manager.resume_download("model-animatediff")
    wait(manager)
    assert manager.get_download_status("model-animatediff").status == "completed"
    assert not partial.exists()
    assert manager._path("model-animatediff", files[0]).read_bytes() == b"weight"


def test_pause_queued_job_prevents_transfer(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_manifest(manager, monkeypatch)
    calls = fake_hub(manager, monkeypatch)
    gate = threading.Event()
    manager._executor.submit(lambda: gate.wait(5))
    manager.start_model_download("model-animatediff")
    manager.pause_download("model-animatediff")
    gate.set()
    wait(manager)
    assert not calls
    assert manager.get_download_status("model-animatediff").status == "paused"


def test_network_recovery_continues_partial_bytes(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    payload = b"a" * (256 * 1024) + b"b" * 10
    file = dict(repo="test/repo", revision="fixed", component="base", name="weights.safetensors", size=len(payload), sha256=hashlib.sha256(payload).hexdigest(), blob_id=None)
    monkeypatch.setattr(manager, "_manifest", lambda _: [file])
    monkeypatch.setattr(manager, "_hub", lambda: SimpleNamespace(hf_hub_url=lambda *args, **kwargs: "https://hub.test/file"))
    requests: list[httpx.Request] = []
    class BrokenStream(httpx.SyncByteStream):
        def __iter__(self):
            yield payload[:256 * 1024]
            raise httpx.ConnectError("offline")
    def transport(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if len(requests) == 1:
            return httpx.Response(200, stream=BrokenStream())
        assert request.headers["range"] == f"bytes={256 * 1024}-"
        return httpx.Response(206, content=payload[256 * 1024:], headers={"content-range": f"bytes {256 * 1024}-{len(payload)-1}/{len(payload)}"})
    original = httpx.Client
    monkeypatch.setattr(httpx, "Client", lambda **kwargs: original(transport=httpx.MockTransport(transport), **kwargs))
    manager.start_model_download("model-animatediff")
    wait(manager)
    status = manager.get_download_status("model-animatediff")
    assert status.status == "waiting_network"
    assert status.downloaded_bytes == 256 * 1024
    timer = manager._timers["model-animatediff"]
    timer.cancel()
    timer.function()
    wait(manager)
    assert manager.get_download_status("model-animatediff").progress == 100
    assert manager._path("model-animatediff", file).read_bytes() == payload


def test_pausing_active_transfer_keeps_partial_and_prevents_completion(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    payload = b"a" * (256 * 1024) + b"b" * 10
    file = dict(repo="test/repo", revision="fixed", component="base", name="weights.safetensors", size=len(payload), sha256=hashlib.sha256(payload).hexdigest(), blob_id=None)
    monkeypatch.setattr(manager, "_manifest", lambda _: [file])
    monkeypatch.setattr(manager, "_hub", lambda: SimpleNamespace(hf_hub_url=lambda *args, **kwargs: "https://hub.test/file"))
    class PausedStream(httpx.SyncByteStream):
        def __iter__(self):
            yield payload[:256 * 1024]
            manager.pause_download("model-animatediff")
            yield payload[256 * 1024:]
    original = httpx.Client
    monkeypatch.setattr(httpx, "Client", lambda **kwargs: original(transport=httpx.MockTransport(lambda _: httpx.Response(200, stream=PausedStream())), **kwargs))
    manager.start_model_download("model-animatediff")
    wait(manager)
    assert manager.get_download_status("model-animatediff").status == "paused"
    assert manager.get_download_status("model-animatediff").downloaded_bytes == 256 * 1024
    assert manager._partial_path("model-animatediff", file).stat().st_size == 256 * 1024


def test_restart_auto_resumes_with_new_service(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    files = fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    partial = manager._partial_path("model-animatediff", files[0])
    partial.parent.mkdir(parents=True)
    partial.write_bytes(b"wei")
    manager._update("model-animatediff", "downloading", 3)
    manager.shutdown()
    restarted = ModelManagerService(manager.database, manager.root)
    monkeypatch.setattr(restarted, "_hub", manager._hub)
    try:
        restarted.initialize()
        wait(restarted)
        assert restarted.get_download_status("model-animatediff").status == "completed"
    finally:
        restarted.shutdown()
        restarted._executor.shutdown(wait=True)


def test_pause_cancels_network_retry(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_manifest(manager, monkeypatch)
    calls = fake_hub(manager, monkeypatch, ConnectionError())
    manager.start_model_download("model-animatediff")
    wait(manager)
    timer = manager._timers["model-animatediff"]
    assert manager.pause_download("model-animatediff").status == "paused"
    timer.function()  # A timer already firing must also honor manual pause.
    wait(manager)
    assert len(calls) == 1
    assert manager.get_download_status("model-animatediff").status == "paused"


def test_server_without_range_safely_restarts_file(manager: ModelManagerService, monkeypatch: pytest.MonkeyPatch) -> None:
    original = httpx.Client
    files = fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    partial = manager._partial_path("model-animatediff", files[0])
    partial.parent.mkdir(parents=True)
    partial.write_bytes(b"wei")
    monkeypatch.setattr(httpx, "Client", lambda **kwargs: original(transport=httpx.MockTransport(lambda _: httpx.Response(200, content=b"weight")), **kwargs))
    manager.start_model_download("model-animatediff")
    wait(manager)
    assert manager._path("model-animatediff", files[0]).read_bytes() == b"weight"
    assert manager.get_download_status("model-animatediff").status == "completed"


def test_delete_bundle_and_reinstall(manager, monkeypatch):
    fake_manifest(manager, monkeypatch)
    fake_hub(manager, monkeypatch)
    manager.prepare("model-animatediff")
    manager.start_model_download("model-animatediff")
    wait(manager)
    other = manager.root / "unrelated"
    other.mkdir()
    (other / "keep.txt").write_text("keep")
    assert manager.delete_model("model-animatediff").status == "Not Installed"
    assert not (manager.root / "animatediff").exists()
    assert (other / "keep.txt").exists()
    assert manager._row("model-animatediff") is None
    manager.prepare("model-animatediff")
    manager.start_model_download("model-animatediff")
    wait(manager)
    assert manager.get_model("model-animatediff").status == "Installed"


def test_delete_rejects_active_and_unknown(manager, monkeypatch):
    fake_manifest(manager, monkeypatch)
    manager.prepare("model-animatediff")
    manager._update("model-animatediff", "downloading", 0)
    with pytest.raises(ModelDownloadError) as error:
        manager.delete_model("model-animatediff")
    assert error.value.code == 409
    with pytest.raises(ModelDownloadError) as error:
        manager.delete_model("../outside")
    assert error.value.code == 404


def test_delete_rejects_generation(manager, monkeypatch):
    fake_manifest(manager, monkeypatch)
    manager.prepare("model-animatediff")
    with manager.database.get_connection() as conn:
        conn.execute("INSERT INTO generation_jobs(id,prompt,engine_type,provider_or_model,aspect_ratio,resolution,duration_seconds,status) VALUES('busy','test','local','model-animatediff','16:9','720p',5,'queued')")
    with pytest.raises(ModelDownloadError) as error:
        manager.delete_model("model-animatediff")
    assert error.value.code == 409
