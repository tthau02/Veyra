"""Offline Diffusers inference and MP4 export on the local GPU."""
import asyncio
import gc
import secrets
import logging
import time
from pathlib import Path
from typing import Any, Callable

from backend.app.core.config import settings
from backend.app.services.engines.base import BaseVideoEngine, GenerationParams, VideoGenerationResult

ProgressCallback = Callable[[str, int, str], None]
logger = logging.getLogger(__name__)


class LocalDiffusersEngine(BaseVideoEngine):
    @staticmethod
    def sampling_settings(params: GenerationParams) -> tuple[int, int]:
        if params.model_or_provider_id == "model-animatediff":
            return 4, params.duration_seconds * 8 + 1
        # Keep the trained spatial resolution; speed presets change steps only.
        return {"fast": 20, "balanced": 30, "quality": 50}[params.quality], 49

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
            pipe.enable_free_noise(context_length=16, context_stride=8, weighting_scheme="pyramid", noise_type="shuffle_context")
            pipe.enable_free_noise_split_inference(spatial_split_size=256, temporal_split_size=16)
            # FreeNoise creates new blocks using pipeline dtype, which may derive
            # from the original FP32 adapter rather than the loaded FP16 UNet.
            pipe.unet.to(dtype=torch.float16)
        elif model_id == "model-cogvideox":
            pipe = CogVideoXPipeline.from_pretrained(str(settings.MODELS_DIR / "cogvideox-2b" / "pipeline"), torch_dtype=torch.float16, local_files_only=True, use_safetensors=True, low_cpu_mem_usage=True)
        else:
            raise ValueError("Mô hình chưa hỗ trợ tạo video.")

        # Apply memory settings without suppressing errors or silently disabling safeguards.
        pipe.vae.enable_slicing()
        pipe.vae.enable_tiling()
        vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
        if model_id == "model-cogvideox" and vram < 16:
            self._configure_cog_offload(pipe)
        elif vram < 16:
            pipe.enable_model_cpu_offload()
        else:
            pipe.to("cuda")
        if model_id == "model-animatediff":
            pipe.enable_vae_slicing()
            pipe.unet.enable_forward_chunking(chunk_size=1, dim=1)
        pipe.set_progress_bar_config(disable=True)
        return pipe

    @staticmethod
    def _configure_cog_offload(pipe: Any) -> None:
        import torch
        from accelerate import cpu_offload

        # Keep bounded groups on GPU instead of transferring every individual layer.
        # No prefetch streams: avoid duplicate pinned RAM on 32GB Windows hosts.
        pipe.transformer.enable_group_offload(
            onload_device=torch.device("cuda"), offload_device=torch.device("cpu"),
            offload_type="block_level", num_blocks_per_group=2, use_stream=False,
        )
        # These components run only once per job, so prioritize memory for them.
        cpu_offload(pipe.text_encoder, execution_device=torch.device("cuda"))
        cpu_offload(pipe.vae, execution_device=torch.device("cuda"))

    @staticmethod
    def _cog_prompt(pipe: Any, params: GenerationParams) -> dict[str, Any]:
        import torch
        from accelerate.hooks import remove_hook_from_module

        with torch.inference_mode():
            positive, negative = pipe.encode_prompt(
                prompt=params.prompt, negative_prompt=params.negative_prompt or "",
                do_classifier_free_guidance=True, device=torch.device("cuda"),
            )
        # T5-XXL is no longer needed during the repeated video denoising steps.
        # Remove its offload hook too: it owns references to the CPU weights.
        remove_hook_from_module(pipe.text_encoder, recurse=True)
        pipe.text_encoder = None
        gc.collect()
        torch.cuda.empty_cache()
        return dict(prompt_embeds=positive, negative_prompt_embeds=negative)

    @staticmethod
    def export_frame(image: Any, width: int, height: int, preserve_frame: bool) -> Any:
        from PIL import Image, ImageOps
        resize = ImageOps.pad if preserve_frame else ImageOps.fit
        return resize(image.convert("RGB"), (width, height), method=Image.Resampling.LANCZOS)

    def _encode(self, frames: list[Any], destination: Path, width: int, height: int, seconds: int, preserve_frame: bool = False) -> None:
        import imageio_ffmpeg
        import numpy as np
        from PIL import Image

        destination.parent.mkdir(parents=True, exist_ok=True)
        # Constant output frame rate; resize/crop only during export to preserve GPU memory.
        writer = imageio_ffmpeg.write_frames(str(destination), (width, height), fps=24, codec="libx264", pix_fmt_in="rgb24", pix_fmt_out="yuv420p", macro_block_size=2, output_params=["-crf", "18", "-movflags", "+faststart"])
        writer.send(None)
        try:
            for index in range(seconds * 24):
                frame = frames[min(len(frames) - 1, index * len(frames) // (seconds * 24))]
                image = frame if isinstance(frame, Image.Image) else Image.fromarray((np.asarray(frame) * 255).clip(0, 255).astype("uint8"))
                image = self.export_frame(image, width, height, preserve_frame)
                writer.send(np.asarray(image).tobytes())
        finally:
            writer.close()

    def render(self, params: GenerationParams, job_id: str, progress: ProgressCallback) -> dict[str, Any]:
        import torch
        pipe = None
        destination = settings.OUTPUTS_DIR / f"{job_id}.mp4"
        temporary = destination.with_name(f"{job_id}.partial.mp4")
        seed = params.seed if params.seed is not None else secrets.randbelow(2**31)
        started = time.perf_counter()
        try:
            progress("generating", 2, "Đang nạp mô hình…")
            pipe = self._load_pipeline(params.model_or_provider_id)
            steps, frame_count = self.sampling_settings(params)
            def callback(_pipe: Any, step: int, _timestep: Any, kwargs: dict[str, Any]) -> dict[str, Any]:
                progress("decoding" if step + 1 == steps else "generating", 10 + int((step + 1) * 75 / steps), "Đang dựng khung hình…" if step + 1 == steps else f"Đang tạo video {step + 1}/{steps}")
                return kwargs

            generator = torch.Generator(device="cpu").manual_seed(seed)
            prompt_kwargs = dict(prompt=params.prompt, negative_prompt=params.negative_prompt or "")
            if params.model_or_provider_id == "model-animatediff":
                width, height = {"16:9": (512, 288), "9:16": (288, 512), "1:1": (512, 512)}[params.aspect_ratio]
                kwargs = dict(width=width, height=height, num_frames=frame_count, guidance_scale=1.0)
            else:
                kwargs = dict(width=720, height=480, num_frames=frame_count, guidance_scale=6.0)
                progress("generating", 5, "Đang xử lý mô tả…")
                prompt_kwargs = self._cog_prompt(pipe, params)
            with torch.inference_mode():
                frames = pipe(**prompt_kwargs, num_inference_steps=steps, generator=generator, callback_on_step_end=callback, **kwargs).frames[0]
            if not len(frames):
                raise RuntimeError("Không có khung hình đầu ra.")
            # Drop hooks and weights before the CPU postprocessing stage.
            del pipe
            pipe = None
            gc.collect()
            torch.cuda.empty_cache()
            width, height = self.output_dimensions(params.aspect_ratio, params.resolution)
            if params.model_or_provider_id == "model-animatediff":
                from backend.app.services.video_postprocess import interpolate_video
                progress("muxing", 90, "Đang làm mượt video…")
                interpolate_video(frames, temporary, width, height, params.duration_seconds)
            else:
                progress("muxing", 90, "Đang xuất video…")
                self._encode(frames, temporary, width, height, params.duration_seconds, preserve_frame=True)
            if not temporary.is_file() or temporary.stat().st_size < 1024:
                raise RuntimeError("Không thể xuất video.")
            temporary.replace(destination)
            logger.info("Generation %s model=%s quality=%s steps=%d elapsed=%.1fs", job_id, params.model_or_provider_id, params.quality, steps, time.perf_counter() - started)
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
