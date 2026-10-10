import threading
from pathlib import Path
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.core.config import settings
from backend.app.core.database import db_manager
from backend.app.services.engines.base import GenerationParams
from backend.app.services.engines.hub import EngineHub, GenerationError
from backend.app.services.engines.local_engine import LocalDiffusersEngine


@pytest.fixture
def hub(monkeypatch: pytest.MonkeyPatch):
    from backend.app.services.engines import hub as module
    monkeypatch.setattr(module.model_manager_service, "get_model", lambda _: SimpleNamespace(status="Installed", supported=True, files_complete=True))
    engine = SimpleNamespace(is_available=lambda: (True, ""))
    service = EngineHub(db_manager, engine)
    yield service
    service.shutdown()
    service._executor.shutdown(wait=True)


def drain(hub: EngineHub) -> None:
    hub._executor.submit(lambda: None).result(timeout=10)


def test_only_real_output_can_complete(hub: EngineHub) -> None:
    def render(params, job_id, progress):
        progress("generating", 50, "Sampling")
        progress("muxing", 90, "Encoding")
        assert hub.get_job_status(job_id).output_url is None
        (settings.OUTPUTS_DIR / f"{job_id}.mp4").write_bytes(b"video" * 300)
        return dict(width=1280, height=720, frame_count=120, seed=42)
    hub.engine.render = render
    job = hub.start_job(GenerationParams(prompt="City"))
    drain(hub)
    status = hub.get_job_status(job.job_id)
    assert status.status == "completed" and status.progress == 100
    assert status.width == 1280 and status.seed == 42
    restarted = EngineHub(db_manager, hub.engine)
    assert restarted.get_job_status(job.job_id).output_url == status.output_url
    restarted.shutdown()


@pytest.mark.parametrize("failure", ["missing", "oom", "exception"])
def test_failures_never_complete(hub: EngineHub, failure: str) -> None:
    def render(*args):
        if failure != "missing":
            raise RuntimeError("CUDA out of memory" if failure == "oom" else "failure")
        return {}
    hub.engine.render = render
    job = hub.start_job(GenerationParams(prompt="City"))
    drain(hub)
    status = hub.get_job_status(job.job_id)
    assert status.status == "failed" and status.output_url is None
    if failure == "oom":
        assert "bộ nhớ GPU" in status.error_message


def test_gpu_queue_and_polling_do_not_fake_progress(hub: EngineHub) -> None:
    gate = threading.Event()
    def render(params, job_id, progress):
        gate.wait(5)
        (settings.OUTPUTS_DIR / f"{job_id}.mp4").write_bytes(b"x" * 2048)
        return {}
    hub.engine.render = render
    first = hub.start_job(GenerationParams(prompt="First"))
    second = hub.start_job(GenerationParams(prompt="Second"))
    try:
        assert hub.get_job_status(second.job_id).status == "queued"
        for _ in range(10):
            assert hub.get_job_status(first.job_id).progress == 0
    finally:
        gate.set()
    drain(hub)


def test_cloud_and_missing_cuda_rejected(hub: EngineHub) -> None:
    with pytest.raises(GenerationError, match="đám mây"):
        hub.start_job(GenerationParams(prompt="City", engine_mode="cloud"))
    hub.engine.is_available = lambda: (False, "Không có CUDA")
    with pytest.raises(GenerationError, match="CUDA"):
        hub.start_job(GenerationParams(prompt="City"))


@pytest.mark.anyio
async def test_video_endpoint_download_and_range(hub: EngineHub, monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.app.api.v1 import generate
    from backend.app.main import app
    monkeypatch.setattr(generate, "engine_hub", hub)
    def render(params, job_id, progress):
        (settings.OUTPUTS_DIR / f"{job_id}.mp4").write_bytes(b"x" * 2048)
        return {}
    hub.engine.render = render
    job = hub.start_job(GenerationParams(prompt="City"))
    drain(hub)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.get(f"/api/generate/jobs/{job.job_id}/video", headers={"Range": "bytes=0-99"})
        assert response.status_code == 206 and len(response.content) == 100
        response = await client.get(f"/api/generate/jobs/{job.job_id}/video?download=true")
        assert "attachment" in response.headers["content-disposition"]
        assert (await client.post("/api/generate/simulate", json={"prompt": "City"})).status_code == 410
    (settings.OUTPUTS_DIR / f"{job.job_id}.mp4").unlink()
    assert hub.get_job_status(job.job_id).status == "failed"


def test_restart_fails_interrupted_generation(hub: EngineHub) -> None:
    with db_manager.get_connection() as conn:
        conn.execute("INSERT INTO generation_jobs(id,prompt,engine_type,provider_or_model,aspect_ratio,resolution,duration_seconds,status) VALUES('interrupted','test','local','model-animatediff','16:9','720p',5,'generating')")
    hub.initialize()
    assert hub.get_job_status("interrupted").status == "failed"


def test_output_dimensions() -> None:
    engine = LocalDiffusersEngine()
    assert engine.output_dimensions("16:9", "720p") == (1280, 720)
    assert engine.output_dimensions("9:16", "1080p") == (1080, 1920)
    assert engine.output_dimensions("1:1", "512p") == (512, 512)
