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

## Model downloads

The model library downloads AnimateDiff Lightning 4-step (including epiCRealism)
and CogVideoX-2B from pinned Hugging Face revisions. Downloading does not require CUDA.
Use **Tạm dừng** to pause and **Tải tiếp** to resume without another confirmation.
Manual pauses survive application restarts. Other interrupted downloads resume when
the backend starts; network failures retry automatically with a delay up to 60 seconds.
Authentication, permissions and disk-space failures require user correction.

Stable partial files live under each model bundle's `.cache/veyra/` directory.
Do not remove this cache while a download is paused. Completed files are checked
against the saved manifest before being marked installed. Download state is stored
in SQLite. Use `HF_TOKEN` or an existing Hugging Face login for gated repositories.

Endpoints: `POST /api/models/{id}/prepare`, `/install`, `/pause`, `/resume`,
and `GET /api/models/{id}/download-status`. Install/resume return HTTP 202.

## Local video generation

Install the optional GPU runtime from the project root (Windows NVIDIA):

```powershell
.\.venv\Scripts\python.exe -m pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu126
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-ai.txt
```

Restart the backend after installation. Only fully installed AnimateDiff Lightning
and CogVideoX bundles can generate. Model loading uses local files exclusively.
One GPU job runs at a time; state and output metadata persist in SQLite. The old
simulation endpoint returns 410. Failed/interrupted jobs never show completed output.

AnimateDiff samples at up to 512 pixels on the long edge (16 frames for 5 seconds,
32 for 10 seconds). CogVideoX-2B samples 49 frames at 720×480. The export resolution
controls MP4 resize/crop, not native model resolution. Export uses H.264 at 24 fps,
repeating sampled frames to match the requested duration. CogVideoX uses sequential
CPU offload on GPUs below 12 GB and can be considerably slower than AnimateDiff.

Run an offline smoke generation through the actual dispatcher:

```powershell
.\.venv\Scripts\python.exe scripts\verify_generation.py
```

The studio polls real sampling progress and plays the resulting MP4 from
`GET /api/generate/jobs/{id}/video`; `?download=true` downloads it.

## Testing

```bash
.\.venv\Scripts\pytest.exe -v backend/tests
```
