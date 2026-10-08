# Veyra — Tài Liệu Kế Hoạch & Kiến Trúc Tính Năng Mở Rộng

Tài liệu này hệ thống hóa toàn bộ kiến trúc và kế hoạch triển khai nâng cấp **Veyra** từ công cụ tạo video ngắn đơn lẻ thành **Xưởng sản xuất video tự động hoàn chỉnh (Autonomous Long-form AI Video Studio)**.

---

## 🎯 Mục Tiêu Cốt Lõi

1. **Chế độ Tạo Đa Nguồn (Hybrid AI Engine)**:
   - **Local AI**: Sử dụng phần cứng máy cá nhân (NVIDIA CUDA, PyTorch, Diffusers, AnimateDiff, CogVideoX, LTX-Video) — miễn phí, bảo mật offline.
   - **Cloud AI API**: Tích hợp các nhà cung cấp video AI hàng đầu thế giới (Kling AI, Runway Gen-3, Luma Dream Machine, Hailuo/MiniMax, Pika, OpenAI) thông qua API Key của người dùng.

2. **Sản Xuất Video Theo Chuỗi Cảnh (Batch Storyboard)**:
   - Nhập một câu chuyện / chủ đề -> Phân tách tự động thành danh sách hàng loạt cảnh quay (Scene 1 → Scene N).
   - Hàng đợi render song song hoặc tuần tự theo batch.

3. **Duy Trì Nhân Vật Nhất Quán (Character Consistency)**:
   - Thiết lập bảng hồ sơ nhân vật (Character Master Sheet).
   - Giữ nguyên khuôn mặt, trang phục, vóc dáng của nhân vật chính xuyên suốt hàng chục phân cảnh từ đầu đến cuối video bằng **IP-Adapter / InstantID / Image-to-Video Reference**.

4. **Lồng Tiếng Đa Ngôn Ngữ & Tiếng Việt (Multilingual TTS & Audio Ducking)**:
   - Giọng đọc AI tự nhiên theo từng phân cảnh, hỗ trợ tiếng Việt mượt mà (Microsoft Neural Voice vi-VN, Kokoro, XTTS, ElevenLabs) và hơn 50 ngôn ngữ quốc tế.
   - Tự động sinh phụ đề chuẩn từng giây (SRT/ASS).
   - Nhạc nền (BGM) tự động giảm âm lượng khi có lời thoại (Audio Ducking).

5. **Ghép Nối Video Hoàn Chỉnh (3 – 10 Phút)**:
   - Tự động ghép các clip (mỗi clip 4–8 giây) với hiệu ứng chuyển cảnh (crossfade/dissolve) thành 1 video liền mạch dài từ 3 đến 10 phút chuẩn H.264 MP4.

---

## 📂 Danh Mục Tài Liệu Chi Tiết

| Tài liệu | Nội dung chính |
| :--- | :--- |
| [01. Kiến Trúc Hybrid Engine](01_ARCHITECTURE_HYBRID_ENGINE.md) | Thiết kế hệ thống chuyển đổi linh hoạt giữa Local GPU và Cloud APIs, quản lý API Key, xử lý hạn ngạch & lỗi. |
| [02. Kịch Bản & Duy Trì Nhân Vật](02_STORY_AND_SCENE_PIPELINE.md) | Quy trình phân rã kịch bản thành phân cảnh, kiến trúc duy trì nhân vật nhất quán qua IP-Adapter và Reference Image. |
| [03. Lồng Tiếng Đa Ngôn Ngữ](03_MULTILINGUAL_VOICEOVER_AND_AUDIO.md) | Giải pháp Text-to-Speech (TTS) tiếng Việt và đa ngữ, tạo phụ đề tự động (Word Timestamps), xử lý âm thanh đa kênh. |
| [04. Dựng & Xuất Video Hoàn Chỉnh](04_VIDEO_COMPILATION_AND_TIMELINE.md) | Pipeline FFmpeg tự động ghép clip 3–10 phút, kỹ thuật căn chỉnh nhịp độ video theo lời thoại, hiệu ứng chuyển cảnh. |
| [05. Lộ Trình Triển Khai (Phased Roadmap)](05_PHASED_IMPLEMENTATION_ROADMAP.md) | Kế hoạch chi tiết từng Phase (Phase 2A đến Phase 5), tiêu chí kiểm thử (Acceptance Criteria), rủi ro & giải pháp. |
| [06. Huấn Luyện & Nhân Bản Giọng Nói](06_VOICE_CLONING_AND_TRAINING.md) | Kiến trúc nhân bản giọng nói (Zero-Shot) và huấn luyện mô hình giọng nói AI theo yêu cầu (GPT-SoVITS, F5-TTS, RVC). |
