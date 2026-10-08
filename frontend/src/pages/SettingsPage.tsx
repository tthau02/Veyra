import React, { useState } from "react";
import {
  Save,
  Check,
  RotateCcw,
  Sliders,
  Cpu,
  Zap,
  HardDrive,
  Sun,
  Moon,
} from "lucide-react";
import { AppSettings, SystemInfo } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  SegmentedControl,
  Switch,
} from "../components/ui";
import { useTheme } from "../context/ThemeContext";

interface SettingsPageProps {
  systemInfo: SystemInfo | null;
}

type SettingsTab = "general" | "ai" | "gpu" | "storage";

export const SettingsPage: React.FC<SettingsPageProps> = ({ systemInfo }) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const [settings, setSettings] = useState<AppSettings>({
    model_dir: "./models",
    output_dir: "./outputs",
    cache_dir: "./data/cache",
    gpu_acceleration: systemInfo?.cuda_available ?? true,
    auto_cleanup_cache: true,
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings({
      model_dir: "./models",
      output_dir: "./outputs",
      cache_dir: "./data/cache",
      gpu_acceleration: systemInfo?.cuda_available ?? true,
      auto_cleanup_cache: true,
    });
  };

  return (
    <div className="w-full max-w-4xl space-y-6 animate-in fade-in duration-150">
      {/* Header with Title and Compact Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] tracking-wide">Cài đặt Hệ thống</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Tùy chỉnh thông số máy chủ, GPU và thư mục lưu trữ</p>
        </div>

        {/* Compact Segmented Tab Control */}
        <SegmentedControl<SettingsTab>
          value={activeTab}
          onChange={setActiveTab}
          fullWidth={false}
          size="sm"
          options={[
            { value: "general", label: "Chung", icon: <Sliders className="w-3.5 h-3.5" /> },
            { value: "ai", label: "Bộ xử lý AI", icon: <Cpu className="w-3.5 h-3.5" /> },
            { value: "gpu", label: "Tăng tốc GPU", icon: <Zap className="w-3.5 h-3.5" /> },
            { value: "storage", label: "Lưu trữ", icon: <HardDrive className="w-3.5 h-3.5" /> },
          ]}
        />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General */}
        {activeTab === "general" && (
          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Giao diện Studio</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 divide-y divide-[var(--border-subtle)]">
              <div className="flex items-center justify-between pb-3 text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Chế độ hiển thị</span>
                  <span className="text-[var(--text-secondary)] text-xs">
                    {theme === "dark"
                      ? "Giao diện tối Studio chuyên nghiệp (Mặc định)"
                      : "Giao diện sáng rõ nét, phong cách hiện đại"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                    {theme === "dark" ? "Dark Studio" : "Light Studio"}
                  </span>
                  <Switch
                    checked={theme === "dark"}
                    onChange={(checked) => setTheme(checked ? "dark" : "light")}
                    icon={
                      theme === "dark" ? (
                        <Moon className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Giám sát tài nguyên phần cứng</span>
                  <span className="text-[var(--text-secondary)] text-xs">Đo thời gian thực tải CPU, RAM & GPU</span>
                </div>
                <span className="text-xs font-mono text-emerald-500 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Đang hoạt động
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: AI Engine */}
        {activeTab === "ai" && (
          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Quy trình xử lý AI</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Select label="Mô hình AI mặc định">
                <option>Veyra Diffusion v1</option>
                <option>AnimateDiff Lightning</option>
                <option>CogVideoX-2B Stub</option>
              </Select>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Phân lát chú ý (Attention Slicing)</span>
                  <span className="text-[var(--text-secondary)] text-xs">Tiết kiệm dung lượng VRAM cho các dòng GPU tầm trung</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded w-4 h-4 bg-[var(--bg-input)] accent-indigo-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: GPU Acceleration */}
        {activeTab === "gpu" && (
          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Tăng tốc phần cứng</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Bật tăng tốc NVIDIA CUDA</span>
                  <span className="text-[var(--text-secondary)] text-xs">
                    Tận dụng Tensor Cores để tăng tốc độ xuất video AI
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gpu_acceleration}
                  onChange={(e) =>
                    setSettings({ ...settings, gpu_acceleration: e.target.checked })
                  }
                  className="rounded w-4 h-4 bg-[var(--bg-input)] accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Thiết bị phát hiện</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {systemInfo?.gpu.name || "Chế độ CPU"}
                  </span>
                </div>
                {systemInfo?.gpu.vram_total_gb && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Bộ nhớ VRAM</span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-semibold">
                      {systemInfo.gpu.vram_used_gb !== undefined && systemInfo.gpu.vram_used_gb !== null
                        ? `${systemInfo.gpu.vram_used_gb.toFixed(1)} / ${systemInfo.gpu.vram_total_gb.toFixed(1)} GB`
                        : `${systemInfo.gpu.vram_total_gb} GB`}
                    </span>
                  </div>
                )}
                {systemInfo?.gpu.temperature_celsius && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Nhiệt độ GPU</span>
                    <span className="text-amber-500 dark:text-amber-400 font-semibold">{systemInfo.gpu.temperature_celsius}°C</span>
                  </div>
                )}
                {systemInfo?.gpu.driver_version && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Phiên bản Driver</span>
                    <span className="text-[var(--text-primary)]">{systemInfo.gpu.driver_version}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Storage */}
        {activeTab === "storage" && (
          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Thư mục & Lưu trữ</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Input
                label="Thư mục lưu trọng số Model"
                value={settings.model_dir}
                onChange={(e) => setSettings({ ...settings, model_dir: e.target.value })}
              />

              <Input
                label="Thư mục xuất Video"
                value={settings.output_dir}
                onChange={(e) => setSettings({ ...settings, output_dir: e.target.value })}
              />

              <Input
                label="Thư mục bộ nhớ đệm (Cache)"
                value={settings.cache_dir}
                onChange={(e) => setSettings({ ...settings, cache_dir: e.target.value })}
              />

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Tự động dọn dẹp Cache</span>
                  <span className="text-[var(--text-secondary)] text-xs">Xóa các khung hình trung gian sau khi tạo video xong</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_cleanup_cache}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_cleanup_cache: e.target.checked })
                  }
                  className="rounded w-4 h-4 bg-[var(--bg-input)] accent-indigo-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prominent, well-proportioned Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="h-10 px-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Khôi phục mặc định
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="h-10 px-7 text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/25"
            leftIcon={
              isSaved ? (
                <Check className="w-4 h-4 text-emerald-200" />
              ) : (
                <Save className="w-4 h-4" />
              )
            }
          >
            {isSaved ? "Đã lưu thành công" : "Lưu cài đặt"}
          </Button>
        </div>
      </form>
    </div>
  );
};
