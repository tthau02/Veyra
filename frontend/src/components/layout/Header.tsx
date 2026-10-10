import React from "react";
import { Plus, RefreshCw, Cpu, HardDrive, Zap } from "lucide-react";
import { NavPage, SystemInfo } from "../../types";
import { Button } from "../ui/Button";

interface HeaderProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  systemInfo: SystemInfo | null;
  onRefreshSystem: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  systemInfo,
  onRefreshSystem,
  isRefreshing,
}) => {
  const titles: Record<NavPage, string> = {
    dashboard: "Tổng quan",
    create: "Tạo Video",
    projects: "Dự án Video",
    models: "Kho Mô hình AI",
    settings: "Cài đặt Studio",
  };

  return (
    <header className="h-14 px-6 bg-[var(--bg-surface)] border-b border-[var(--border-app)] flex items-center justify-between select-none shrink-0 z-10 transition-colors duration-200 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">
          {titles[currentPage]}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Hardware telemetry pills */}
        {systemInfo && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-input)] px-3 py-1.5 rounded-lg border border-[var(--border-app)] font-mono shadow-sm">
            {/* CPU */}
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[var(--text-secondary)]">CPU</span>
              <span className="text-[var(--text-primary)] font-semibold">{systemInfo.cpu_usage_percent}%</span>
              {systemInfo.cpu_temperature_celsius !== null && systemInfo.cpu_temperature_celsius !== undefined && (
                <span className="text-indigo-500 dark:text-indigo-300 text-[11px] font-medium">
                  {systemInfo.cpu_temperature_celsius}°C
                </span>
              )}
            </div>

            {/* GPU */}
            {(systemInfo.cuda_available || systemInfo.gpu?.name !== "Not Detected") && (
              <>
                <div className="w-[1px] h-3.5 bg-[var(--border-app)]" />
                <div
                  className="flex items-center gap-1.5"
                  title={`${systemInfo.gpu.name}${systemInfo.gpu.vram_used_gb !== undefined ? ` • VRAM: ${systemInfo.gpu.vram_used_gb} / ${systemInfo.gpu.vram_total_gb} GB` : systemInfo.gpu.vram_total_gb ? ` • VRAM: ${systemInfo.gpu.vram_total_gb} GB` : ""}${systemInfo.gpu.temperature_celsius ? ` • ${systemInfo.gpu.temperature_celsius}°C` : ""}`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[var(--text-secondary)]">GPU</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {systemInfo.gpu.gpu_usage_percent !== undefined && systemInfo.gpu.gpu_usage_percent !== null
                      ? `${systemInfo.gpu.gpu_usage_percent}%`
                      : "0%"}
                  </span>
                  {systemInfo.gpu.temperature_celsius !== null && systemInfo.gpu.temperature_celsius !== undefined && (
                    <span className="text-amber-500 dark:text-amber-400 text-[11px] font-medium">
                      {systemInfo.gpu.temperature_celsius}°C
                    </span>
                  )}
                </div>
              </>
            )}

            <div className="w-[1px] h-3.5 bg-[var(--border-app)]" />

            {/* RAM */}
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-[var(--text-secondary)]">RAM</span>
              <span className="text-[var(--text-primary)] font-semibold">{systemInfo.ram_usage_percent}%</span>
              <span className="text-[var(--text-muted)] text-[11px]">
                ({systemInfo.ram_available_gb}G trống)
              </span>
            </div>
          </div>
        )}


        {/* Refresh telemetry */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefreshSystem}
          disabled={isRefreshing}
          title="Làm mới thông số phần cứng"
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-500" : ""}`} />
        </Button>

        {/* Action Button */}
        {currentPage !== "create" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate("create")}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tạo Video
          </Button>
        )}
      </div>
    </header>
  );
};
