# 01 — Kiến Trúc Động Cơ Kết Hợp (Hybrid AI Video Engine)

Tài liệu này xác định kiến trúc kỹ thuật để Veyra hỗ trợ song song hai phương thức sinh video: **Mô hình Cục bộ (Local AI)** và **Dịch vụ Đám mây (Cloud AI APIs)**.

---

## 1. Thiết Kế Mẫu Kiến Trúc (Strategy & Adapter Pattern)

Hệ thống sử dụng mẫu thiết kế **Unified Engine Interface** (Giao diện động cơ đồng nhất). Cả động cơ Local và Cloud đều cài đặt chung một giao diện trừu tượng, giúp giao diện người dùng (Frontend) và bộ điều phối tác vụ (Job Dispatcher) hoàn toàn không bị phụ thuộc vào nơi xử lý.

```
                         ┌───────────────────────────────┐
                         │      Generation Request       │
                         │ (Prompt, Reference, Duration) │
                         └───────────────┬───────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │    Engine Dispatcher Hub      │
                         │    (Engine Type: Local/Cloud) │
                         └───────┬───────────────┬───────┘
                                 │               │
        ┌────────────────────────▼─┐   ┌─────────▼────────────────────────┐
        │   Local Diffusers Engine │   │      Cloud Provider Engine       │
        ├──────────────────────────┤   ├──────────────────────────────────┤
        │ • AnimateDiff Lightning  │   │ • Kling AI (Kuaishou)            │
        │ • CogVideoX-2B / 5B      │   │ • Runway Gen-3 Alpha             │
        │ • LTX-Video              │   │ • Luma Dream Machine             │
        │ • VRAM Offload & Slicing │   │ • Hailuo / MiniMax               │
        │ • Local CUDA Hardware    │   │ • Pika Labs / OpenAI Sora        │
        └──────────────┬───────────┘   └─────────┬────────────────────────┘
                       │                         │
                       └───────────────┬─────────┘
                                       │
                         ┌─────────────▼─────────────┐
                         │   Standard Output Video   │
                         │ (1080p/720p H.264 MP4)    │
                         └───────────────────────────┘
```

---

## 2. Đặc Tả Giao Diện Lập Trình (Abstract Base Engine)

Trong backend Python (`backend/app/services/engines/base.py`):

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Optional, AsyncGenerator

class GenerationParams(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    reference_image_path: Optional[str] = None   # Dùng để giữ nhân vật nhất quán
    aspect_ratio: str = "16:9"                  # 16:9 | 9:16 | 1:1
    duration_seconds: int = 5
    seed: Optional[int] = -1
    quality_preset: str = "standard"            # standard | high | cinematic

class VideoGenerationResult(BaseModel):
    video_path: str
    duration_seconds: float
    seed_used: int
    provider_name: str
    generation_time_seconds: float

class BaseVideoEngine(ABC):
    @abstractmethod
    async def generate(self, params: GenerationParams) -> VideoGenerationResult:
        """Sinh video hoàn chỉnh từ tham số đầu vào."""
        pass

    @abstractmethod
    async def stream_progress(self, job_id: str) -> AsyncGenerator[dict, None]:
        """Bắn sự kiện SSE cập nhật % tiến độ cho Frontend."""
        pass

    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Kiểm tra tính hợp lệ của phần cứng hoặc API Key."""
        pass
```

---

## 3. Thành Phần 1: Động Cơ Cục Bộ (Local AI Engine)

### Nguyên lý hoạt động
- Khởi chạy trực tiếp thông qua thư viện PyTorch và Hugging Face Diffusers trên GPU người dùng.
- Tự động kiểm tra VRAM khả dụng bằng `SystemService` trước khi nạp model.
- Áp dụng các chiến lược tối ưu VRAM nhằm chống tràn bộ nhớ (Out-Of-Memory - OOM):
  - `pipe.enable_model_cpu_offload()`: Chuyển các tầng mạng chưa dùng về RAM hệ thống.
  - `pipe.vae.enable_slicing()` & `pipe.vae.enable_tiling()`: Giải mã latent theo từng mảng nhỏ.
  - Sử dụng định dạng `torch.bfloat16` hoặc `torch.float16`.

### Các mô hình hỗ trợ
1. **AnimateDiff Lightning**: Tạo chuyển động nhanh, phù hợp GPU từ 6GB – 8GB VRAM.
2. **CogVideoX-2B**: Video Transformer độ nét cao, phù hợp GPU từ 8GB – 12GB VRAM.
3. **LTX-Video (2B)**: Suy luận cực nhanh, thời lượng linh hoạt.

---

## 4. Thành Phần 2: Động Cơ Đám Mây (Cloud AI APIs)

### Các nhà cung cấp (Providers) được tích hợp

| Nhà cung cấp | Điểm mạnh nổi bật | Hỗ trợ Image-to-Video (Nhân vật) | Định dạng API |
| :--- | :--- | :--- | :--- |
| **Kling AI (Kuaishou)** | Giữ chi tiết khuôn mặt xuất sắc, chuyển động chân thực, chi phí tối ưu | Rất mạnh (hỗ trợ Start/End frame) | REST Async Webhook/Polling |
| **Runway (Gen-3 Alpha)** | Hiệu ứng điện ảnh, kiểm soát Camera motion và Motion Brush | Rất mạnh | REST Tasks API |
| **Luma Dream Machine** | Tốc độ sinh nhanh, tính vật lý của camera mượt mà | Hỗ trợ Image Keyframes | REST Generations API |
| **Hailuo (MiniMax Video-01)** | Tự nhiên cao trong cử động con người và biểu cảm | Rất mạnh | REST Async API |
| **OpenAI / Pika** | Dễ tích hợp, đa dạng phong cách | Hỗ trợ Image-to-Video | REST API |

### Quy trình gọi Cloud API bất đồng bộ (Polling Loop)
1. Gửi request sinh video kèm prompt và ảnh tham chiếu (Base64 hoặc URL tạm).
2. Nhận `task_id` từ nhà cung cấp.
3. Backend Veyra định kỳ (mỗi 3 giây) thăm dò trạng thái task (`queued` -> `processing` -> `succeeded`).
4. Tải file MP4 từ CDN của nhà cung cấp về lưu cục bộ tại thư mục `outputs/scenes/` của máy người dùng để phục vụ quá trình ghép nối tiếp theo.

---

## 5. Quản Lý Bảo Mật API Key & Cấu Hình Nhà Cung Cấp

- **Lưu trữ an toàn**: API Key được lưu trực tiếp trong cơ sở dữ liệu SQLite cục bộ `data/veyra.db` (bảng `provider_settings`), tuyệt đối không gửi lên bất kỳ server trung gian nào khác.
- **Tính năng kiểm tra kết nối (Test Connection)**: Người dùng nhập API Key vào trang Cài đặt -> Nhấn "Test Key" -> Backend gửi một request định danh nhẹ (hoặc kiểm tra số dư credits) để báo trạng thái Xanh (Hợp lệ) hoặc Đỏ (Lỗi).
- **Cơ chế Chuyển đổi Dự phòng (Failover Fallback)**: Nếu Cloud API hết credit hoặc gặp lỗi mạng, người dùng có thể bật chế độ *Auto-fallback* để tự động chuyển sang sinh bằng Local Engine (hoặc provider Cloud phụ).
