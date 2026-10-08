import React from "react";
import {
  FolderKanban,
  Film,
  Cpu,
  Zap,
  Plus,
  ArrowRight,
} from "lucide-react";
import { NavPage, Project, SystemInfo, ModelItem } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { StatusDot } from "../components/ui/StatusDot";

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
  projects: Project[];
  models: ModelItem[];
  systemInfo: SystemInfo | null;
  backendOnline: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  projects,
  models,
  systemInfo,
  backendOnline,
}) => {
  const installedModelsCount = models.filter((m) => m.status === "Installed").length;
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects */}
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Tổng số Dự án
              </span>
              <FolderKanban className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {projects.length}
            </div>
          </CardContent>
        </Card>

        {/* Generated Videos */}
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Video đã tạo
              </span>
              <Film className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {projects.filter((p) => p.status === "completed").length}
            </div>
          </CardContent>
        </Card>

        {/* Models */}
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Mô hình đã cài
              </span>
              <Cpu className="w-4 h-4 text-pink-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {installedModelsCount}
              <span className="text-xs text-[var(--text-secondary)] font-normal ml-1.5">
                / {models.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* GPU Engine */}
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold uppercase tracking-wider">
                GPU Xử lý
              </span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <StatusDot
                status={systemInfo?.cuda_available ? "online" : "idle"}
                size="sm"
              />
              <span className="text-xs font-mono font-medium text-[var(--text-primary)] truncate">
                {systemInfo?.cuda_available
                  ? systemInfo.gpu.name.replace(/NVIDIA\s+/i, "")
                  : "Chế độ CPU"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Projects & System Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Projects (Col 8) */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Dự án gần đây
            </h2>
            {projects.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate("projects")}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Xem tất cả
              </Button>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-zinc-800">
              <Film className="w-8 h-8 text-zinc-600 mx-auto mb-2.5" />
              <p className="text-sm text-zinc-300 font-medium">Chưa có dự án nào</p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate("create")}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Tạo Video Mới
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentProjects.map((p) => (
                <Card
                  key={p.id}
                  interactive
                  onClick={() => onNavigate("projects")}
                  className="group flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <Badge
                        variant={
                          p.status === "completed"
                            ? "success"
                            : p.status === "ready"
                            ? "info"
                            : "default"
                        }
                        size="xs"
                        withDot
                      >
                        {p.status === "completed"
                          ? "Hoàn thành"
                          : p.status === "ready"
                          ? "Sẵn sàng"
                          : p.status === "generating"
                          ? "Đang tạo"
                          : "Bản nháp"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {p.prompt}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-muted)] font-mono">
                      <span>{p.aspect_ratio}</span>
                      <span>•</span>
                      <span>{p.resolution}</span>
                      <span>•</span>
                      <span>{p.duration_seconds}s</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* System & Engine Inspector (Col 4) */}
        <div className="lg:col-span-4 space-y-3.5">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Trạng thái Máy chủ
          </h2>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs text-[var(--text-primary)] font-semibold">
                Thông số Phần cứng
              </CardTitle>
              <StatusDot status={backendOnline ? "online" : "offline"} size="sm" />
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Tải CPU</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {systemInfo ? `${systemInfo.cpu_usage_percent}%` : "—"}
                  {systemInfo?.cpu_temperature_celsius ? ` (${systemInfo.cpu_temperature_celsius}°C)` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Sử dụng RAM</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {systemInfo
                    ? `${systemInfo.ram_usage_percent}% (${systemInfo.ram_available_gb}G trống)`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Thiết bị CUDA</span>
                <span className="text-[var(--text-primary)] truncate max-w-[160px] text-right font-medium">
                  {systemInfo?.cuda_available ? "Hỗ trợ" : "Không phát hiện"}
                </span>
              </div>
              {systemInfo?.gpu.vram_total_gb && (
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>VRAM Đang dùng</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {systemInfo.gpu.vram_used_gb !== undefined && systemInfo.gpu.vram_used_gb !== null
                      ? `${systemInfo.gpu.vram_used_gb.toFixed(1)} / ${systemInfo.gpu.vram_total_gb.toFixed(1)} GB`
                      : `${Math.max(0, Math.round((systemInfo.gpu.vram_total_gb - (systemInfo.gpu.vram_free_gb ?? 0)) * 10) / 10).toFixed(1)} / ${systemInfo.gpu.vram_total_gb.toFixed(1)} GB`}
                  </span>
                </div>
              )}
              {systemInfo?.gpu.temperature_celsius && (
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>Nhiệt độ GPU</span>
                  <span className="text-amber-500 dark:text-amber-400 font-medium">
                    {systemInfo.gpu.temperature_celsius}°C
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[var(--text-secondary)] pt-2.5 border-t border-[var(--border-subtle)]">
                <span>Hệ điều hành</span>
                <span className="text-[var(--text-primary)]">
                  {systemInfo ? `${systemInfo.os_name} ${systemInfo.os_architecture}` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate("create")}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full text-xs"
            >
              Tạo Video
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate("models")}
              leftIcon={<Cpu className="w-4 h-4 text-zinc-400" />}
              className="w-full text-xs"
            >
              Kho Mô hình
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
