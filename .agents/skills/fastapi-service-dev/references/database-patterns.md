# Database & Storage Patterns Reference

Veyra uses SQLite for lightweight, zero-configuration local persistence.

---

## 1. Database Location

The database file resides in:
```
data/veyra.db
```
Configured via `settings.DATA_DIR / "veyra.db"`.

---

## 2. Session Pattern

Use the context manager in `backend/app/core/database.py`:

```python
from backend.app.core.database import db_manager

def insert_project(project_data: dict):
    with db_manager.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO projects (id, name, prompt, status)
            VALUES (?, ?, ?, ?);
            """,
            (project_data["id"], project_data["name"], project_data["prompt"], project_data["status"])
        )
```

Automatic transaction commit on normal exit; rollback on unhandled exception.
