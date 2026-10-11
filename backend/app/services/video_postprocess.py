"""Bounded CPU motion interpolation at native resolution before MP4 upscale."""
import subprocess
import tempfile
from pathlib import Path
from typing import Any


def interpolate_video(frames: list[Any], destination: Path, width: int, height: int, seconds: int, source_fps: int = 8) -> None:
    import imageio_ffmpeg
    import numpy as np
    from PIL import Image

    if len(frames) < seconds * source_fps + 1:
        raise ValueError("Không đủ khung hình cho thời lượng yêu cầu.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    # PNGs preserve the source frames; interpolation runs before output resizing.
    with tempfile.TemporaryDirectory(prefix="interpolate-", dir=destination.parent) as folder:
        for index, frame in enumerate(frames):
            image = frame if isinstance(frame, Image.Image) else Image.fromarray((np.asarray(frame) * 255).clip(0, 255).astype("uint8"))
            image.convert("RGB").save(Path(folder) / f"{index:05d}.png")
        filters = (
            "tpad=stop_mode=clone:stop_duration=0.5,"
            "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
            f"scale={width}:{height}:flags=lanczos,setsar=1"
        )
        command = [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y",
                   "-filter_threads", "2", "-framerate", str(source_fps), "-i", str(Path(folder) / "%05d.png"),
                   "-vf", filters, "-frames:v", str(seconds * 24), "-an", "-c:v", "libx264",
                   "-threads", "2", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
                   "-movflags", "+faststart", str(destination)]
        try:
            result = subprocess.run(command, capture_output=True, timeout=300, check=False)
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("Làm mượt video quá thời gian. Hãy thử lại.") from exc
        if result.returncode:
            raise RuntimeError("Không thể nội suy video: " + result.stderr.decode("utf-8", errors="replace")[-500:])
