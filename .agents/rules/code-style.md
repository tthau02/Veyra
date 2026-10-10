# Code Style & Quality Standards

1. **TypeScript**:
   - Strict mode enabled.
   - Do not use `any` unless absolutely unavoidable; declare types in `src/types/index.ts`.
   - Use Lucide icons consistently.
2. **Python**:
   - Python 3.11+ syntax with explicit type hints (`str | None`, `list[str]`, etc.).
   - Pydantic v2 schemas for all API payloads.
   - Run tests with pytest before committing.
3. **UI Aesthetics & Consistency**:
   - Adhere to the creative studio dark theme palette.
   - Keep borders subtle (`border-white/5` to `border-white/10`).
   - Tuyệt đối không tự ý thêm các banner thông tin, alert box màu mè làm lệch layout gốc của hệ thống.
   - Tuyệt đối không đưa thuật ngữ nội bộ dev (Phase 2, Checkpoint, Mock...) lên giao diện người dùng.
4. **Studio Copywriting**:
   - Toàn bộ text, nhãn và nút bấm trên giao diện phải ngắn gọn, súc tích, đi thẳng vào chủ đề.
   - Không viết văn giải thích dài dòng hoặc gây khó hiểu.
