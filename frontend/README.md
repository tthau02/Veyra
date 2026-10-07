# Veyra Frontend (Desktop Studio UI)

React + TypeScript + Vite + Tailwind CSS frontend interface for the Local AI Video Studio desktop application.

## Structure

- **`src/layouts/`**: `MainLayout.tsx` (Sidebar + Header + Alert banner + Viewport)
- **`src/components/layout/`**: `Sidebar.tsx`, `Header.tsx`
- **`src/pages/`**:
  - `DashboardPage.tsx`: Welcome hero, 4 telemetry stat cards, recent projects.
  - `CreateVideoPage.tsx`: Video prompt canvas, aspect ratio selector, resolution, duration, seed controls, interactive preview pipeline.
  - `ProjectsPage.tsx`: Project cards, search filter, creation modal.
  - `ModelsPage.tsx`: Model management, mock download dispatcher.
  - `SettingsPage.tsx`: General, AI, GPU acceleration, storage directory tabs.
- **`src/services/api.ts`**: API client abstraction with timeout protection and safe offline fallback.
- **`src/types/index.ts`**: TypeScript definitions.

## Scripts

```bash
# Development dev server
npm run dev

# TypeScript checking & bundle build
npm run build
```
