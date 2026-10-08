# 05 — Lộ Trình Triển Khai Chi Tiết (Phased Implementation Roadmap)

Tài liệu này vạch ra kế hoạch hành động từng bước (từ Phase 2A đến Phase 5) để hiện thực hóa toàn bộ các tính năng đã đề ra, đảm bảo tính ổn định, dễ bảo trì và trải nghiệm người dùng cao cấp.

---

## 🗺️ Bản Đồ Tổng Thể Các Giai Đoạn

```
┌────────────────────────────────────────────────────────┐
│  Phase 1: Nền Tảng Desktop & Kiến Trúc Core  [HOÀN THÀNH ✅]
│  - Tauri v2 + React 18 UI + FastAPI + Telemetry Hardware│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 2A: Tích Hợp Động Cơ Đám Mây (Cloud AI APIs)    │
│  - Quản lý API Key, kết nối Kling AI, Runway, Luma     │
│  - Hỗ trợ người dùng tạo video ngay cả khi máy yếu     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 2B: Lõi AI Cục Bộ (Local PyTorch & Diffusers)   │
│  - AnimateDiff Lightning, CogVideoX-2B, LTX-Video      │
│  - Tối ưu VRAM CPU Offload & VAE Slicing               │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 3: Giữ Nhân Vật Nhất Quán & Phân Cảnh Kịch Bản  │
│  - Character Master Sheet & IP-Adapter / Keyframe I2V  │
│  - Trình phân rã kịch bản thành N cảnh & Scene Retake  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 4: Giọng Đọc Đa Ngữ (Tiếng Việt) & Âm Thanh     │
│  - Microsoft Edge-TTS (Hoài My, Nam Minh), ElevenLabs  │
│  - Phụ đề tự động (Word Timestamps) & Audio Ducking    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 5: Dựng & Xuất Video Hoàn Chỉnh (3 – 10 Phút)   │
│  - Bộ ghép FFmpeg Timeline XFade transitions           │
│  - Xuất bản video Master Full HD 1080p chuẩn phát hành │
└────────────────────────────────────────────────────────┘
```

---

## 📌 Chi Tiết Từng Giai Đoạn & Hạng Mục Triển Khai

### 🚀 Giai Đoạn 2A: Tích Hợp Cloud AI APIs (Khuyên làm trước)
> **Mục tiêu**: Cho phép người dùng tạo được video chất lượng cao ngay lập tức mà không bắt buộc phải có máy tính cấu hình khủng.

- [ ] **Task 2A.1 (Backend)**: Thiết kế bảng cơ sở dữ liệu `cloud_providers` trong SQLite lưu trữ API Key của Kling AI, Runway Gen-3, Luma Dream Machine, Hailuo MiniMax.
- [ ] **Task 2A.2 (Backend)**: Xây dựng các Provider Adapters xử lý luồng tạo Task và Polling trạng thái kèm cơ chế thử lại (Retry & Exponential Backoff).
- [ ] **Task 2A.3 (Frontend)**: Cập nhật giao diện **Settings**:
  - Tab "Cloud Providers": Form nhập API Key của từng hãng kèm nút "Test Connection".
  - Hiển thị badge trạng thái Xanh/Đỏ trực quan.
- [ ] **Task 2A.4 (Frontend)**: Cập nhật trang **Create Video**: Cho phép chuyển đổi chế độ sinh giữa *Local GPU* hoặc *Cloud Provider*.

---

### 🧠 Giai Đoạn 2B: Lõi Tính Toán AI Cục Bộ (Local PyTorch Core)
> **Mục tiêu**: Người dùng có GPU NVIDIA mạnh có thể sinh video hoàn toàn miễn phí và bảo mật trên máy tính.

- [ ] **Task 2B.1 (Môi trường)**: Nâng cấp `.venv` với `torch` CUDA 12.x wheels, `diffusers>=0.30.0`, `transformers>=4.44.0`, `accelerate`.
- [ ] **Task 2B.2 (Backend)**: Hoàn thiện `LocalDiffusersEngine` cho AnimateDiff Lightning và CogVideoX-2B.
- [ ] **Task 2B.3 (Tối ưu)**: Tích hợp cơ chế dọn dẹp bộ nhớ:
  - `pipe.enable_model_cpu_offload()`
  - `pipe.vae.enable_slicing()`
  - Xóa cache CUDA sau mỗi lần render: `torch.cuda.empty_cache()`

---

### 🎭 Giai Đoạn 3: Kịch Bản Chuỗi Cảnh & Giữ Nhân Vật Nhất Quán
> **Mục tiêu**: Biến các đoạn clip ngắn rời rạc thành một bộ phim kể chuyện có nhân vật chính cố định.

- [ ] **Task 3.1 (Hồ sơ nhân vật)**: Thêm trang quản lý **Characters**:
  - Tạo hồ sơ nhân vật (Tên, độ tuổi, phong cách, câu lệnh Prompt nhận dạng DNA).
  - Tải lên ảnh chân dung mẫu của nhân vật (Front, Profile, 3/4).
- [ ] **Task 3.2 (Storyboard Studio)**: Xây dựng giao diện Storyboard:
  - Nhập kịch bản -> Tự động chia thành danh sách 15 – 40 cảnh quay.
  - Hiển thị danh sách các card phân cảnh dạng Kanban / Grid.
  - Cho phép người dùng chỉnh sửa prompt hoặc câu thoại của từng cảnh riêng biệt.
