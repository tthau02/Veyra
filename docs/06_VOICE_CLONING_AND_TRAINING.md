# 06 — Huấn Luyện & Nhân Bản Giọng Nói AI (Voice Cloning & Custom Voice Training)

Tài liệu này đặc tả kiến trúc kỹ thuật và quy trình để người dùng có thể **sao chép (clone) tức thì** hoặc **huấn luyện (train) mô hình AI giọng nói của bất kỳ ai** (từ một mẫu ghi âm của bạn bè, người nổi tiếng, hoặc chính người dùng) và áp dụng giọng nói đó vào lời thoại của nhân vật trong câu chuyện.

---

## 1. Các Cấp Độ Nhân Bản Giọng Nói (Cloning Tiers)

Hệ thống thiết kế theo 2 phương thức tiếp cận tùy theo độ dài mẫu âm thanh đầu vào và yêu cầu chất lượng:

```
┌────────────────────────────────────────────────────────┐
│               ĐẦU VÀO ÂM THANH MẪU                     │
│  (1 đoạn ghi âm hoặc video có chứa giọng người nói)    │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
┌───────────▼──────────────────┐ ┌──────────▼──────────────────────┐
│  Cấp độ 1: Zero-Shot Cloning │ │ Cấp độ 2: Few-Shot Training     │
│  (Sao chép giọng tức thì)    │ │ (Huấn luyện Model Chuyên Sâu)   │
├──────────────────────────────┤ ├─────────────────────────────────┤
│ • Thời lượng mẫu: 5 - 15 giây│ │ • Thời lượng mẫu: 1 - 5 phút    │
│ • Không cần thời gian train  │ │ • Thời gian train: 10 - 20 phút │
│ • Công nghệ: F5-TTS / XTTS   │ │ • Công nghệ: GPT-SoVITS / RVC   │
│ • Thích hợp: Thử nghiệm nhanh│ │ • Thích hợp: Nhân vật chính dài │
└───────────┬──────────────────┘ └──────────┬──────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      HỒ SƠ GIỌNG NÓI NHÂN VẬT (Custom Voice Profile)   │
│  - Gán vào nhân vật Minh / Lan / Thám tử               │
│  - Đọc mọi câu thoại trong kịch bản video              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Các Công Nghệ Mã Nguồn Mở Tối Ưu Nhất (Local AI)

Để chạy được trực tiếp trên máy tính cá nhân mà không tốn phí, Veyra ưu tiên tích hợp các kiến trúc hàng đầu thế giới:

### 1. GPT-SoVITS (Mạnh nhất cho Huấn luyện từ mẫu ngắn)
- **Điểm mạnh**: Chỉ cần **1 phút âm thanh sạch** là có thể huấn luyện ra một mô hình giọng nói có độ giống lên đến **95%**.
- Giữ được chính xác ngữ điệu, âm sắc (timbre) và cảm xúc của người nói gốc.
- Hỗ trợ tốt tiếng Việt, tiếng Anh, tiếng Trung, tiếng Nhật khi dùng pretrained multilingual base.

### 2. F5-TTS / E2-TTS (Non-Autoregressive Flow Matching)
- **Điểm mạnh**: Clone tức thì từ đoạn audio **5 – 10 giây** mà **không cần bước train**.
- Tốc độ sinh âm thanh siêu nhanh (Real-time Factor < 0.2), phát âm tự nhiên, xử lý tốt cả tiếng thở và nhịp ngắt câu.

### 3. RVC v2 (Retrieval-based Voice Conversion)
- **Điểm mạnh**: Chuyển đổi giọng (Voice Conversion).
- Quy trình: Một giọng đọc mẫu chuẩn (ví dụ giọng đọc AI Edge-TTS mượt mà) sẽ được chuyển đổi cao độ và âm sắc sang giọng của người được train.
- Rất ổn định, không lo AI đọc sai từ hay nuốt âm.

---

## 3. Quy Trình Tự Động Huấn Luyện Giọng Nói (Training Pipeline)

Người dùng chỉ cần kéo thả 1 file âm thanh (`.mp3` hoặc `.wav`) vào Veyra, toàn bộ 4 bước kỹ thuật sau sẽ diễn ra tự động trong backend:

```
[ File Audio Thô (mp3/wav) ]
            │
            ▼
