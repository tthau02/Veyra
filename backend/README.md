# Veyra Backend (Python AI Core & Application Service)

FastAPI application service powering the Local AI Video Studio desktop application.

## Architecture

- **`app/main.py`**: Application bootstrap, lifespan event handlers, and CORS policy configuration.
- **`app/core/config.py`**: Pydantic Settings management and runtime folder initialization.
- **`app/core/database.py`**: SQLite database abstraction layer ready for Phase 2 migrations.
- **`app/api/v1/`**: REST API endpoints:
  - `health.py`: `GET /api/health`
  - `system.py`: `GET /api/system/info` (Safe hardware detection: CPU, RAM, GPU, CUDA)
  - `projects.py`: `GET/POST /api/projects`
  - `models.py`: `GET/POST /api/models`
  - `generate.py`: `POST /api/generate` (Phase 1 contract stub & interactive simulation)
- **`app/services/`**: Domain services:
  - `system_service.py`: Hardware detection with crash-proof fallback when GPU/CUDA is absent.
  - `project_service.py`: Project persistence abstraction.
  - `ai_engine_service.py`: AI generation stub and mock execution tracker.
- **`app/schemas/`**: Pydantic v2 validation models.

## Running Standalone

```bash
# Using project virtual environment
.\.venv\Scripts\python.exe scripts\run_backend.py
```

API documentation will be available at: `http://127.0.0.1:8000/docs`

## Testing

```bash
.\.venv\Scripts\pytest.exe -v backend/tests
```
