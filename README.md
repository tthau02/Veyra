# Veyra — Local AI Video Studio

<div align="center">

![Veyra Desktop Studio](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-09090b?style=for-the-badge&logo=windows&logoColor=white)
![Tauri v2](https://img.shields.io/badge/Tauri-v2.12-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A professional, privacy-first desktop application for local AI video generation.**  
*Generate high-fidelity videos directly on your local consumer hardware with zero cloud subscriptions.*

[Architecture](#-architecture) • [Quick Start](#-quick-start) • [Feature Matrix](#-features--phase-roadmap) • [Hardware Requirements](#-hardware-requirements) • [API Reference](#-api-specification) • [Advanced Roadmap Docs](docs/README.md)

</div>

---

## 🌟 Executive Overview

**Veyra** (*Local AI Video Studio*) is an open-architecture desktop application built from the ground up for generative media creators, video editors, and AI researchers. 

Unlike browser-based web wrappers or heavy Electron applications that consume gigabytes of idle RAM, Veyra leverages **Tauri v2** and native **Microsoft Edge WebView2** to provide a featherweight desktop experience (~40MB RAM footprint). The application is powered by an asynchronous **Python FastAPI Core**, allowing full access to local GPU acceleration (NVIDIA CUDA, PyTorch, Diffusers) while maintaining a strict separation between the user interface and AI inference engines.

---

## 🏗️ Architecture

Veyra enforces a **Strict Decoupled Architecture**: the desktop UI and the AI compute core run as isolated services communicating via high-speed localhost REST and Server-Sent Events (SSE).

```
┌────────────────────────────────────────────────────────┐
│  DESKTOP SHELL (Tauri v2 / Rust 1.99 / WebView2)      │
│  - Window Management (1280x820, Dark Studio Canvas)    │
│  - Native Process Supervision & Lifetime Management     │
│  - Cross-Platform Packaging (EXE, MSI, DMG, AppImage)   │
└───────────────────────────┬────────────────────────────┘
                            │ (Local HTTP & SSE / WebSockets)
┌───────────────────────────▼────────────────────────────┐
│  STUDIO UI (React 18 + TypeScript + Tailwind CSS)      │
│  - Real-Time Hardware Telemetry (CPU, RAM, GPU, VRAM)  │
│  - Creative Prompt Canvas & Aspect Ratio Matrix Picker │
│  - Interactive Viewport Player & Job State Machine     │
│  - Model Catalog & Multi-Project Timeline Manager      │
└───────────────────────────┬────────────────────────────┘
                            │ http://127.0.0.1:8000/api
┌───────────────────────────▼────────────────────────────┐
│  PYTHON APPLICATION SERVICE (FastAPI + Pydantic v2)   │
│  - REST API & Job Pipeline Dispatcher (/api/v1/*)      │
│  - Crash-Proof Hardware Telemetry (psutil / nvidia-smi)│
│  - SQLite Database Session Abstraction (data/veyra.db)  │
│  - Local Directory Management (data/, models/, out/)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  AI COMPUTE CORE (Phase 2 - PyTorch + Diffusers)      │
│  - Latent Diffusion & Video Transformers (AnimateDiff) │
│  - Sequential CPU Model Offloading & VAE Slicing/Tiling│
│  - FFmpeg Temporal Frame Interpolation & Muxing        │
└────────────────────────────────────────────────────────┘
```

---

## 🖥️ System Hardware Requirements

Because Veyra executes AI synthesis locally on your machine, performance depends on available hardware:

| Component | Minimum (UI & Development) | Recommended (Fast Local AI Video) |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 (64-bit) or macOS (Apple Silicon) | Windows 11 (64-bit) |
| **Processor (CPU)** | Intel Core i5 / AMD Ryzen 5 (4+ Cores) | Intel Core i7/i9 or AMD Ryzen 7/9 (8+ Cores) |
| **System Memory (RAM)** | 8 GB RAM | 32 GB RAM |
| **Graphics (GPU)** | Integrated Graphics (CPU Mode active) | **NVIDIA RTX 3060 / 3070 / 4070+ (8GB - 16GB+ VRAM)** |
| **CUDA Support** | Not required for Phase 1 UI exploration | **CUDA 12.1+ / Tensor Cores enabled** |
| **Storage** | 2 GB free disk space | 50 GB+ SSD free space (for AI model weights) |

> 🛡️ **Crash-Proof Guarantee**: If your workstation lacks an NVIDIA GPU or graphics drivers, Veyra will gracefully detect this, display a clear fallback badge, and keep all desktop features operational without crashing.

---

## ⚡ Quick Start

### 1. One-Click Batch Launch (Recommended on Windows)

Simply execute the batch launcher from the repository root:

```bat
.\start-dev.bat
```

Or via the Python orchestrator:

```powershell
.\.venv\Scripts\python.exe scripts\dev.py
```

**What happens automatically:**
1. Verifies virtual environment and injects toolchain paths (`cargo`, `gcc`).
2. Starts the Python FastAPI backend service at `http://127.0.0.1:8000`.
3. Polls `GET /api/health` until the backend reports ready.
4. Spawns the native desktop window **Local AI Video Studio** (1280x820).
5. Cleanly terminates background processes when the desktop window is closed.

---

### 2. Standalone Development (For Component Debugging)

#### Run Backend Service Standalone
```powershell
.\.venv\Scripts\python.exe scripts\run_backend.py
```
* Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
* Health Check: `http://127.0.0.1:8000/api/health`

#### Run Frontend in Web Browser
```powershell
npm --prefix frontend run dev
```
* Accessible at: `http://localhost:5173`

#### Launch Desktop Shell
```powershell
npm run tauri:dev
```

---

## 📋 Features & Phase Roadmap

### Phase 1: Architecture & Desktop Foundation *(Completed ✅)*
- [x] **Windows Native Desktop Shell**: Packaged via Tauri v2 with dark window chrome and zero-latency WebView2 rendering.
- [x] **Creative Studio UI**: Modern dark theme (`#09090b`), custom slim scrollbars, and high-end Lucide creative icons.
- [x] **Real-Time Hardware Telemetry**: Live polling of CPU usage, RAM capacity, and NVIDIA GPU/CUDA detection without crashing on non-NVIDIA systems.
- [x] **Studio Navigation**:
  - **Dashboard**: Stats cards (Projects, Videos, Models, GPU), recent timelines, quick creation CTA.
  - **Create Video**: Prompt canvas, negative prompt, aspect ratio matrix (16:9, 9:16, 1:1), resolution (512p, 720p, 1080p), duration, seed controls.
  - **Studio Viewport**: Interactive preview player with simulated synthesis pipeline (`Queued` → `Generating` → `Completed`) with 0-100% progress tracking.
  - **Projects Management**: Searchable grid of video timelines, duration tags, resolution badges, creation modal.
  - **Model Registry**: Catalog of local checkpoints with mock download/install dispatcher.
  - **Settings**: Categorized configuration for General, AI Engine, GPU acceleration, and local storage directories.
- [x] **Decoupled Python Backend**: FastAPI application service with Pydantic v2 schemas and SQLite persistence abstraction.
- [x] **Automated Test Suite**: 100% pass rate across 5 automated pytest suites.

### Phase 2: Local AI Synthesis Engine *(Upcoming 🚀)*
- [ ] **PyTorch CUDA & Diffusers Integration**: Direct execution of latent diffusion pipelines (AnimateDiff, CogVideoX, SDXL).
- [ ] **Hardware Memory Offloading**: Model CPU offloading, VAE slicing, and temporal tiling for consumer GPU VRAM optimization.
- [ ] **Real-Time Progress Streaming**: Server-Sent Events (SSE) streaming step-by-step diffusion latents to the preview viewport.
- [ ] **FFmpeg Video Post-Processing**: Automated frame interpolation, temporal smoothing, and H.264/H.265 MP4 export.
- [ ] **Hugging Face Model Downloader**: Background thread model downloader with resume capability and progress bars.
- [ ] **Full SQLite Database ORM**: Persistent project state, history tracking, and generation metadata management.

---

## 📡 API Specification

| Method | Endpoint | Description | Phase 1 Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service status, app title, version | **Active** (`200 OK`) |
| `GET` | `/api/system/info` | CPU, RAM, GPU name, VRAM, and CUDA status | **Active** (`200 OK`) |
| `GET` | `/api/projects` | List all saved projects and timelines | **Active** (`200 OK`) |
| `POST` | `/api/projects` | Create a new project record | **Active** (`201 Created`) |
| `DELETE` | `/api/projects/{id}` | Delete a project record | **Active** (`204 No Content`) |
| `GET` | `/api/models` | List available models & installation status | **Active** (`200 OK`) |
| `POST` | `/api/models/{id}/install` | Trigger model checkpoint installation | **Active** (Mock Dispatcher) |
| `POST` | `/api/generate` | Contract video generation request | **Active** (`not_implemented` stub) |
| `POST` | `/api/generate/simulate` | Trigger interactive UI pipeline simulation | **Active** (Returns `job_id`) |
| `GET` | `/api/generate/jobs/{id}` | Poll generation progress & step telemetry | **Active** (`0% - 100%`) |

---

## 🧪 Testing & Verification

Run the automated backend test suite:

```powershell
.\.venv\Scripts\pytest.exe -v backend/tests
```

**Verified Test Suites:**
* `test_health_endpoint` ✅ PASSED
* `test_system_info_endpoint` ✅ PASSED
* `test_ai_engine_generate_stub` ✅ PASSED
* `test_projects_crud` ✅ PASSED
* `test_models_endpoint` ✅ PASSED

Verify frontend TypeScript types and production bundling:

```powershell
npm --prefix frontend run build
```

---

## 📦 Production Desktop Build

To compile a standalone Windows installer and executable:

```powershell
npm run build:frontend
npm run tauri:build
```

The compiled release executable will be located in:
```
src-tauri/target/release/
```

---

## 🤖 Agent Development & Skills

This repository is equipped with comprehensive agent instructions and runbooks for AI pair programmers:
* **[AGENTS.md](file:///d:/CodeDenChet/Veyra/AGENTS.md)**: Master developer and agent instruction manual.
* **`.agents/rules/`**: Architectural and coding constraints.
* **`.agents/skills/`**: Specialized runbooks for AI video pipelines (`veyra-ai-engine`), desktop bundling (`tauri-desktop-builder`), API development (`fastapi-service-dev`), and creative studio UI (`studio-ui-styling`).

---

## 📄 License

Veyra is distributed under the MIT License. See `LICENSE` for details.
