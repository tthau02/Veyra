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

AnimateDiff samples at up to 512 pixels on the long edge, at 8 source fps plus
one endpoint (41 frames for 5 seconds, 81 for 10). FreeNoise uses overlapping
16-frame windows and split inference to bound attention memory. Four-step
Lightning weights and guidance 1 remain unchanged. After releasing GPU weights,
FFmpeg motion-compensated interpolation produces 24 fps before Lanczos upscale.
It uses two CPU threads and does not require extra models. Fast motion/occlusion
can still produce interpolation artifacts; this is not RIFE or AI super-resolution.
CogVideoX-2B samples 49 frames at 720×480 and retains its previous repeated-frame
export. Export resolution controls MP4 resize, not native model resolution.
CogVideoX uses two-block
group offload on GPUs below 16 GB, without stream prefetch/pinned weight copies.
The text encoder is released after prompt encoding to reduce RAM usage during
denoising. Sampling stays at 30 steps and 720×480; it can still be considerably
slower than four-step AnimateDiff. Actual speed and peak memory require a GPU benchmark.

CogVideoX quality presets use 20 (fast), 30 (balanced, default), or 50 (quality)
steps, keeping 49 generated frames and native 720×480 resolution. Faster presets
trade detail for fewer denoising passes; they do not guarantee a fixed speedup.
CogVideoX exports preserve the entire native frame with padding when the requested
aspect differs, rather than cropping the subject. Logs record completed job timings.

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
