import React, { useState } from "react";
import {
  Cpu,
  Download,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { ModelItem } from "../types";
import {
  Card,
  Badge,
  Button,
} from "../components/ui";

interface ModelsPageProps {
  models: ModelItem[];
  onInstallModel: (modelId: string) => Promise<void>;
}

export const ModelsPage: React.FC<ModelsPageProps> = ({ models, onInstallModel }) => {
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = async (id: string) => {
    setInstallingId(id);
    try {
      await onInstallModel(id);
    } finally {
      setTimeout(() => {
        setInstallingId(null);
      }, 800);
    }
  };

  const totalSize = models
    .filter((m) => m.status === "Installed")
    .reduce((acc, m) => acc + m.size_gb, 0);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          Danh sách Checkpoint ({models.filter((m) => m.status === "Installed").length}/{models.length})
        </h2>

        <div className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-lg border border-[var(--border-app)] text-xs text-[var(--text-secondary)] font-mono shadow-sm">
          <HardDrive className="w-4 h-4 text-indigo-500" />
          <span>Dung lượng ổ đĩa:</span>
          <span className="font-semibold text-[var(--text-primary)]">{totalSize.toFixed(1)} GB</span>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => {
          const isInstalled = model.status === "Installed";
          const isCurrentInstalling = installingId === model.id;

          return (
            <Card
              key={model.id}
              className="p-4 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-500">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {model.name}
                      </h3>
                      <span className="text-xs text-[var(--text-secondary)] font-mono">
                        {model.type}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isInstalled ? "success" : "default"}
                    size="sm"
                    withDot
                  >
                    {isInstalled ? "Đã cài đặt" : "Có sẵn"}
                  </Badge>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {model.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {model.size_gb > 0 ? `${model.size_gb} GB` : "Mẫu tham chiếu"}
                </span>

                {isInstalled ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sẵn sàng tạo video</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleInstall(model.id)}
                    disabled={isCurrentInstalling}
                    isLoading={isCurrentInstalling}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    {isCurrentInstalling ? "Đang tải & cài..." : "Cài đặt Mô hình"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
