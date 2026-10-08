# 02 — Kịch Bản Phân Cảnh & Giữ Nhân Vật Nhất Quán (Story & Character Consistency Pipeline)

Tài liệu này chi tiết hóa giải pháp giải quyết bài toán lớn nhất trong làm phim AI: **Phân rã kịch bản thành chuỗi phân cảnh hàng loạt** và **đảm bảo nhân vật chính không bị biến dạng, thay đổi khuôn mặt hay trang phục giữa các cảnh quay**.

---

## 1. Quy Trình Tổng Quan Từ Ý Tưởng Đến Chuỗi Cảnh (End-to-End Pipeline)

```
┌────────────────────────────────────────────────────────┐
│  1. Nhập Ý Tưởng / Kịch Bản Gốc (Script Input)         │
│  - Người dùng nhập kịch bản hoặc yêu cầu AI tạo        │
│  - Thiết lập thời lượng mục tiêu (3 – 10 phút)         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  2. Thiết Lập Nhân Vật Cốt Lõi (Character Persona)     │
│  - Tạo ảnh chân dung chuẩn (Master Character Sheet)    │
│  - Khóa đặc điểm: Khuôn mặt, kiểu tóc, trang phục       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  3. Bộ Phân Rã Kịch Bản (Script-to-Storyboard Engine)  │
│  - Chia kịch bản thành N phân cảnh (Scene 1 .. Scene N)│
│  - Mỗi cảnh gồm: Lời thoại (Voice) + Mô tả hình ảnh    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  4. Sinh Video Hàng Loạt (Batch Generation Engine)     │
│  - Bơm đặc trưng nhân vật (IP-Adapter / Keyframe)      │
│  - Xử lý hàng đợi: Local (tuần tự) / Cloud (song song) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Thiết Kế Dữ Liệu Phân Cảnh (Scene Schema)

Để tạo ra video 3 đến 10 phút:
- Một video 3 phút = ~180 giây = khoảng **25 đến 35 phân cảnh** (mỗi cảnh dài 5–7 giây).
- Một video 10 phút = ~600 giây = khoảng **80 đến 120 phân cảnh**.

Cấu trúc đối tượng một cảnh quay trong hệ thống:

```typescript
interface StoryboardScene {
  id: string;
  scene_index: number;
  
  // 1. Phần Lời Thoại / Âm Thanh
  narration_text: string;           // "Minh bước vào căn phòng hoang tàn, ánh trăng rọi qua khe cửa vỡ."
  voice_character_id: string;       // ID giọng đọc tương ứng
  estimated_speech_seconds: number; // Tính toán theo tốc độ đọc của TTS (~5.2s)
  
  // 2. Phần Hình Ảnh / Video
  visual_prompt: string;            // "Cinematic wide shot of [CHARACTER_TAG], walking into abandoned room, moonlight streaming through broken wooden window, dust particles, hyper-realistic, 8k"
  camera_motion: string;            // "pan_left" | "zoom_in" | "dolly_forward" | "static"
  duration_seconds: number;         // Tự động căn theo thời lượng lời thoại (làm tròn lên 5s/6s)
  
  // 3. Nhân Vật & Tham Chiếu
  character_id: string;             // ID của nhân vật xuất hiện trong cảnh
  start_frame_image_url?: string;   // Ảnh mẫu khởi tạo cảnh (nếu dùng Image-to-Video)
  
  // 4. Trạng Thái Render
  status: "pending" | "rendering" | "completed" | "failed";
  output_video_path?: string;
  output_audio_path?: string;
}
```

---

## 3. Giải Pháp Giữ Nhân Vật Nhất Quán (Character Consistency)

Trong AI sinh video truyền thống, mỗi lần bấm render là một khuôn mặt người khác nhau. Veyra áp dụng chiến lược kết hợp đa tầng để khóa nhân vật xuyên suốt câu chuyện:

### Tầng 1: Hồ Sơ Nhân Vật Chuẩn (Character Master Reference)
1. Người dùng tải lên 1 đến 3 ảnh chân dung rõ nét của nhân vật (hoặc dùng AI tạo ra 1 ảnh chân dung ưng ý đầu tiên).
2. Hệ thống trích xuất và cố định bộ từ khóa nhận dạng (**Character Prompt DNA**), ví dụ:  
   `"photo of Minh, a 28-year-old Vietnamese man with sharp jawline, short black messy hair, wearing a worn dark-olive tactical jacket and silver signet ring"`.
3. Từ khóa này được tự động ghim vào phần đầu của toàn bộ các prompt phân cảnh.

### Tầng 2: Áp dụng trên Động cơ Local (IP-Adapter & InstantID)
- **IP-Adapter-Plus**: Đưa tensor vector embedding khuôn mặt của nhân vật từ ảnh mẫu vào thẳng các lớp Cross-Attention của mô hình sinh video (AnimateDiff / SDXL).
- Kết quả: Dù nhân vật quay trái, quay phải, đứng dưới mưa hay chạy nhảy, khuôn mặt và trang phục vẫn giữ nguyên tỷ lệ nhận diện > 90%.

### Tầng 3: Áp dụng trên Động cơ Cloud (Image-to-Video & Keyframing)
- Các dịch vụ như **Kling AI**, **Runway Gen-3**, **Luma**:
  - Hỗ trợ chế độ **Image-to-Video (I2V)**: Hệ thống sinh trước 1 ảnh tĩnh của cảnh quay dựa trên nhân vật mẫu (ControlNet/Midjourney/SDXL), sau đó truyền ảnh này vào làm `input_image` của video.
  - Video được sinh ra sẽ chuyển động mượt mà bắt đầu từ chính xác khuôn mặt nhân vật mẫu.

---

## 4. Cơ Chế Quản Lý Hàng Đợi & Render Lại Độc Lập (Batch Queue & Retake)

1. **Thực thi hàng loạt (Batch Execution)**:
   - Nếu dùng **Cloud API**: Hệ thống có thể gửi cùng lúc 5 – 10 phân cảnh lên đám mây, giúp rút ngắn thời gian tạo video 3–5 phút xuống chỉ còn vài phút.
   - Nếu dùng **Local GPU**: Hệ thống tự động xếp hàng tuần tự (Queue FIFO) nhằm giải phóng VRAM giữa mỗi cảnh, chống sập ứng dụng.

2. **Tính Năng Đạo Diễn Sửa Cảnh (Scene Retake)**:
   - Người dùng có thể duyệt từng cảnh quay đã sinh.
   - Nếu cảnh số 12 bị lỗi chuyển động, người dùng chỉ cần nhấn **"Re-render Scene #12"** mà **không cần phải sinh lại 29 cảnh còn lại**.
   - Sau khi ưng ý cảnh sửa, bấm **"Re-mux Final Video"** để cập nhật ngay vào video hoàn chỉnh trong 5 giây.
