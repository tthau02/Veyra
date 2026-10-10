import React, { useState, useEffect } from "react";
import {
  Save,
  Check,
  RotateCcw,
  Sliders,
  Cpu,
  Zap,
  HardDrive,
  Cloud,
  Trash2,
} from "lucide-react";
import { AppSettings, SystemInfo, CloudProvider } from "../types";
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
  Badge,
} from "../components/ui";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";

interface SettingsPageProps {
  systemInfo: SystemInfo | null;
}

type SettingsTab = "general" | "ai" | "gpu" | "cloud" | "storage";

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

  // Cloud providers state for Phase 2A
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const list = await api.getProviders();
    setProviders(list);
  };

  const handleSaveProviderKey = async (providerId: string) => {
    const key = providerKeys[providerId];
    if (!key) return;
    const ok = await api.saveProviderKey(providerId, key, true);
    if (ok) {
      await loadProviders();
      setProviderKeys((prev) => ({ ...prev, [providerId]: "" }));
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { valid: true, message: "Đã lưu API Key an toàn vào cơ sở dữ liệu." },
      }));
    }
  };

  const handleRemoveProviderKey = async (providerId: string) => {
    const ok = await api.removeProviderKey(providerId);
    if (ok) {
      await loadProviders();
      setTestResults((prev) => {
        const copy = { ...prev };
        delete copy[providerId];
        return copy;
      });
    }
  };

  const handleTestKey = async (providerId: string) => {
    const keyToTest = providerKeys[providerId] || "";
    setTestingId(providerId);
    const result = await api.testProviderKey(providerId, keyToTest);
    setTestingId(null);
    setTestResults((prev) => ({
      ...prev,
      [providerId]: { valid: result.valid, message: result.message },
    }));
  };

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
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Tùy chỉnh thông số máy chủ, GPU và Cloud AI APIs</p>
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
            { value: "cloud", label: "Cloud AI", icon: <Cloud className="w-3.5 h-3.5" /> },
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-mono">
                    {theme === "dark" ? "Dark Studio" : "Light Studio"}
                  </span>
                  <Switch
                    checked={theme === "light"}
                    onChange={(checked) => setTheme(checked ? "light" : "dark")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Giám sát tài nguyên phần cứng</span>
                  <span className="text-[var(--text-secondary)] text-xs">Đo thời gian thực tải CPU, RAM & GPU</span>
                </div>
                <span className="font-mono text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Đang hoạt động
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: AI Processor */}
        {activeTab === "ai" && (
          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Bộ tham số Suy luận AI</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <Select
                label="Độ chính xác suy luận (Precision)"
                options={[
                  { value: "bf16", label: "bfloat16 (Tối ưu cho RTX 3070 / Ampere)" },
                  { value: "fp16", label: "float16 (Phổ biến trên hầu hết GPU)" },
                  { value: "fp32", label: "float32 (Độ chính xác nguyên bản)" },
                ]}
                value="bf16"
                onChange={() => {}}
              />

              <Select
                label="Bộ lập lịch khử nhiễu (Scheduler)"
                options={[
                  { value: "euler", label: "Euler Discrete Scheduler (Khuyên dùng)" },
                  { value: "dpm", label: "DPM++ 2M Karras (Mượt mà chi tiết)" },
                  { value: "ddim", label: "DDIM (Mặc định truyền thống)" },
                ]}
                value="euler"
                onChange={() => {}}
              />

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Tự động nạp bộ nhớ đệm VAE</span>
                  <span className="text-[var(--text-secondary)] text-xs">Kích hoạt VAE Slicing và Tiling để chống tràn VRAM khi render</span>
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
              <CardTitle className="text-sm">Tăng tốc Phần cứng & CUDA</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Kích hoạt CUDA Acceleration</span>
                  <span className="text-[var(--text-secondary)] text-xs">Sử dụng nhân Tensor Cores trên card NVIDIA để sinh video</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gpu_acceleration}
                  disabled={!systemInfo?.cuda_available}
                  onChange={(e) =>
                    setSettings({ ...settings, gpu_acceleration: e.target.checked })
                  }
                  className="rounded w-4 h-4 bg-[var(--bg-input)] accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Hardware diagnostic panel */}
              <div className="p-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Tên Card đồ họa:</span>
                  <span className="text-[var(--text-primary)] font-semibold">{systemInfo?.gpu.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Tổng dung lượng VRAM:</span>
                  <span className="text-[var(--text-primary)]">{systemInfo?.gpu.vram_total_gb ? `${systemInfo.gpu.vram_total_gb} GB` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Hỗ trợ CUDA:</span>
                  <span className={systemInfo?.cuda_available ? "text-emerald-500 font-semibold" : "text-zinc-500"}>
                    {systemInfo?.cuda_available ? "KHẢ DỤNG" : "KHÔNG KHẢ DỤNG"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">Giới hạn nhiệt độ an toàn (Thermal Throttle)</span>
                  <span className="text-[var(--text-secondary)] text-xs">Tạm dừng render nếu nhiệt độ GPU vượt ngưỡng 85°C</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]">
                  85°C (Mặc định)
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Cloud AI */}
        {activeTab === "cloud" && (
          <div className="space-y-4">
            <div className="space-y-4">
              {providers.map((provider) => {
                const testResult = testResults[provider.provider_id];
                const isTesting = testingId === provider.provider_id;
                const inputVal = providerKeys[provider.provider_id] || "";

                return (
                  <Card key={provider.provider_id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            {provider.name}
                          </h3>
                          <Badge
                            variant={provider.has_key ? "success" : "default"}
                            size="sm"
                            withDot
                          >
                            {provider.has_key ? "Đã kết nối" : "Chưa cấu hình"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {provider.description}
                        </p>
                      </div>

                      {provider.has_key && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRemoveProviderKey(provider.provider_id)}
                          className="text-rose-500 hover:text-rose-600"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Xóa Key
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder={provider.has_key ? `Đã lưu: ${provider.masked_key}` : "Dán API Key vào đây (ví dụ: sk-...)"}
                            value={inputVal}
                            onChange={(e) =>
                              setProviderKeys({
                                ...providerKeys,
                                [provider.provider_id]: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestKey(provider.provider_id)}
                          disabled={isTesting || (!inputVal && !provider.has_key)}
                          isLoading={isTesting}
                        >
                          Kiểm tra
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveProviderKey(provider.provider_id)}
                          disabled={!inputVal}
                        >
                          Lưu
                        </Button>
                      </div>

                      {testResult && (
                        <div
                          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                            testResult.valid
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{testResult.message}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Storage */}
        {activeTab === "storage" && (
          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Đường dẫn Lưu trữ Cục bộ</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Input
                label="Thư mục Mô hình AI (Models)"
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

        {/* Footer Actions */}
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
