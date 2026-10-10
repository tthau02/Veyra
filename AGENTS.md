# Veyra — Agent Guidelines & Architecture Manual

> **Scope**: This document defines the architectural rules, coding standards, and operational runbooks for AI agents (and human developers) working on the **Veyra** (Local AI Video Studio) codebase.

---

## 1. Project Mission & Identity

**Veyra** is a professional desktop application for local AI video generation on Windows (with cross-platform architecture ready for macOS/Linux).
- **Core Principle**: Complete hardware independence, privacy-first offline capability, zero cloud subscription requirements.
- **Architectural Philosophy**: **Strict Separation of Concerns** — Desktop UI / WebView layer is decoupled from the Python AI Compute Core.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│  DESKTOP SHELL (Tauri v2 / Rust / WebView2)           │
│  - Window Management (1280x820, Dark theme)            │
│  - Native Process Supervision & Lifetime Management     │
│  - Cross-Platform Packaging (EXE, MSI, DMG, AppImage)   │
└───────────────────────────┬────────────────────────────┘
                            │ (Local HTTP & SSE / WebSockets)
┌───────────────────────────▼────────────────────────────┐
│  DESKTOP UI (React 18 + TypeScript + Tailwind CSS)     │
│  - Studio Dashboard & Real-Time Hardware Telemetry     │
│  - Video Prompt Canvas & Aspect Ratio Matrix Picker    │
│  - Viewport Preview Player & Reactive Job State Machine│
│  - Local Models & Timeline Projects Management         │
└───────────────────────────┬────────────────────────────┘
                            │ http://127.0.0.1:8000/api
┌───────────────────────────▼────────────────────────────┐
│  PYTHON APPLICATION SERVICE (FastAPI + Pydantic v2)   │
│  - REST API & SSE Job Streaming (/api/v1/*)           │
│  - Crash-Proof Hardware Telemetry (CPU, RAM, GPU/CUDA) │
│  - SQLite Database Session Abstraction (veyra.db)       │
│  - Storage Directory Management (data/, models/, out/) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  AI COMPUTE CORE (Phase 2 - PyTorch + Diffusers)      │
│  - Latent Diffusion & Video Transformer Pipelines      │
│  - Model Offloading, Attention Slicing & VAE Tiling    │
│  - FFmpeg Temporal Frame Interpolation & Muxing        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Mandatory Agent Rules & Constraints

### ⚠️ Rule 1: Zero Hardcoded Paths
- **Never** hardcode Windows paths like `C:\Users\Admin\...` or absolute drive letters in application code.
- In Python: Always use `Path(__file__).resolve().parent...` or `settings.PROJECT_ROOT`.
- In Frontend: Use relative assets or `import.meta.env.VITE_API_BASE_URL`.

### ⚠️ Rule 2: Crash-Proof Hardware Detection
- The backend must **NEVER crash** because a machine lacks an NVIDIA GPU, CUDA, or proper graphics drivers.
- All GPU and CUDA inspections in `SystemService` must be wrapped in safe try/except guards and subprocess timeouts with graceful fallback (`cuda_available: false`).

### ⚠️ Rule 3: Decoupled API Contracts
- Frontend components must **never** perform direct filesystem operations or mock backend logic locally if an API endpoint exists.
- All requests flow through `frontend/src/services/api.ts` with timeout safeguards (`AbortSignal.timeout`) so the UI stays responsive even if the backend is restarting.

### ⚠️ Rule 4: Type Safety & Validation
- **TypeScript**: Strict mode enabled (`noImplicitAny: true`, unused locals checked). All data shapes must match `src/types/index.ts`.
- **Python**: Type annotations on all function signatures. All API request/response bodies must use Pydantic v2 schemas in `backend/app/schemas/`.

### ⚠️ Rule 5: UI Consistency & Anti-Clutter (Tuyệt đối không thêm UI lạ)
- **Không tự ý thêm banner/alert lạ**: Tuyệt đối không tự ý thêm các banner thông tin, banner giới thiệu, hoặc hộp cảnh báo màu sắc (info/alert boxes) làm rối mắt hoặc phá vỡ cấu trúc thiết kế gốc của hệ thống.
- **Không đưa thuật ngữ nội bộ dev lên UI**: Tuyệt đối không hiển thị các nhãn, badge hoặc thuật ngữ nhà phát triển (như `Phase 2`, `Mock Data`, `Checkpoint`, `Local AI Weights`, đường dẫn thư mục `models/`...) lên giao diện người dùng.

### ⚠️ Rule 6: Concise Studio Copywriting (Text ngắn gọn, đúng chủ đề)
- **Ngắn gọn & Súc tích**: Toàn bộ câu từ (copywriting), nhãn (label), và nút bấm trên giao diện phải ngắn gọn, súc tích, đi thẳng vào chủ đề. Tuyệt đối không viết văn giải thích dài dòng.
- **Chuẩn ngôn ngữ Studio sáng tạo**: Sử dụng từ ngữ chuyên nghiệp, dễ hiểu (ví dụ: `Cấu hình Video`, `Mô hình`, `Tải về`, `Đã cài đặt`, `Cục bộ (GPU)`, `Đám mây`).

---

## 4. Development & Operation Runbooks

### 🚀 Starting Development Environment
Always run from the workspace root (`d:\CodeDenChet\Veyra`):

```bat
# Option 1: 1-Click Batch (Recommended on Windows)
.\start-dev.bat

# Option 2: Via Master Dev Orchestrator
.\.venv\Scripts\python.exe scripts\dev.py

# Option 3: Via NPM
npm run dev
```

### 🧪 Running Tests
Always verify code changes before committing:

```powershell
# Run backend pytest suite
.\.venv\Scripts\pytest.exe -v backend/tests

# Check TypeScript & compile frontend
npm --prefix frontend run build
```

### 📦 Building Standalone Desktop Executable
```powershell
npm run build:frontend
npm run tauri:build
```

---

## 5. Phase 2 AI Integration Blueprint

When transitioning to Phase 2:
1. **PyTorch Environment**:
   - Install `torch>=2.4.0` with CUDA 12.x wheels into `.venv`.
   - Install `diffusers>=0.30.0`, `transformers>=4.44.0`, `accelerate>=0.33.0`.
2. **AI Engine Service**:
   - Implement real pipeline execution in `backend/app/services/ai_engine_service.py`.
   - Utilize `pipe.enable_model_cpu_offload()` and `pipe.vae.enable_slicing()` for consumer VRAM safety.
3. **Progress Streaming**:
   - Expose SSE endpoint `/api/generate/jobs/{id}/stream` to feed step-by-step diffusion progress to the preview canvas.
4. **FFmpeg Video Stitching**:
   - Mux output latent frames into H.264 MP4 with constant rate factor (CRF) optimization.

---

## 6. Available Agent Skills

Specialized skill packages are available in `.agents/skills/`:
- **`veyra-ai-engine`**: Deep-dive runbook for PyTorch, Diffusers, AnimateDiff, and VRAM offload.
- **`tauri-desktop-builder`**: Tauri v2 packaging, sidecar PyInstaller bundling, and Windows/macOS builds.
- **`fastapi-service-dev`**: Architecture guide for extending FastAPI endpoints, Pydantic schemas, and SQLite.
- **`studio-ui-styling`**: Design tokens, component rules, and layout systems for the dark studio theme.
