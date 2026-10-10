"""Redirect storage before application imports; tests never use studio data."""
import tempfile
from pathlib import Path

import pytest
from backend.app.core.config import settings

_storage = tempfile.TemporaryDirectory(prefix="veyra-tests-")
_root = Path(_storage.name)
settings.DATA_DIR = _root / "data"
settings.MODELS_DIR = _root / "models"
settings.OUTPUTS_DIR = _root / "outputs"


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
def isolated_storage(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.app.core.database import db_manager
    from backend.app.services.project_service import project_service
    from backend.app.services.model_manager_service import model_manager_service

    monkeypatch.setattr(settings, "DATA_DIR", tmp_path / "data")
    monkeypatch.setattr(settings, "MODELS_DIR", tmp_path / "models")
    monkeypatch.setattr(settings, "OUTPUTS_DIR", tmp_path / "outputs")
    monkeypatch.setattr(db_manager, "db_path", str(tmp_path / "test.db"))
    monkeypatch.setattr(model_manager_service, "root", tmp_path / "models")
    settings.init_directories()
    db_manager.initialize_schema()
    project_service._ensure_seed_data()
