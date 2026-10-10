import React from "react";
import {
  // LayoutDashboard,
  Video,
  FolderKanban,
  Cpu,
  Settings,
  Film,
  Zap,
} from "lucide-react";
import { NavPage, SystemInfo } from "../../types";
import { StatusDot } from "../ui/StatusDot";

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  systemInfo: SystemInfo | null;
  backendOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  systemInfo,
  backendOnline,
}) => {
  const navItems: { id: NavPage; label: string; icon: React.ElementType }[] = [
    // { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard }, // Tạm thời ẩn
    { id: "create", label: "Tạo Video", icon: Video },
    { id: "projects", label: "Dự án", icon: FolderKanban },
    { id: "models", label: "Kho Mô hình", icon: Cpu },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <aside className="w-60 h-screen bg-[var(--bg-surface)] border-r border-[var(--border-app)] flex flex-col justify-between select-none shrink-0 transition-colors duration-200">
      <div>
        {/* Window Header / App Title */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-[var(--border-app)]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-wider text-[var(--text-primary)]">
              VEYRA
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-semibold uppercase">
              Studio
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors duration-150 ease-out ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-600 dark:text-white dark:bg-indigo-600/20 border-indigo-500/30 shadow-sm"
                    : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800/40 border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--text-muted)]"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Hardware Telemetry */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] space-y-2 text-xs">
        {/* Core Connection */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)]">
          <span className="text-[var(--text-secondary)] font-medium">Máy chủ AI</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <StatusDot
              status={backendOnline ? "online" : "offline"}
              pulse={backendOnline}
              size="sm"
            />
            <span className={backendOnline ? "text-emerald-500 dark:text-emerald-400 font-semibold" : "text-zinc-500"}>
              {backendOnline ? "Trực tuyến" : "Ngoại tuyến"}
            </span>
          </div>
        </div>

        {/* GPU & VRAM status */}
        <div className="px-2.5 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Xử lý GPU</span>
            </span>
            <span
              className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                systemInfo?.cuda_available
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {systemInfo?.cuda_available ? "CUDA" : "CPU"}
            </span>
          </div>
          <p
            className="text-xs text-[var(--text-primary)] truncate font-mono"
            title={systemInfo?.gpu.name}
          >
            {systemInfo?.gpu.name || (backendOnline ? "Không phát hiện" : "Đang kết nối...")}
          </p>
          {systemInfo?.gpu.vram_total_gb ? (
            <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono pt-1 border-t border-[var(--border-subtle)]">
              <span>VRAM</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {(() => {
                  const used =
                    systemInfo.gpu.vram_used_gb !== undefined && systemInfo.gpu.vram_used_gb !== null
                      ? systemInfo.gpu.vram_used_gb
                      : systemInfo.gpu.vram_free_gb !== undefined && systemInfo.gpu.vram_free_gb !== null
                      ? Math.max(0, Math.round((systemInfo.gpu.vram_total_gb - systemInfo.gpu.vram_free_gb) * 10) / 10)
                      : 0;
                  return `${used.toFixed(1)} / ${systemInfo.gpu.vram_total_gb.toFixed(1)} GB`;
                })()}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
};
