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
  Modal,
} from "../components/ui";

interface ModelsPageProps {
  models: ModelItem[];
  onInstallModel: (modelId: string) => Promise<void>;
}

export const ModelsPage: React.FC<ModelsPageProps> = ({ models, onInstallModel }) => {
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [confirmModel, setConfirmModel] = useState<ModelItem | null>(null);

  const handleConfirmDownload = async () => {
    if (!confirmModel) return;
    const modelToInstall = confirmModel;
    setConfirmModel(null);
    setInstallingId(modelToInstall.id);

    try {
      await onInstallModel(modelToInstall.id);
    } finally {
      setTimeout(() => {
        setInstallingId(null);
      }, 1000);
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
          Kho Mô hình ({models.filter((m) => m.status === "Installed").length}/{models.length})
        </h2>

        <div className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-lg border border-[var(--border-app)] text-xs text-[var(--text-secondary)] font-mono shadow-sm">
          <HardDrive className="w-4 h-4 text-indigo-500" />
          <span>Đã cài:</span>
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
                    {isInstalled ? "Đã cài đặt" : "Chưa cài"}
                  </Badge>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {model.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {model.size_gb > 0 ? `${model.size_gb} GB` : "0.0 GB"}
                </span>

                {isInstalled ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sẵn sàng</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setConfirmModel(model)}
                    disabled={isCurrentInstalling}
                    isLoading={isCurrentInstalling}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    {isCurrentInstalling ? "Đang tải..." : "Tải về"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Modal Before Downloading */}
      <Modal
        isOpen={confirmModel !== null}
        onClose={() => setConfirmModel(null)}
        title="Tải mô hình AI"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmModel(null)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Tải về
            </Button>
          </>
        }
      >
        {confirmModel && (
          <div className="space-y-2 text-xs text-[var(--text-secondary)]">
            <p>
              Bạn có muốn tải mô hình <strong className="text-[var(--text-primary)]">{confirmModel.name}</strong> ({confirmModel.size_gb} GB) về máy tính không?
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