- [ ] **Task 3.3 (Consistency Engine)**:
  - Với Local: Nạp trọng số `IP-Adapter-Plus` để nhúng ảnh nhân vật vào pipeline sinh video.
  - Với Cloud: Truyền ảnh nhân vật vào chế độ Image-to-Video của Kling/Runway.
- [ ] **Task 3.4 (Scene Retake)**: Thêm nút "Render lại cảnh này" nếu cảnh đó bị lỗi mà không cần chạy lại toàn bộ câu chuyện.

---

### 🎙️ Giai Đoạn 4: Giọng Đọc Đa Ngữ (Tiếng Việt) & Âm Thanh
> **Mục tiêu**: Tự động thổi hồn cho câu chuyện bằng giọng đọc truyền cảm và âm nhạc hài hòa.

- [ ] **Task 4.1 (Edge-TTS)**: Tích hợp thư viện `edge-tts` vào backend:
  - Hỗ trợ giọng đọc tiếng Việt mượt mà: `vi-VN-HoaiMyNeural` (Nữ) và `vi-VN-NamMinhNeural` (Nam).
  - Hỗ trợ hơn 50 ngôn ngữ quốc tế (Anh, Nhật, Hàn, Trung...).
- [ ] **Task 4.2 (Cloud TTS)**: Tích hợp ElevenLabs API cho các kịch bản cần lồng tiếng cảm xúc cao cấp hoặc nhân bản giọng nói (Voice Cloning).
- [ ] **Task 4.3 (Phụ đề tự động)**: Xuất file phụ đề `.srt` bám sát từng từ đọc (Word-level timestamps).
- [ ] **Task 4.4 (Audio Ducking)**: Xây dựng bộ lọc FFmpeg tự động giảm âm lượng nhạc nền BGM khi có câu thoại và tăng lại khi dứt câu.

---

### 🎬 Giai Đoạn 5: Dựng & Xuất Video Hoàn Chỉnh (3 – 10 Phút)
> **Mục tiêu**: Hoàn tất thành phẩm video sẵn sàng đăng tải lên YouTube, TikTok, Facebook.

- [ ] **Task 5.1 (Timeline Stitcher)**: Dùng FFmpeg ghép nối danh sách tất cả các cảnh quay theo đúng thứ tự thời gian.
- [ ] **Task 5.2 (Chuyển cảnh)**: Áp dụng bộ lọc `xfade` (Crossfade, Dissolve, Dip to Black) với thời lượng 0.5s giữa các phân cảnh để video mượt mà như phim điện ảnh.
- [ ] **Task 5.3 (Muxing)**: Ghép đường hình (Video track), đường tiếng thuyết minh (Voiceover track), đường nhạc nền (BGM track) và phụ đề thành 1 file MP4 duy nhất.
- [ ] **Task 5.4 (Xuất bản)**: Tối ưu bộ mã hóa phần cứng GPU (`h264_nvenc`) cho tốc độ xuất video siêu tốc ở độ phân giải 1080p 60fps.

---

### 🎙️ Giai Đoạn 6: Huấn Luyện & Nhân Bản Giọng Nói AI (Advanced Voice Studio)
> **Mục tiêu**: Cho phép người dùng tự train mô hình AI giọng nói của bất kỳ ai từ file ghi âm và áp dụng đọc lời thoại câu chuyện.

- [ ] **Task 6.1 (Voice Cloning Pipeline)**: Tích hợp F5-TTS / XTTS cho phép sao chép giọng nói tức thì (Zero-Shot) từ đoạn audio mẫu 5–15 giây.
- [ ] **Task 6.2 (Custom Voice Trainer)**: Tích hợp GPT-SoVITS / RVC v2 tự động tách tạp âm, gắn nhãn bằng Whisper và train LoRA giọng nói trong 10–15 phút.
- [ ] **Task 6.3 (Voice Library UI)**: Xây dựng tab quản lý thư viện giọng nói đã huấn luyện, nghe thử (preview) và gán trực tiếp cho từng nhân vật trong kịch bản.
- [ ] **Task 6.4 (Cloud Voice Cloning)**: Tích hợp ElevenLabs VoiceLab API làm tùy chọn nhân bản giọng trên mây cho người dùng không có GPU mạnh.

---

## ⏱️ Ước Tính Thời Lượng & Độ Phức Tạp

| Giai đoạn | Tính năng chính | Thời gian dự kiến | Mức độ phức tạp |
| :--- | :--- | :--- | :--- |
| **Phase 2A** | Cloud AI APIs (Kling, Runway, Luma) | 1 – 2 tuần | Trung bình |
| **Phase 2B** | Local PyTorch Core & VRAM Guard | 2 – 3 tuần | Khá cao |
| **Phase 3** | Phân cảnh Storyboard & Giữ Nhân Vật | 2 – 3 tuần | Rất cao |
| **Phase 4** | Giọng đọc tiếng Việt (TTS) & Ducking | 1 tuần | Dễ – Trung bình |
| **Phase 5** | Ghép Video Hoàn Chỉnh 3–10 phút | 1 – 2 tuần | Trung bình – Khá |
| **Phase 6** | Huấn luyện & Nhân bản Giọng nói AI | 2 – 3 tuần | Khá cao |
| **Tổng thể** | **Toàn bộ hệ thống Studio tự động** | **~9 – 12 tuần** | **Cấp độ Doanh nghiệp (Production-ready)** |
