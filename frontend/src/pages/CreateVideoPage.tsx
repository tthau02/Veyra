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
} from "lucide-react";
import { AspectRatio, Resolution, Duration, ModelItem, GenerationJobStatus } from "../types";
import { api } from "../services/api";
import { cn } from "../utils/cn";
import {
  Button,
  Input,
  Textarea,
  Select,
  SegmentedControl,
  Badge,
  Card,
  CardHeader,
  CardTitle,
} from "../components/ui";

interface CreateVideoPageProps {
  models: ModelItem[];
  onProjectCreated?: () => void;
}

export const CreateVideoPage: React.FC<CreateVideoPageProps> = ({ models }) => {
  // Generation parameters state
  const [prompt, setPrompt] = useState<string>(
    "Một cảnh quay điện ảnh góc trên cao toàn cảnh thành phố cyberpunk tương lai dưới cơn mưa rào, ánh đèn neon phản chiếu trên mặt đường ướt, ánh sáng thể tích volumetric, siêu chi tiết 8k"
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(
    "mờ, biến dạng, rung giật, chất lượng kém, lỗi hình ảnh, hoạt hình xấu, chuyển động giật cục"
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    models.find((m) => m.status === "Installed")?.name || "Veyra Diffusion v1"
  );
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
    setCurrentStep("Đang gửi yêu cầu tới máy chủ AI...");

    const actualSeed = isRandomSeed ? Math.floor(Math.random() * 999999) : seed ?? 42;

    try {
      await api.generateVideo({
        prompt,
        negative_prompt: negativePrompt,
        model_name: selectedModel,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: duration,
        seed: actualSeed,
      });

      const simJob = await api.startSimulateJob({
        prompt,
        negative_prompt: negativePrompt,
        model_name: selectedModel,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: duration,
        seed: actualSeed,
      });

      if (simJob && simJob.job_id) {
        setActiveJobId(simJob.job_id);
        setJobStatus(simJob.status);
        setProgress(simJob.progress);
        setCurrentStep(simJob.current_step);

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = window.setInterval(async () => {
          const statusUpdate: GenerationJobStatus | null = await api.getJobStatus(simJob.job_id);
          if (statusUpdate) {
            setJobStatus(statusUpdate.status);
            setProgress(statusUpdate.progress);
            setCurrentStep(statusUpdate.current_step);

            if (statusUpdate.status === "completed" || statusUpdate.status === "failed") {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          }
        }, 600);
      } else {
        simulateFrontendFlow();
      }
    } catch {
      simulateFrontendFlow();
    }
  };

  const simulateFrontendFlow = () => {
    setJobStatus("queued");
    setProgress(15);
    setCurrentStep("Đang xếp hàng trong hàng đợi xuất video...");

    setTimeout(() => {
      setJobStatus("generating");
      setProgress(45);
      setCurrentStep("Đang lấy mẫu khung hình diffusion (bước 9/20)...");

      setTimeout(() => {
        setProgress(85);
        setCurrentStep("Đang nội suy chuyển động giữa các khung hình...");

        setTimeout(() => {
          setJobStatus("completed");
          setProgress(100);
          setCurrentStep("Hoàn tất tạo video thành công.");
        }, 1200);
      }, 1200);
    }, 1200);
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

  const getStatusLabel = (st: string) => {
    switch (st) {
      case "idle":
        return "Chờ tạo";
      case "queued":
        return "Đang chờ";
      case "generating":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      case "failed":
        return "Thất bại";
      default:
        return st;
    }
  };

  return (
    <div className="w-full h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-5 animate-in fade-in duration-150">
      {/* Left Column: Parameter Inspector Panel (5 cols on lg, 4 on xl) */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 overflow-y-auto pr-2">
        <Card className="flex flex-col space-y-4 p-5 pb-6 shrink-0 overflow-visible">
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

          {/* AI Model Engine */}
          <Select
            label="Mô hình AI (Checkpoint)"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.type})
              </option>
            ))}
          </Select>

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
                title="Đặt lại khung xem"
                className="h-10 w-10 p-0"
                leftIcon={<RotateCcw className="w-4 h-4" />}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Studio Viewport Preview (7 cols on lg, 8 on xl - Full Width) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between h-full min-h-0">
        <Card className="flex-1 flex flex-col justify-between h-full min-h-0">
          <CardHeader className="py-3 px-5">
            <div className="flex items-center gap-2.5">
              <Film className="w-4 h-4 text-indigo-400" />
              <CardTitle className="text-sm font-semibold">Khung xem trước Studio</CardTitle>
            </div>
            <Badge
              variant={
                jobStatus === "completed"
                  ? "success"
                  : jobStatus === "generating" || jobStatus === "queued"
                  ? "warning"
                  : jobStatus === "failed"
                  ? "danger"
                  : "default"
              }
              size="sm"
              withDot
            >
              {getStatusLabel(jobStatus)}
            </Badge>
          </CardHeader>

          {/* Viewport Large Canvas */}
          <div
            ref={canvasContainerRef}
            className="flex-1 flex items-center justify-center p-5 bg-black/10 dark:bg-black/50 overflow-hidden relative"
          >
            <div
              style={
                viewportSize
                  ? { width: `${viewportSize.width}px`, height: `${viewportSize.height}px` }
                  : undefined
              }
              className={cn(
                "rounded-xl flex flex-col items-center justify-center p-6 relative border border-zinc-800/80 bg-gradient-to-b from-[#131422] to-[#0a0b12] shadow-2xl",
                !viewportSize && (
                  aspectRatio === "16:9"
                    ? "w-full aspect-video"
                    : aspectRatio === "9:16"
                    ? "h-full aspect-[9/16]"
                    : "h-full aspect-square"
                )
              )}
            >
              {jobStatus === "idle" && (
                <div className="text-center p-6 space-y-2.5 text-zinc-400 select-none">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">Chưa có Video</p>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Nhập prompt và tinh chỉnh thông số, sau đó nhấn Tạo Video.
                  </p>
                </div>
              )}

              {(jobStatus === "queued" || jobStatus === "generating") && (
                <div className="w-full max-w-md px-6 text-center space-y-3 z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto shadow-md shadow-indigo-500/20" />
                  <p className="text-sm text-zinc-100 font-semibold">{currentStep}</p>
                  <p className="text-xs font-mono text-indigo-300 font-bold">{progress}% Đã xuất</p>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {jobStatus === "completed" && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 select-none">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-white">Tạo Video Hoàn Tất</p>
                  <div className="px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono text-zinc-200">
                    {resolution} • {duration}s • {aspectRatio}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Viewport Specs Footer */}
          <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{aspectRatio}</span>
            <span>{resolution}</span>
            <span>{duration}s</span>
            <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{selectedModel}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
