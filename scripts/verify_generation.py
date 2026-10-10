"""Run a real local generation through the same dispatcher as the studio."""
import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
os.environ["HF_HUB_OFFLINE"] = "1"

from backend.app.core.config import settings
from backend.app.core.database import db_manager
from backend.app.services.engines.base import GenerationParams
from backend.app.services.engines.hub import EngineHub


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="model-animatediff")
    parser.add_argument("--prompt", default="A cinematic shot of a neon city at night, reflections on wet streets, smooth camera motion")
    parser.add_argument("--resolution", default="720p", choices=["512p", "720p", "1080p"])
    args = parser.parse_args()
    settings.init_directories()
    db_manager.initialize_schema()
    hub = EngineHub()
    try:
        job = hub.start_job(GenerationParams(prompt=args.prompt, model_or_provider_id=args.model, resolution=args.resolution, seed=42))
        previous = None
        while True:
            status = hub.get_job_status(job.job_id)
            value = (status.status, status.progress, status.current_step)
            if value != previous:
                print(status.model_dump_json(), flush=True)
                previous = value
            if status.status == "failed":
                raise RuntimeError(status.error_message)
            if status.status == "completed":
                print(str(settings.OUTPUTS_DIR / f"{job.job_id}.mp4"), flush=True)
                break
            time.sleep(1)
    finally:
        hub.shutdown()


if __name__ == "__main__":
    main()