[ Bước 1: Tách Lời & Khử Ồn ] ──> Sử dụng UVR5 / Demucs loại bỏ tạp âm và nhạc nền
            │
            ▼
[ Bước 2: Tự Động Cắt & Gán Nhãn ] ──> Cắt thành các đoạn 3 - 8s; OpenAI Whisper nhận diện chữ tự động
            │
            ▼
[ Bước 3: Fine-Tuning Siêu Tốc ] ──> Huấn luyện LoRA adapter cho GPT-SoVITS / RVC trên GPU
            │
            ▼
[ Bước 4: Xuất Model Trọng Số ] ──> Lưu file model (.pth/.ckpt) vào thư mục models/voices/
```

### Chi tiết kỹ thuật từng bước:
1. **Khử ồn & Tách Vocal**: Nếu người dùng đưa vào file âm thanh có lẫn tiếng xe cộ hay nhạc nền, hệ thống sử dụng thuật toán tách giọng (Demucs / Mel-Band Roformer) để thu được giọng nói khô và trong trẻo nhất.
2. **Cắt đoạn & Gắn nhãn tự động (Auto-Transcription)**: Sử dụng mô hình `faster-whisper` phiên bản cục bộ để phiên âm chính xác từng từ người đó nói trong file mẫu kèm timestamp.
3. **Fine-Tuning**: Tận dụng GPU NVIDIA của người dùng để chạy 15 – 30 epoch (mất khoảng 5 – 15 phút trên card RTX 3060/4060).
4. **Lưu trữ**: File mô hình được gán một `voice_id` độc nhất (ví dụ: `custom-voice-son-tung`, `custom-voice-me`) và lưu trong thư mục `models/voices/`.

---

## 4. Tích Hợp Vào Kịch Bản Studio Của Veyra

Sau khi đã tạo xong giọng nói mẫu:

1. **Quản lý trong Studio (Voice Library)**:
   - Giao diện có mục **Voice Library** hiển thị danh sách các giọng có sẵn + các giọng do người dùng tự train.
   - Có nút **"Nghe thử"** (Sample Preview) với một câu chào ngắn.

2. **Gán giọng vào nhân vật câu chuyện**:
   - Trong trang **Storyboard / Phân Cảnh**:
     ```typescript
     // Ví dụ phân cảnh kịch bản gán giọng nhân vật đã train
     {
       "scene_index": 1,
       "character": "Nhân vật Nam chính",
       "voice_profile_id": "custom-voice-duc-anh-v1",  // Giọng đã train
       "narration_text": "Tôi không ngờ mọi chuyện lại đi xa đến mức này..."
     }
     ```
   - Khi bấm **Generate Voiceover**, backend sẽ nạp model giọng đó và sinh ra âm thanh thuyết minh khớp hoàn hảo với nhân vật.

---

## 5. Lựa Chọn Cloud Voice Cloning (Nếu Người Dùng Dùng Máy Yếu)

Nếu máy tính người dùng không có GPU mạnh để tự train model:
- Hệ thống hỗ trợ gọi **ElevenLabs VoiceLab API**:
  - Tải file ghi âm 1 phút lên qua API.
  - ElevenLabs xử lý trên cloud và trả về một `cloned_voice_id` trong vòng 10 giây.
  - Người dùng có thể dùng ngay giọng đó để đọc tiếng Việt và các ngôn ngữ khác mà không tiêu tốn tài nguyên máy tính.

---

## 6. Tiêu Chuẩn Đạo Đức & Cảnh Báo Bản Quyền (Ethical AI Usage)

Hệ thống hiển thị điều khoản cảnh báo rõ ràng khi người dùng sử dụng tính năng Voice Training:
- Chỉ sử dụng giọng nói của bản thân hoặc người đã đồng ý ủy quyền.
- Nghiêm cấm sử dụng tính năng nhân bản giọng nói cho các mục đích lừa đảo, mạo danh Deepfake vi phạm pháp luật.
- Tùy chọn gắn Watermark tần số âm thanh kín (Audio Watermarking) để nhận diện âm thanh được tạo ra bởi AI.
