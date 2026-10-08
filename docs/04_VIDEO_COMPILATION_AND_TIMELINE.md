# 04 — Dựng & Ghép Nối Video Hoàn Chỉnh (Timeline Stitching & Video Compilation)

Tài liệu này đặc tả cơ chế tự động biên tập, ghép nối hàng chục phân cảnh riêng lẻ thành một tác phẩm video điện ảnh hoàn chỉnh có thời lượng từ **3 đến 10 phút**.

---

## 1. Thách Thức Khi Ghép Video Dài (3 – 10 Phút)

Các mô hình AI hiện nay (kể cả Sora, Kling, Runway, CogVideoX) chỉ sinh ra các đoạn clip ngắn từ **4 đến 8 giây**.  
Để tạo một video **5 phút**:
- Cần tối thiểu **35 – 50 phân đoạn clip ngắn**.
- Từng đoạn clip cần khớp thời gian với câu thoại của người thuyết minh.
- Chuyển cảnh giữa các clip cần mượt mà, không bị giật khung hình hoặc vấp tiếng.

---

## 2. Kỹ Thuật Đồng Bộ Độ Dài Giữa Video Và Lời Thoại (Pacing Engine)

Mỗi phân cảnh thường có thời lượng lời thoại khác nhau (ví dụ: câu ngắn đọc mất 3.8s, câu dài đọc mất 7.4s).

Hệ thống áp dụng 3 chiến lược cân bằng nhịp độ:

```
Trường hợp 1: Clip Video (5.0s) = Lời thoại (5.0s) ──> Khớp hoàn hảo 1:1
Trường hợp 2: Lời thoại (3.5s) < Clip Video (5.0s) ──> Giữ nguyên video, khoảng lặng âm thanh tự nhiên
Trường hợp 3: Lời thoại (6.5s) > Clip Video (5.0s) ──> Áp dụng Frame Interpolation (RIFE) làm chậm nhẹ 
                                                     hoặc chuyển động máy trôi tiếp diễn
```

---

## 3. Kiến Trúc Ghép Nối Bằng FFmpeg (Pipeline Muxing)

Quá trình dựng diễn ra tự động 100% trong tiến trình nền của Python backend thông qua **FFmpeg Engine**:

```
[Scene 01 Clip (H.264)] ──┐
[Scene 02 Clip (H.264)] ──┼──> [ FFmpeg XFade Filter ] ──> [ Video Track Liền Mạch ] ──┐
[Scene 03 Clip (H.264)] ──┘    (Chuyển cảnh Crossfade)                                  │
                                                                                         ├──> [ Final MP4 Video ]
[Scene 01 Voice (WAV)]  ──┐                                                             │    (3 - 10 Phút)
[Scene 02 Voice (WAV)]  ──┼──> [ Concatenate Audio ]    ──> [ Ducked Audio Track ] ─────┘
[Nhạc Nền BGM (MP3)]    ──┘    (Audio Ducking -18dB)
```

### Các hiệu ứng chuyển cảnh tự động (Transitions)
- **Crossfade (Hòa tan)**: Mờ dần cảnh trước và hiện dần cảnh sau (thời gian chuyển 0.5s – 1.0s). Phù hợp với video kể chuyện, tâm lý, tài liệu.
- **Fade to Black (Chớp đen)**: Chuyển đổi giữa 2 phân đoạn lớn hoặc chuyển đổi mốc thời gian trong cốt truyện.
- **Hard Cut (Cắt trực tiếp)**: Cho các phân cảnh hành động nhanh, nhịp điệu dồn dập.

---

## 4. Tối Ưu Hóa Tốc Độ Xuất Bản (GPU Hardware Acceleration)

Ghép một video dài 10 phút ở độ phân giải 1080p có thể tốn nhiều thời gian nếu chỉ dùng CPU. Backend Veyra kích hoạt bộ mã hóa phần cứng theo card đồ họa:

- **NVIDIA GPU**: Sử dụng encoder phần cứng `h264_nvenc` (tốc độ render nhanh gấp 5–10 lần so với CPU, hoàn thành video 10 phút trong dưới 60 giây).
- **Intel / AMD / Apple Silicon**: Tự động chuyển đổi sang `h264_qsv`, `h264_amf`, hoặc `libx264` an toàn.

Tham số xuất video tiêu chuẩn phát hành:
- **Container**: MP4
- **Video Codec**: H.264 / High Profile / Level 4.2
- **Audio Codec**: AAC Stereo 192kbps / 48kHz
- **Bitrate**: 12Mbps – 16Mbps (Full HD sắc nét cho YouTube / Facebook / TikTok)
- **Tỉ lệ khung hình (Aspect Ratio)**:
  - `16:9` (1920x1080): Phim truyện, phim tài liệu, video YouTube ngang.
  - `9:16` (1080x1920): TikTok, YouTube Shorts, Reels dọc.
