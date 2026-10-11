from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from backend.app.services.video_postprocess import interpolate_video


def test_interpolation_duration_and_new_motion_frames(tmp_path: Path) -> None:
    import imageio_ffmpeg
    # Moving square with source positions spaced eight pixels apart.
    frames = []
    for i in range(9):
        image = Image.new("RGB", (96, 64), "black")
        image.paste("white", (i * 8, 16, i * 8 + 16, 40))
        frames.append(image)
    output = tmp_path / "smooth.mp4"
    interpolate_video(frames, output, 96, 64, 1)
    reader = imageio_ffmpeg.read_frames(str(output), pix_fmt="rgb24")
    metadata = next(reader)
    decoded = [np.frombuffer(frame, dtype=np.uint8).reshape(64, 96, 3) for frame in reader]
    assert metadata["fps"] == 24
    assert metadata["duration"] == pytest.approx(1, abs=0.05)
    assert len(decoded) == 24
    centroids = []
    for frame in decoded[:21]:
        _, x = np.where(frame[:, :, 0] > 180)
        centroids.append(round(float(x.mean()), 1))
    assert len(set(centroids)) > len(frames)
    assert not list(tmp_path.glob("interpolate-*"))


def test_rejects_stretching_short_clip(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="Không đủ"):
        interpolate_video([Image.new("RGB", (64, 64))] * 16, tmp_path / "video.mp4", 64, 64, 5)
    assert not (tmp_path / "video.mp4").exists()


@pytest.mark.parametrize("seconds", [5, 10])
def test_requested_durations_have_exact_frame_counts(tmp_path: Path, seconds: int) -> None:
    import imageio_ffmpeg
    frames = [Image.new("RGB", (64, 64), (index * 3 % 255, 90, 120)) for index in range(seconds * 8 + 1)]
    output = tmp_path / f"{seconds}.mp4"
    interpolate_video(frames, output, 64, 64, seconds)
    reader = imageio_ffmpeg.read_frames(str(output))
    metadata = next(reader)
    assert metadata["duration"] == pytest.approx(seconds, abs=0.05)
    assert sum(1 for _ in reader) == seconds * 24
