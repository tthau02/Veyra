import uuid
from datetime import datetime, timezone
from typing import Optional
from backend.app.schemas.project import ProjectCreate, ProjectResponse, ProjectListResponse


class ProjectService:
    """Manages project persistence and retrieval with an in-memory/DB abstraction."""

    def __init__(self) -> None:
        # In-memory store pre-seeded with clean sample projects for Phase 1 UI demo
        self._projects: dict[str, ProjectResponse] = {
            "proj-demo-1": ProjectResponse(
                id="proj-demo-1",
                name="Cyberpunk Neo-Tokyo Rain",
                prompt="Futuristic city with neon rain reflections, cinematic 8k photorealistic video, glowing billboards",
                negative_prompt="blurry, low quality, jitter, artifact",
                model_name="Veyra-Diffusion-v1",
                aspect_ratio="16:9",
                resolution="1080p",
                duration_seconds=5,
                seed=42891,
                status="completed",
                thumbnail_url=None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            ),
            "proj-demo-2": ProjectResponse(
                id="proj-demo-2",
                name="Deep Ocean Bioluminescence",
                prompt="Ethereal glowing jellyfish drifting through dark abyss, bioluminescent particles, smooth camera pan",
                negative_prompt="cartoon, oversaturated, jerky motion",
                model_name="Veyra-Diffusion-v1",
                aspect_ratio="9:16",
                resolution="720p",
                duration_seconds=10,
                seed=91823,
                status="ready",
                thumbnail_url=None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            ),
        }

    def list_projects(self) -> ProjectListResponse:
        items = list(self._projects.values())
        return ProjectListResponse(total=len(items), items=items)

    def get_project(self, project_id: str) -> Optional[ProjectResponse]:
        return self._projects.get(project_id)

    def create_project(self, req: ProjectCreate) -> ProjectResponse:
        project_id = f"proj-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        project = ProjectResponse(
            id=project_id,
            name=req.name,
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            model_name=req.model_name,
            aspect_ratio=req.aspect_ratio,
            resolution=req.resolution,
            duration_seconds=req.duration_seconds,
            seed=req.seed,
            status="draft",
            thumbnail_url=None,
            created_at=now,
            updated_at=now,
        )
        self._projects[project_id] = project
        return project

    def delete_project(self, project_id: str) -> bool:
        if project_id in self._projects:
            del self._projects[project_id]
            return True
        return False


project_service = ProjectService()
