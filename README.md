# Veyra — Local AI Video Studio (Phase 1)

A modern, high-performance desktop application for local AI video synthesis on Windows. Built with a clean decoupled architecture featuring a **Python AI Core** and a **React + Tailwind + Tauri Desktop Interface**.

---

## 1. System Architecture

```
local-ai-video-studio/
│
├── backend/                  # Python 3.11+ / FastAPI Application Service
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, lifespan, CORS
│   │   ├── api/              # API router & v1 route endpoints
│   │   │   └── v1/           # /health, /system/info, /projects, /models, /generate
│   │   ├── core/             # Configuration (pydantic-settings) & SQLite abstraction
│   │   ├── models/           # Domain entity definitions
│   │   ├── services/         # SystemService, ProjectService, AIEngineService
│   │   └── schemas/          # Pydantic request / response schemas
│   ├── tests/                # Automated pytest test suites
│   ├── requirements.txt      # Backend Python dependencies
│   └── README.md
│
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Layout and UI primitives
│   │   ├── layouts/          # MainLayout (Sidebar + Header + Viewport)
│   │   ├── pages/            # Dashboard, Create Video, Projects, Models, Settings
│   │   ├── services/         # api.ts (Backend communication abstraction)
│   │   ├── types/            # TypeScript strict type definitions
│   │   └── App.tsx           # App orchestration & reactive state
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── src-tauri/                # Tauri v2 Windows Desktop Shell
│   ├── src/                  # Rust application bootstrap (main.rs, lib.rs)
│   ├── Cargo.toml            # Rust dependencies & metadata
│   └── tauri.conf.json       # Desktop window specifications (1280x820, dark theme)
│
├── scripts/
│   ├── dev.py                # Master developer runner (Starts backend + launches Tauri)
│   ├── run_backend.py        # Standalone FastAPI uvicorn runner
│   └── run_frontend.py       # Standalone Vite dev runner
│
├── data/                     # Application data & SQLite storage
├── models/                   # Local weights and model storage directory
├── outputs/                  # Rendered video exports
│
├── start-dev.bat             # One-click Windows startup script
├── .env.example              # Environment variables template
├── .gitignore                # Production git ignore configuration
├── pyproject.toml            # Python project definition
└── README.md
```

---

## 2. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Desktop Shell** | Tauri v2 (Rust) | Native Windows window, WebView2, minimal RAM footprint |
| **Frontend UI** | React 18 + TypeScript | Strict typing, componentized architecture |
| **Styling** | Tailwind CSS | Sleek dark studio aesthetic (#09090b), micro-animations |
| **Icons** | Lucide React | High-end creative studio iconography |
| **Backend Core** | Python 3.11+ / FastAPI | Async high-performance REST API |
| **Telemetry** | `psutil` + `subprocess` | Crash-proof GPU/CUDA & CPU/RAM detection |
| **Validation** | Pydantic v2 + Pydantic Settings | Type-safe configuration & request handling |
| **Storage** | SQLite Database Abstraction | Lightweight session/connection factory ready for Phase 2 |

---

## 3. Quick Start (Development)

### One-Command Startup (Recommended)

Simply run:

```bat
.\start-dev.bat
```

Or via Python:

```bash
.\.venv\Scripts\python.exe scripts\dev.py
```

This will automatically:
1. Start the FastAPI backend service at `http://127.0.0.1:8000`.
2. Verify backend readiness via `GET /api/health`.
3. Launch the native Windows desktop studio window: **Local AI Video Studio**.
4. Automatically terminate background servers when you close the desktop app.

---

## 4. Standalone Execution (For Debugging)

### Backend Only

```bash
.\.venv\Scripts\python.exe scripts\run_backend.py
```
- Endpoint: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### Frontend Web Only (Browser Mode)

```bash
cd frontend
npm run dev
```
- Available at `http://localhost:5173`

### Desktop Shell (Tauri Dev)

```bash
npm run tauri dev
```

---

## 5. Automated Tests

Run the backend test suite:

```bash
.\.venv\Scripts\pytest.exe -v backend/tests
```

**Results:**
- `test_health_endpoint` PASSED
- `test_system_info_endpoint` PASSED
- `test_ai_engine_generate_stub` PASSED
- `test_projects_crud` PASSED
- `test_models_endpoint` PASSED

---

## 6. Production Build

To compile the production desktop executable:

```bash
npm run build:frontend
npm run tauri:build
```

The resulting standalone Windows installer/executable will be generated in `src-tauri/target/release/`.

---

## 7. Next Steps for Phase 2

- Integration of PyTorch (CUDA 12.x / ROCm / DirectML) and Diffusers pipelines.
- Implementation of ComfyUI / custom latent video generator runtime in `backend/app/services/ai_engine_service.py`.
- FFmpeg video muxing, temporal smoothing, and audio interpolation.
- Model checkpoint downloader with resume support and progress streaming.
- SQLite ORM database persistence for projects and generated media histories.
