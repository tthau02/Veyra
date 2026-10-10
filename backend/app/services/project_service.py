import uuid
from datetime import datetime, timezone
from typing import Optional
from backend.app.core.database import db_manager
from backend.app.schemas.project import ProjectCreate, ProjectResponse, ProjectListResponse


class ProjectService:
    """Manages project persistence and retrieval using SQLite database."""

    def __init__(self) -> None:
        self._ensure_seed_data()

    def _ensure_seed_data(self) -> None:
        """Seed default demo projects into SQLite if database table is empty."""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as cnt FROM projects")
                count = cursor.fetchone()["cnt"]
                if count == 0:
                    now = datetime.now(timezone.utc).isoformat()
                    seeds = [
                        (
                            "proj-demo-1",
                            "Thành phố mưa đêm Cyberpunk",
                            "Toàn cảnh thành phố tương lai dưới mưa ánh sáng neon phản chiếu, video điện ảnh 8k siêu thực",
                            "mờ, chất lượng kém, rung giật, lỗi hình ảnh",
                            "Veyra-Diffusion-v1",
                            "16:9",
                            "1080p",
                            5,
                            "completed",
                            None,
                            now,
                            now,
                        ),
                        (
                            "proj-demo-2",
                            "Sứa phát quang đại dương sâu",
                            "Đàn sứa biển phát sáng trôi dạt giữa vực thẳm tối tăm, các hạt phát quang sinh học, góc quay lia mượt mà",
                            "hoạt hình, màu quá chói, chuyển động giật cục",
                            "Veyra-Diffusion-v1",
                            "9:16",
                            "720p",
                            10,
                            "ready",
                            None,
                            now,
                            now,
                        ),
                    ]
                    cursor.executemany(
                        """
                        INSERT INTO projects (
                            id, name, prompt, negative_prompt, model_name,
                            aspect_ratio, resolution, duration_seconds,
                            status, thumbnail_url, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        seeds,
                    )
        except Exception:
            pass

    def list_projects(self) -> ProjectListResponse:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, name, prompt, negative_prompt, model_name,
                       aspect_ratio, resolution, duration_seconds,
                       status, thumbnail_url, created_at, updated_at
                FROM projects
                ORDER BY created_at DESC
                """
            )
            rows = cursor.fetchall()
            items: list[ProjectResponse] = []
            for r in rows:
                created_at = r["created_at"]
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at)
                    except ValueError:
                        created_at = datetime.now(timezone.utc)
                updated_at = r["updated_at"]
                if isinstance(updated_at, str):
                    try:
                        updated_at = datetime.fromisoformat(updated_at)
                    except ValueError:
                        updated_at = datetime.now(timezone.utc)

                items.append(
                    ProjectResponse(
                        id=r["id"],
                        name=r["name"],
                        prompt=r["prompt"],
                        negative_prompt=r["negative_prompt"] or "",
                        model_name=r["model_name"],
                        aspect_ratio=r["aspect_ratio"],
                        resolution=r["resolution"],
                        duration_seconds=r["duration_seconds"],
                        status=r["status"],
                        thumbnail_url=r["thumbnail_url"],
                        created_at=created_at,
                        updated_at=updated_at,
                    )
                )
            return ProjectListResponse(total=len(items), items=items)

    def get_project(self, project_id: str) -> Optional[ProjectResponse]:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, name, prompt, negative_prompt, model_name,
                       aspect_ratio, resolution, duration_seconds,
                       status, thumbnail_url, created_at, updated_at
                FROM projects WHERE id = ?
                """,
                (project_id,),
            )
            r = cursor.fetchone()
            if not r:
                return None
            created_at = r["created_at"]
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at)
                except ValueError:
                    created_at = datetime.now(timezone.utc)
            updated_at = r["updated_at"]
            if isinstance(updated_at, str):
                try:
                    updated_at = datetime.fromisoformat(updated_at)
                except ValueError:
                    updated_at = datetime.now(timezone.utc)

            return ProjectResponse(
                id=r["id"],
                name=r["name"],
                prompt=r["prompt"],
                negative_prompt=r["negative_prompt"] or "",
                model_name=r["model_name"],
                aspect_ratio=r["aspect_ratio"],
                resolution=r["resolution"],
                duration_seconds=r["duration_seconds"],
                status=r["status"],
                thumbnail_url=r["thumbnail_url"],
                created_at=created_at,
                updated_at=updated_at,
            )

    def create_project(self, req: ProjectCreate) -> ProjectResponse:
        project_id = f"proj-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        now_str = now.isoformat()
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO projects (
                    id, name, prompt, negative_prompt, model_name,
                    aspect_ratio, resolution, duration_seconds,
                    status, thumbnail_url, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    req.name,
                    req.prompt,
                    req.negative_prompt or "",
                    req.model_name,
                    req.aspect_ratio,
                    req.resolution,
                    req.duration_seconds,
                    "draft",
                    None,
                    now_str,
                    now_str,
                ),
            )
        return ProjectResponse(
            id=project_id,
            name=req.name,
            prompt=req.prompt,
            negative_prompt=req.negative_prompt or "",
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

    def delete_project(self, project_id: str) -> bool:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            return cursor.rowcount > 0


project_service = ProjectService()
