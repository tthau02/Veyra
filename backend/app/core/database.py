import sqlite3
from contextlib import contextmanager
from typing import Generator
from backend.app.core.config import settings


class DatabaseManager:
    """
    Lightweight SQLite abstraction designed for Phase 1.
    Provides connection pooling / session factory pattern ready for Phase 2 expansion.
    """

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or str(settings.DATA_DIR / "veyra.db")

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def initialize_schema(self) -> None:
        """Create baseline database schema if tables do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    negative_prompt TEXT,
                    model_name TEXT NOT NULL,
                    aspect_ratio TEXT NOT NULL,
                    resolution TEXT NOT NULL,
                    duration_seconds INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    thumbnail_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )


db_manager = DatabaseManager()
