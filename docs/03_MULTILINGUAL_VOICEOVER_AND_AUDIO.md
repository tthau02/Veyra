# 03 — Giọng Đọc Lồng Tiếng Đa Ngôn Ngữ & Âm Thanh (Multilingual Voiceover & Audio Pipeline)

Tài liệu này đặc tả hệ thống âm thanh, lồng tiếng Text-to-Speech (TTS) tự nhiên đa ngôn ngữ — bao gồm tiếng Việt — và cơ chế tạo phụ đề tự động cho video dài từ 3 đến 10 phút.

---

## 1. Kiến Trúc Bộ Sinh Giọng Đọc (Unified TTS Engine)

Tương tự như Video Engine, hệ thống TTS được thiết kế dưới dạng Plug-and-Play hỗ trợ cả **Local/Free** và **Cloud/Studio**:

```
                       ┌───────────────────────────────┐
                       │   Script Narration Lines      │
                       │ (Phân đoạn thoại theo cảnh)   │
                       └───────────────┬───────────────┘
                                       │
                       ┌───────────────▼───────────────┐
                       │     TTS Engine Dispatcher     │
                       └───────┬───────────────┬───────┘
                               │               │
       ┌───────────────────────▼──┐   ┌────────▼─────────────────────────┐
       │   Local / Miễn Phí       │   │    Cloud / Studio Chuyên Nghiệp  │
       ├──────────────────────────┤   ├──────────────────────────────────┤
       │ • Microsoft Edge-TTS     │   │ • ElevenLabs Multilingual v2     │
       │   (vi-VN-HoaiMy, NamMinh)│   │ • OpenAI TTS (tts-1-hd)          │
       │ • Kokoro-82M (On-device) │   │ • FPT.AI / Vbee Voice (Việt Nam) │
       │ • Coqui XTTS-v2          │   │                                  │
       └──────────────┬───────────┘   └────────┬─────────────────────────┘
                      │                        │
                      └────────────────┬───────┘
                                       │
                      ┌────────────────▼────────────────┐
                      │ • File Âm Thanh Chuẩn (.WAV)    │
                      │ • Thời lượng chính xác (.sec)   │
                      │ • File Phụ Đề Word-Level (.SRT) │
                      └─────────────────────────────────┘
```

---

## 2. Các Động Cơ Giọng Đọc Hỗ Trợ

### 1. Microsoft Edge Neural TTS (Khuyên Dùng — Miễn Phí 100%, Siêu Nhanh)
- Không yêu cầu API Key trả phí, không cần GPU mạnh.
- **Tiếng Việt tự nhiên vượt trội**:
  - `vi-VN-HoaiMyNeural`: Giọng nữ ấm, truyền cảm, phát âm tròn vành rõ chữ, phù hợp đọc truyện/tài liệu.
  - `vi-VN-NamMinhNeural`: Giọng nam trầm, phong cách điện ảnh, phát thanh viên.
- **Đa ngôn ngữ**: Hỗ trợ hơn 100 ngôn ngữ quốc tế (Anh, Nhật, Hàn, Trung, Pháp, Tây Ban Nha...).
- Cung cấp sẵn thông số chỉnh cao độ (pitch) và tốc độ đọc (rate).

### 2. ElevenLabs Multilingual (Cloud Studio)
- Giọng đọc giàu cảm xúc, có thể thở, nhấn nhá kịch tính theo ngữ cảnh câu chuyện.
- Hỗ trợ **Voice Cloning**: Người dùng tải lên mẫu giọng 10 giây để sao chép giọng của chính mình sang tiếng Việt hoặc bất kỳ ngôn ngữ nào.

### 3. FPT.AI / Vbee Speech (Việt Nam Chuyên Sâu)
- Đầy đủ các sắc thái giọng địa phương: Giọng Hà Nội (Bắc), Giọng Sài Gòn (Nam), Giọng Huế/Đà Nẵng (Trung).

---

## 3. Tạo Phụ Đề Tự Động & Đồng Bộ Thời Gian (Word-Level Subtitles)

1. **Trích xuất Timestamp**:
   - Khi sinh giọng đọc, hệ thống ghi nhận thời điểm bắt đầu và kết thúc của từng từ (Word Boundaries).
2. **Xuất file phụ đề chuẩn**:
   - Sinh file `.srt` và `.ass` đồng bộ chính xác với video.
3. **Hiển thị phụ đề trên video**:
   - Tùy chọn 1: Render trực tiếp phụ đề mềm (Soft Subtitle) vào file MP4 để người xem có thể bật/tắt.
   - Tùy chọn 2: Đốt cứng phụ đề phong cách hiện đại (Hardcode Styled Subtitle) với hiệu ứng karaoke nổi bật từng từ đang đọc (thịnh hành trên TikTok/Reels/Shorts).

---

## 4. Xử Lý Hòa Âm Đa Kênh & Tự Động Giảm Nhạc Nền (Auto Audio Ducking)

Một video chuyên nghiệp từ 3 đến 10 phút bắt buộc phải có nhạc nền (BGM) và hiệu ứng âm thanh (SFX), nhưng nhạc nền không được lấn át giọng đọc.

### Kỹ thuật Audio Ducking bằng FFmpeg
Khi phát hiện có giọng đọc của nhân vật, âm lượng nhạc nền sẽ tự động hạ xuống `-18dB`. Khi lời thoại kết thúc, nhạc nền sẽ từ từ vang lên trở lại:

```
Giọng đọc (Voice):   ───[ "Đêm hôm ấy, trời mưa như trút nước..." ]──────────
Nhạc nền (BGM):   ══════╗                                    ╔═════════════
                       ╚════════════ (Giảm -18dB) ═══════════╝
```

Bộ lọc FFmpeg tự động:
```bash
ffmpeg -i voice.wav -i bgm.mp3 -filter_complex \
"[1:a]asplit=2[sc][bgm];[sc]highpass=f=200,lowpass=f=3000[sidechain]; \
 [bgm][sidechain]sidechaincompress=threshold=0.1:ratio=5:attack=50:release=1000[ducked_bgm]; \
 [voice][ducked_bgm]amix=inputs=2:duration=longest" -c:a aac final_audio.aac
```
