---
name: veyra-ai-engine
description: >-
  Use this skill when developing, testing, or integrating AI video generation models,
  PyTorch CUDA pipelines, Hugging Face Diffusers, AnimateDiff, CogVideoX, VRAM memory offload,
  or video inference optimization in Veyra.
---

# Veyra AI Engine Skill

This skill provides step-by-step procedures and memory optimization runbooks for implementing local AI video generation in Veyra's Python backend.

---

## 1. Supported Pipeline Architectures

1. **Latent Diffusion / Motion Adapters (AnimateDiff)**:
   - Base model: Stable Diffusion 1.5 or SDXL.
   - Motion module: AnimateDiff v3 / Lightning (4-step or 8-step distilled).
   - Target VRAM: 6GB - 12GB.
2. **Diffusion Transformers (CogVideoX-2B / 5B)**:
   - Text-to-Video transformer architecture with 3D VAE.
   - Target VRAM: 12GB - 24GB (or 8GB with FP8/Int8 quantization).

---

## 2. VRAM Optimization Matrix

Consumer GPUs require strict memory controls. Always apply these rules in `backend/app/services/ai_engine_service.py`:

```python
import torch

def configure_pipeline_optimizations(pipe, vram_gb: float):
    # 1. Cast model weights to half-precision
    if torch.cuda.is_available() and torch.cuda.is_bf16_supported():
        pipe.to(torch.bfloat16)
    else:
        pipe.to(torch.float16)

    # 2. VAE Slicing & Tiling (Critical for video frames decoding)
    if hasattr(pipe, "vae"):
        pipe.vae.enable_slicing()
        pipe.vae.enable_tiling()

    # 3. Model CPU Offloading
    if vram_gb < 16.0:
        # Sequentially loads submodules to GPU only during active computation
        pipe.enable_model_cpu_offload()
    else:
        pipe.to("cuda")

    # 4. Attention Slicing
    if hasattr(pipe, "enable_attention_slicing"):
        pipe.enable_attention_slicing(slice_size="auto")
```

---

## 3. Asynchronous Job State Machine

All generation jobs must integrate with the standard Veyra job lifecycle:

1. **`queued`**: Job payload validated, device availability checked.
2. **`generating`**: Iterating through denoising steps ($1 \dots N$). Emits progress callbacks.
3. **`decoding`**: VAE decoding latent tensors into raw RGB frames.
4. **`muxing`**: FFmpeg converts image sequence to MP4 (`libx264`, `yuv420p`).
5. **`completed`**: File written to `outputs/<job_id>.mp4`, database updated.
6. **`failed`**: Caught exception, VRAM cleaned via `torch.cuda.empty_cache()`, error reported.

---

## 4. References & Documentation

- [Diffusers Video Pipeline Reference](./references/diffusers-pipeline.md)
