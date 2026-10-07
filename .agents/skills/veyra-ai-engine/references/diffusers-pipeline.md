# Diffusers Video Generation Implementation Reference

This document provides template code and best practices for integrating Diffusers text-to-video models into Veyra's `AIEngineService`.

---

## 1. Minimal Working Inference Example (AnimateDiff)

```python
import torch
from diffusers import AnimateDiffPipeline, MotionAdapter, EulerDiscreteScheduler
from diffusers.utils import export_to_video

def generate_animatediff_video(
    prompt: str,
    negative_prompt: str,
    output_path: str,
    num_frames: int = 16,
    num_inference_steps: int = 25,
    guidance_scale: float = 7.5,
    seed: int = 42,
    progress_callback = None,
):
    # 1. Load motion adapter
    adapter = MotionAdapter.from_pretrained(
        "guoyww/animatediff-motion-adapter-v1-5-2",
        torch_dtype=torch.float16
    )

    # 2. Load base SD1.5 model with motion adapter
    pipe = AnimateDiffPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        motion_adapter=adapter,
        torch_dtype=torch.float16
    )
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config)

    # 3. Enable memory optimizations
    pipe.enable_model_cpu_offload()
    pipe.vae.enable_slicing()

    # 4. Set deterministic generator
    generator = torch.Generator(device="cpu").manual_seed(seed)

    # 5. Denoise with step callback
    def step_callback(step, timestep, latents):
        if progress_callback:
            percent = int((step / num_inference_steps) * 100)
            progress_callback(percent, f"Sampling frame step {step}/{num_inference_steps}")

    output = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_frames=num_frames,
        guidance_scale=guidance_scale,
        num_inference_steps=num_inference_steps,
        generator=generator,
        callback=step_callback,
        callback_steps=1,
    )

    # 6. Export frames to MP4
    frames = output.frames[0]
    export_to_video(frames, output_path, fps=8)
    return output_path
```

---

## 2. CogVideoX Inference Template

```python
import torch
from diffusers import CogVideoXPipeline
from diffusers.utils import export_to_video

def generate_cogvideox_video(
    prompt: str,
    output_path: str,
    num_inference_steps: int = 30,
    guidance_scale: float = 6.0,
):
    pipe = CogVideoXPipeline.from_pretrained(
        "THUDM/CogVideoX-2b",
        torch_dtype=torch.bfloat16
    )

    pipe.enable_model_cpu_offload()
    pipe.vae.enable_slicing()
    pipe.vae.enable_tiling()

    video = pipe(
        prompt=prompt,
        num_videos_per_prompt=1,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
    ).frames[0]

    export_to_video(video, output_path, fps=8)
    return output_path
```
