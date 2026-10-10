"""Offline Diffusers inference and MP4 export on the local GPU."""
import asyncio
import gc
import secrets
from pathlib import Path
from typing import Any, Callable

from backend.app.core.config import settings
from backend.app.services.engines.base import BaseVideoEngine, GenerationParams, VideoGenerationResult

ProgressCallback = Callable[[str, int, str], None]


class LocalDiffusersEngine(BaseVideoEngine):
    def is_available(self) -> tuple[bool, str]:
        try:
            import torch
            if not torch.cuda.is_available():
                return False, "Không có GPU CUDA khả dụng."
            import diffusers
            import accelerate
            import imageio_ffmpeg
            return True, "Sẵn sàng"
        except ImportError:
            return False, "Chưa cài bộ xử lý AI. Cài thư viện tạo video trước khi chạy."
        except Exception:
            return False, "Không thể khởi tạo GPU. Kiểm tra trình điều khiển."

    @staticmethod
    def output_dimensions(aspect_ratio: str, resolution: str) -> tuple[int, int]:
        short = {"512p": 512, "720p": 720, "1080p": 1080}[resolution]
        long = round(short * 16 / 9 / 2) * 2
        return (long, short) if aspect_ratio == "16:9" else (short, long) if aspect_ratio == "9:16" else (short, short)

    def _load_pipeline(self, model_id: str) -> Any:
        import torch
        from diffusers import AnimateDiffPipeline, CogVideoXPipeline, EulerDiscreteScheduler, MotionAdapter
        from safetensors.torch import load_file

        if model_id == "model-animatediff":
            root = settings.MODELS_DIR / "animatediff"
            adapter = MotionAdapter()
            adapter.load_state_dict(load_file(str(root / "adapter" / "animatediff_lightning_4step_diffusers.safetensors")))
            pipe = AnimateDiffPipeline.from_pretrained(str(root / "base"), motion_adapter=adapter, torch_dtype=torch.float16, local_files_only=True, use_safetensors=True)
            pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing", beta_schedule="linear")
        elif model_id == "model-cogvideox":
            pipe = CogVideoXPipeline.from_pretrained(str(settings.MODELS_DIR / "cogvideox-2b" / "pipeline"), torch_dtype=torch.float16, local_files_only=True, use_safetensors=True)
        else:
            raise ValueError("Mô hình chưa hỗ trợ tạo video.")

        # Apply memory settings without suppressing errors or silently disabling safeguards.
        pipe.vae.enable_slicing()
        pipe.vae.enable_tiling()
        vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
        if model_id == "model-cogvideox" and vram < 12:
            pipe.enable_sequential_cpu_offload()
        elif vram < 16:
            pipe.enable_model_cpu_offload()
        else:
            pipe.to("cuda")
        if model_id == "model-animatediff":
            pipe.enable_vae_slicing()
            pipe.unet.enable_forward_chunking(chunk_size=1, dim=1)
        pipe.set_progress_bar_config(disable=True)
        return pipe

    def _encode(self, frames: list[Any], destination: Path, width: int, height: int, seconds: int) -> None:
        import imageio_ffmpeg
        import numpy as np
        from PIL import Image, ImageOps

        destination.parent.mkdir(parents=True, exist_ok=True)
        # Constant output frame rate; resize/crop only during export to preserve GPU memory.
        writer = imageio_ffmpeg.write_frames(str(destination), (width, height), fps=24, codec="libx264", pix_fmt_in="rgb24", pix_fmt_out="yuv420p", macro_block_size=2, output_params=["-crf", "18", "-movflags", "+faststart"])
        writer.send(None)
        try:
            for index in range(seconds * 24):
                frame = frames[min(len(frames) - 1, index * len(frames) // (seconds * 24))]
                image = frame if isinstance(frame, Image.Image) else Image.fromarray((np.asarray(frame) * 255).clip(0, 255).astype("uint8"))
                image = ImageOps.fit(image.convert("RGB"), (width, height), method=Image.Resampling.LANCZOS)
                writer.send(np.asarray(image).tobytes())
        finally:
            writer.close()

    def render(self, params: GenerationParams, job_id: str, progress: ProgressCallback) -> dict[str, Any]:
        import torch
        pipe = None
        destination = settings.OUTPUTS_DIR / f"{job_id}.mp4"
        temporary = destination.with_name(f"{job_id}.partial.mp4")
        seed = params.seed if params.seed is not None else secrets.randbelow(2**31)
        try:
            progress("generating", 2, "Đang nạp mô hình…")
            pipe = self._load_pipeline(params.model_or_provider_id)
            steps = 4 if params.model_or_provider_id == "model-animatediff" else 30
            def callback(_pipe: Any, step: int, _timestep: Any, kwargs: dict[str, Any]) -> dict[str, Any]:
                progress("decoding" if step + 1 == steps else "generating", 10 + int((step + 1) * 75 / steps), "Đang dựng khung hình…" if step + 1 == steps else f"Đang tạo video {step + 1}/{steps}")
                return kwargs

            generator = torch.Generator(device="cpu").manual_seed(seed)
            if params.model_or_provider_id == "model-animatediff":
                width, height = {"16:9": (512, 288), "9:16": (288, 512), "1:1": (512, 512)}[params.aspect_ratio]
                frame_count = 16 if params.duration_seconds == 5 else 32
                kwargs = dict(width=width, height=height, num_frames=frame_count, guidance_scale=1.0)
            else:
                kwargs = dict(width=720, height=480, num_frames=49, guidance_scale=6.0)
            with torch.inference_mode():
                frames = pipe(prompt=params.prompt, negative_prompt=params.negative_prompt or "", num_inference_steps=steps, generator=generator, callback_on_step_end=callback, **kwargs).frames[0]
            if not len(frames):
                raise RuntimeError("Không có khung hình đầu ra.")
            progress("muxing", 90, "Đang xuất video…")
            width, height = self.output_dimensions(params.aspect_ratio, params.resolution)
            self._encode(frames, temporary, width, height, params.duration_seconds)
            if not temporary.is_file() or temporary.stat().st_size < 1024:
                raise RuntimeError("Không thể xuất video.")
            temporary.replace(destination)
            return dict(width=width, height=height, frame_count=params.duration_seconds * 24, seed=seed)
        finally:
            temporary.unlink(missing_ok=True)
            if pipe is not None:
                del pipe
            gc.collect()
            try:
                torch.cuda.empty_cache()
            except Exception:
                pass

    async def generate_video(self, params: GenerationParams, job_id: str) -> VideoGenerationResult:
        await asyncio.to_thread(self.render, params, job_id, lambda *_: None)
        return VideoGenerationResult(job_id=job_id, status="completed", progress=100, video_path=f"/outputs/{job_id}.mp4", current_step="Hoàn tất")


local_engine = LocalDiffusersEngine()
