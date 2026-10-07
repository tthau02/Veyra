---
name: studio-ui-styling
description: >-
  Use this skill when designing, building, or modifying Veyra frontend components,
  Tailwind CSS tokens, creative dark studio layouts, video preview viewports, aspect ratio pickers,
  or micro-animations in React.
---

# Studio UI Styling Skill

This skill defines the visual identity, design tokens, and component architecture for Veyra's sleek dark creative studio desktop application.

---

## 1. Visual Aesthetics & Philosophy

- **Vibe**: Creative professional suite (DaVinci Resolve, ComfyUI, Runway Gen-3).
- **Dark Palette**: Deep neutral slate tones (`#09090b`, `#121215`, `#18181b`, `#27272a`).
- **Accent Glow**: Indigo (`#6366f1`) and electric purple (`#7c3aed`), with emerald (`#10b981`) for online/ready states and amber (`#f59e0b`) for active rendering/warnings.
- **Borders**: Subdued translucent strokes (`border-white/5` to `border-white/10`).

---

## 2. Key Components Checklist

1. **Aspect Ratio Matrix**:
   - 16:9 Landscape (Desktop / YouTube / Cinema)
   - 9:16 Portrait (Reels / TikTok / Shorts)
   - 1:1 Square (Feed / Social)
2. **Preview Viewport**:
   - Automatically matches the selected aspect ratio with smooth transitions.
   - Shows state badges: `queued`, `generating`, `completed`, `failed`.
   - Real-time progress bar (0 - 100%) with animated sampling glow.
3. **Hardware Telemetry Bar**:
   - Bottom sidebar widget reflecting real-time GPU/CUDA status and FastAPI server health.

---

## 3. References

- [Design Tokens & Utilities Reference](./references/design-tokens.md)
