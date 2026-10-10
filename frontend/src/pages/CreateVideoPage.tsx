import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Film,
  Monitor,
  Smartphone,
  Square,
  Cpu,
  Cloud,
} from "lucide-react";
import { AspectRatio, Resolution, Duration, ModelItem } from "../types";
import { api } from "../services/api";
import { cn } from "../utils/cn";
import {
  Button,
  Input,
  Textarea,
  Select,
  SegmentedControl,
  Card,
  CardHeader,
  CardTitle,
} from "../components/ui";

interface CreateVideoPageProps {
  models: ModelItem[];
  onProjectCreated?: () => void;
}

export const CreateVideoPage: React.FC<CreateVideoPageProps> = ({ models }) => {
  // Engine Mode: local vs cloud
  const [engineMode, setEngineMode] = useState<"local" | "cloud">("local");

  // Generation parameters state
  const [prompt, setPrompt] = useState<string>(
    "Một cảnh quay điện ảnh góc trên cao toàn cảnh thành phố cyberpunk tương lai dưới cơn mưa rào, ánh đèn neon phản chiếu trên mặt đường ướt, ánh sáng thể tích volumetric, siêu chi tiết 8k"
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(
    "mờ, biến dạng, rung giật, chất lượng kém, lỗi hình ảnh, hoạt hình xấu, chuyển động giật cục"
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    models.find((m) => m.status === "Installed")?.name || models[0]?.name || "AnimateDiff Lightning"
  );
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string>("kling");

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<Resolution>("720p");
  const [duration, setDuration] = useState<Duration>(5);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [isRandomSeed, setIsRandomSeed] = useState<boolean>(true);

  // Job & preview pipeline state
  const [jobStatus, setJobStatus] = useState<"idle" | "queued" | "generating" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [, setActiveJobId] = useState<string | null>(null);

  const pollIntervalRef = useRef<number | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getViewportDimensions = () => {
    const { width: containerW, height: containerH } = canvasDimensions;
    if (containerW <= 0 || containerH <= 0) return undefined;

    let targetRatio = 16 / 9;
    if (aspectRatio === "9:16") targetRatio = 9 / 16;
    if (aspectRatio === "1:1") targetRatio = 1;

    const containerRatio = containerW / containerH;
    let w: number;
    let h: number;

    if (containerRatio > targetRatio) {
      h = containerH;
      w = h * targetRatio;
    } else {
      w = containerW;
      h = w / targetRatio;
    }

    return {
      width: Math.floor(w),
      height: Math.floor(h),
    };
  };

  const viewportSize = getViewportDimensions();

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleStartGeneration = async () => {
    if (!prompt.trim()) return;

    setJobStatus("queued");
    setProgress(5);
    setCurrentStep("Đang chuẩn bị tạo video...");

    const actualSeed = isRandomSeed ? Math.floor(Math.random() * 999999) : seed ?? 42;

    try {
      await api.generateVideo({
        prompt,
        negative_prompt: negativePrompt,
        model_name: engineMode === "local" ? selectedModel : selectedCloudProvider,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: duration,
        seed: actualSeed,
      });

      const simJob = await api.startSimulateJob({
        prompt,
        negative_prompt: negativePrompt,
        model_name: engineMode === "local" ? selectedModel : selectedCloudProvider,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: duration,
        seed: actualSeed,
      });

      if (simJob && simJob.job_id) {
        setActiveJobId(simJob.job_id);

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = window.setInterval(async () => {
          const statusRes = await api.getJobStatus(simJob.job_id);
          if (statusRes) {
            setProgress(statusRes.progress);
            setCurrentStep(statusRes.current_step);
            setJobStatus(statusRes.status);

            if (statusRes.status === "completed" || statusRes.status === "failed") {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          }
        }, 600);
      }
    } catch {
      setJobStatus("failed");
      setCurrentStep("Không thể kết nối máy chủ.");
    }
  };

  const handleReset = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setJobStatus("idle");
    setProgress(0);
    setCurrentStep("");
    setActiveJobId(null);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 min-h-0">
      {/* LEFT: Generation Parameters Column */}
      <div className="w-full lg:w-[460px] flex flex-col shrink-0 overflow-y-auto space-y-4 pr-1">
        <Card className="p-5 space-y-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-sm">
              Cấu hình Video
            </CardTitle>
          </CardHeader>

          {/* Engine Mode Switcher */}
          <SegmentedControl<"local" | "cloud">
            label="Chế độ xử lý"
            value={engineMode}
            onChange={setEngineMode}
            options={[
              { value: "local", label: "Cục bộ (GPU)", icon: <Cpu className="w-3.5 h-3.5" /> },
              { value: "cloud", label: "Đám mây (Cloud)", icon: <Cloud className="w-3.5 h-3.5" /> },
            ]}
          />

          {/* Prompt */}
          <Textarea
            label="Mô tả Video (Prompt)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={500}
            currentLength={prompt.length}
            placeholder="Mô tả khung cảnh, nhân vật, chuyển động, góc quay camera, ánh sáng..."
          />

          {/* Negative Prompt */}
          <Textarea
            label="Mô tả loại trừ (Negative Prompt)"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
            placeholder="mờ, biến dạng, rung giật, chất lượng kém, lỗi hình ảnh..."
          />

          {/* AI Model Engine Selector */}
          {engineMode === "local" ? (
            <Select
              label="Mô hình"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              label="Dịch vụ"
              value={selectedCloudProvider}
              onChange={(e) => setSelectedCloudProvider(e.target.value)}
            >
              <option value="kling">Kling AI</option>
              <option value="runway">Runway Gen-3</option>
              <option value="luma">Luma Dream Machine</option>
              <option value="minimax">Hailuo / MiniMax</option>
            </Select>
          )}

          {/* Aspect Ratio Segmented Control */}
          <SegmentedControl<AspectRatio>
            label="Tỷ lệ khung hình"
            value={aspectRatio}
            onChange={setAspectRatio}
            options={[
              { value: "16:9", label: "16:9", icon: <Monitor className="w-4 h-4" /> },
              { value: "9:16", label: "9:16", icon: <Smartphone className="w-4 h-4" /> },
              { value: "1:1", label: "1:1", icon: <Square className="w-4 h-4" /> },
            ]}
          />

          {/* Resolution Segmented Control */}
          <SegmentedControl<Resolution>
            label="Độ phân giải"
            value={resolution}
            onChange={setResolution}
            options={[
              { value: "512p", label: "512p" },
              { value: "720p", label: "720p" },
              { value: "1080p", label: "1080p" },
            ]}
          />

          {/* Duration Segmented Control */}
          <SegmentedControl<Duration>
            label="Thời lượng"
            value={duration}
            onChange={setDuration}
            options={[
              { value: 5, label: "5 giây" },
              { value: 10, label: "10 giây" },
            ]}
          />

          {/* Seed Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Seed</span>
              <button
                type="button"
                onClick={() => setIsRandomSeed(!isRandomSeed)}
                className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
              >
                {isRandomSeed ? "Ngẫu nhiên" : "Cố định Seed"}
              </button>
            </div>
            {isRandomSeed ? (
              <div className="h-9 px-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] text-sm text-[var(--text-secondary)] flex items-center justify-between">
                <span>Tạo ngẫu nhiên khi xuất video</span>
                <Sliders className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ) : (
              <Input
                type="number"
                value={seed ?? 42}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartGeneration}
              disabled={jobStatus === "queued" || jobStatus === "generating"}
              isLoading={jobStatus === "queued" || jobStatus === "generating"}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="flex-1 h-10 text-sm tracking-wide"
            >
              {jobStatus === "queued" || jobStatus === "generating"
                ? "Đang tạo Video..."
                : "Tạo Video"}
            </Button>
            {jobStatus !== "idle" && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleReset}
                title="Đặt lại phiên tạo"
                className="h-10 w-10 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT: Studio Viewport Preview Column */}
      <div className="flex-1 flex flex-col min-h-0 bg-transparent">
        <Card className="flex-1 flex flex-col overflow-hidden border border-[var(--border-app)] shadow-xl">
          {/* Header Bar */}
          <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold tracking-wide text-[var(--text-primary)]">
                Studio Viewport
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                [{aspectRatio}] • {resolution}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {jobStatus === "generating" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  Đang xử lý: {progress}%
                </span>
              )}
              {jobStatus === "completed" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hoàn tất
                </span>
              )}
              {jobStatus === "idle" && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Sẵn sàng</span>
              )}
            </div>
          </div>

          {/* Interactive Viewport Canvas */}
          <div
            ref={canvasContainerRef}
            className="flex-1 min-h-0 p-4 flex items-center justify-center bg-zinc-950/40 dark:bg-black/60 relative overflow-hidden"
          >
            {viewportSize ? (
              <div
                style={{
                  width: `${viewportSize.width}px`,
                  height: `${viewportSize.height}px`,
                }}
                className={cn(
                  "relative rounded-xl overflow-hidden shadow-2xl transition-[width,height] duration-300 ease-out flex flex-col items-center justify-center select-none border border-[var(--border-app)]",
                  "bg-gradient-to-b from-zinc-900 to-zinc-950 text-white"
                )}
              >
                {/* IDLE STATE */}
                {jobStatus === "idle" && (
                  <div className="flex flex-col items-center gap-3 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shadow-inner">
                      <Play className="w-5 h-5 ml-0.5 text-zinc-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-200">Khung nhìn xem trước</p>
                      <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                        Nhập câu lệnh prompt và bấm <strong className="text-zinc-200">Tạo Video</strong> để bắt đầu quá trình tổng hợp AI.
                      </p>
                    </div>
                  </div>
                )}

                {/* QUEUED OR GENERATING STATE */}
                {(jobStatus === "queued" || jobStatus === "generating") && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
                    <div className="w-full max-w-xs space-y-4 text-center">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-indigo-400">Tiến trình xử lý</span>
                          <span className="font-semibold text-white">{progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/60">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono tracking-tight animate-pulse">
                        {currentStep || "Đang xử lý khung hình..."}
                      </p>
                    </div>
                  </div>
                )}

                {/* COMPLETED STATE */}
                {jobStatus === "completed" && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-sm font-bold text-white">Xuất Video Hoàn tất</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                        Video đã được tạo thành công ({aspectRatio} • {resolution} • {duration}s).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <div className="flex items-center gap-4">
              <span>Độ phân giải: <strong className="text-[var(--text-primary)]">{resolution}</strong></span>
              <span>Thời lượng: <strong className="text-[var(--text-primary)]">{duration}s</strong></span>
              <span>Chế độ: <strong className="text-[var(--text-primary)]">{engineMode.toUpperCase()}</strong></span>
            </div>
            <span>Khung hình: <strong className="text-[var(--text-primary)]">{duration * 16} frames</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
};
