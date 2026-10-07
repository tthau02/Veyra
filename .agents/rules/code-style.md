# Code Style & Quality Standards

1. **TypeScript**:
   - Strict mode enabled.
   - Do not use `any` unless absolutely unavoidable; declare types in `src/types/index.ts`.
   - Use Lucide icons consistently.
2. **Python**:
   - Python 3.11+ syntax with explicit type hints (`str | None`, `list[str]`, etc.).
   - Pydantic v2 schemas for all API payloads.
   - Run tests with pytest before committing.
3. **UI Aesthetics**:
   - Adhere to the creative studio dark theme palette.
   - Keep borders subtle (`border-white/5` to `border-white/10`).
