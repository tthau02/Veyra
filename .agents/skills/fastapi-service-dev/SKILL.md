---
name: fastapi-service-dev
description: >-
  Use this skill when creating or modifying backend FastAPI endpoints, Pydantic validation schemas,
  SQLite database operations, background async workers, or writing backend unit tests in Veyra.
---

# FastAPI Service Development Skill

This skill guides backend engineers and agents in extending Veyra's application service layer.

---

## 1. Directory Structure Conventions

Always maintain the decoupled backend architecture:

```
backend/app/
├── api/v1/         # Controllers: route definitions, HTTP status codes, dependencies
├── core/           # Configuration, settings, database connection factories
├── models/         # Domain entities (internal representations)
├── schemas/        # Pydantic v2 data transfer objects (request/response)
└── services/       # Business logic, hardware detection, job orchestrator
```

---

## 2. Adding a New Endpoint Checklist

1. **Define Schema**: Create Request and Response Pydantic models in `backend/app/schemas/`.
2. **Implement Service**: Add business logic in `backend/app/services/`.
3. **Register Route**: Add FastAPI route in `backend/app/api/v1/` and mount in `backend/app/api/router.py`.
4. **Write Tests**: Add test case in `backend/tests/test_api.py`.
5. **Verify**: Run `.\.venv\Scripts\pytest.exe -v backend/tests`.

---

## 3. Crash-Proof Rule

Never let host platform variations crash the API process:
- Hardware queries (`psutil`, `nvidia-smi`, `torch.cuda`) must have safe fallback values.
- File operations must catch `FileNotFoundError` and `PermissionError`.
- Missing database tables should automatically initialize on application lifespan startup.

---

## 4. References

- [Database & Storage Patterns](./references/database-patterns.md)
