import React, { useEffect, useRef, useState } from "react";
import { Cpu, Download, HardDrive, Pause, Play, Trash2 } from "lucide-react";
import { ModelItem, ModelPreparation } from "../types";
import { api } from "../services/api";
import { Card, Badge, Button, Modal } from "../components/ui";

interface ModelsPageProps {
  models: ModelItem[];
  onModelsChanged: (models: ModelItem[]) => void;
}

const active = (model: ModelItem) => ["queued", "downloading", "verifying", "waiting_network", "interrupted"].includes(model.download_status);
const size = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(2)} GB`;
const statusLabel = (model: ModelItem) => {
  if (!model.supported) return "Chưa hỗ trợ";
  if (model.status === "Installed") return "Đã cài đặt";
  return ({ queued: "Đang chờ", downloading: "Đang tải", verifying: "Đang kiểm tra", interrupted: "Gián đoạn", failed: "Lỗi tải", paused: "Tạm dừng", waiting_network: "Chờ kết nối" } as Record<string, string>)[model.download_status] || "Chưa cài";
};

export const ModelsPage: React.FC<ModelsPageProps> = ({ models, onModelsChanged }) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<ModelItem | null>(null);
  const [confirmation, setConfirmation] = useState<{ model: ModelItem; preparation: ModelPreparation } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connectionError, setConnectionError] = useState(false);
  const mounted = useRef(true);
  const hasActive = models.some(active);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      try {
        const updated = await api.getModels();
        if (!cancelled) {
          onModelsChanged(updated);
          setConnectionError(false);
          if (updated.some(active)) timer = setTimeout(refresh, 1000);
        }
      } catch {
        if (!cancelled) {
          setConnectionError(true);
          timer = setTimeout(refresh, 1000);
        }
      }
    };
    void refresh();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [hasActive, onModelsChanged]);

  const prepare = async (model: ModelItem) => {
    setBusyId(model.id);
    setErrors(previous => ({ ...previous, [model.id]: "" }));
    try {
      const preparation = await api.prepareModel(model.id);
      if (mounted.current) setConfirmation({ model, preparation });
    } catch (error) {
      if (mounted.current) setErrors(previous => ({ ...previous, [model.id]: error instanceof Error ? error.message : "Không thể chuẩn bị tải." }));
    } finally {
      if (mounted.current) setBusyId(null);
    }
  };

  const install = async () => {
    if (!confirmation) return;
    const id = confirmation.model.id;
    setConfirmation(null);
    setBusyId(id);
    try {
      await api.installModel(id);
      const updated = await api.getModels();
      if (mounted.current) onModelsChanged(updated);
    } catch (error) {
      if (mounted.current) setErrors(previous => ({ ...previous, [id]: error instanceof Error ? error.message : "Không thể tải mô hình." }));
    } finally {
      if (mounted.current) setBusyId(null);
    }
  };

  const controlDownload = async (model: ModelItem) => {
    setBusyId(model.id);
    setErrors(previous => ({ ...previous, [model.id]: "" }));
    try {
      const status = active(model) ? await api.pauseModel(model.id) : await api.resumeModel(model.id);
      if (mounted.current) {
        onModelsChanged(models.map(item => item.id === model.id ? { ...item, download_status: status.status, download_progress: status.progress, downloaded_bytes: status.downloaded_bytes, error_message: status.error_message } : item));
      }
    } catch (error) {
      if (mounted.current) setErrors(previous => ({ ...previous, [model.id]: error instanceof Error ? error.message : "Không thể cập nhật tải." }));
    } finally {
      if (mounted.current) setBusyId(null);
    }
  };

  const removeModel = async () => {
    if (!deleteConfirmation) return;
    const id = deleteConfirmation.id;
    setBusyId(id);
    setErrors(previous => ({ ...previous, [id]: "" }));
    try {
      await api.deleteModel(id);
      const updated = await api.getModels();
      if (mounted.current) onModelsChanged(updated);
    } catch (error) {
      if (mounted.current) setErrors(previous => ({ ...previous, [id]: error instanceof Error ? error.message : "Không thể xóa mô hình." }));
    } finally {
      if (mounted.current) { setBusyId(null); setDeleteConfirmation(null); }
    }
  };

  const totalSize = models.filter(model => model.status === "Installed").reduce((total, model) => total + model.total_bytes, 0);
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kho Mô hình ({models.filter(model => model.status === "Installed").length}/{models.length})</h2>
        <div className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-lg border border-[var(--border-app)] text-xs text-[var(--text-secondary)] font-mono">
          <HardDrive className="w-4 h-4 text-indigo-500" /><span>Đã cài: {size(totalSize)}</span>
        </div>
      </div>
      {connectionError && <p className="text-xs text-[var(--text-secondary)]">Mất kết nối. Đang kết nối lại…</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map(model => {
          const installed = model.status === "Installed";
          const downloading = active(model);
          const error = errors[model.id] || model.error_message;
          return (
            <Card key={model.id} className="p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-500"><Cpu className="w-5 h-5" /></div>
                    <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">{model.name}</h3><span className="text-xs text-[var(--text-secondary)]">{model.type}</span></div>
                  </div>
                  <Badge variant={installed ? "success" : "default"} size="sm" withDot>{statusLabel(model)}</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{model.description}</p>
              </div>
              {(downloading || model.download_status === "paused") && <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden" role="progressbar" aria-label={`Tải ${model.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={model.download_progress || 0}>
                  <div className="h-full bg-indigo-500 transition-[width]" style={{ width: `${model.download_progress || 0}%` }} />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{size(model.downloaded_bytes)} / {size(model.total_bytes)} · {model.download_progress || 0}%</p>
              </div>}
              {error && <p role="status" className="text-xs text-[var(--text-secondary)]">{error}</p>}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-mono">{model.total_bytes > 0 ? size(model.total_bytes) : "—"}</span>
                {installed ? <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmation(model)} disabled={busyId !== null || connectionError} isLoading={busyId === model.id} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Xóa</Button> : (downloading || model.download_status === "paused") ? <Button variant="secondary" size="sm" onClick={() => void controlDownload(model)} disabled={busyId !== null || connectionError} isLoading={busyId === model.id} leftIcon={downloading ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}>
                  {downloading ? "Tạm dừng" : "Tải tiếp"}
                </Button> : <Button variant="primary" size="sm" onClick={() => void prepare(model)} disabled={!model.supported || busyId !== null || connectionError} isLoading={busyId === model.id} leftIcon={<Download className="w-3.5 h-3.5" />}>
                  {!model.supported ? "Chưa hỗ trợ" : downloading ? statusLabel(model) : model.download_status === "interrupted" ? "Tiếp tục" : error || model.download_status === "failed" ? "Thử lại" : "Tải về"}
                </Button>}
              </div>
            </Card>
          );
        })}
      </div>
      <Modal isOpen={deleteConfirmation !== null} onClose={() => { if (!busyId) setDeleteConfirmation(null); }} title="Xóa mô hình" maxWidth="sm" footer={<>
        <Button variant="secondary" size="sm" disabled={busyId !== null} onClick={() => setDeleteConfirmation(null)}>Hủy</Button>
        <Button variant="secondary" size="sm" disabled={busyId !== null} isLoading={busyId !== null} onClick={() => void removeModel()} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Xóa</Button>
      </>}>
        {deleteConfirmation && <div className="space-y-2 text-xs text-[var(--text-secondary)]">
          <p>Xóa <strong className="text-[var(--text-primary)]">{deleteConfirmation.name}</strong> khỏi máy?</p>
          <p>Bạn có thể tải lại khi cần. Video đã tạo vẫn được giữ.</p>
        </div>}
      </Modal>
      <Modal isOpen={confirmation !== null} onClose={() => setConfirmation(null)} title="Tải mô hình AI" maxWidth="sm" footer={<>
        <Button variant="secondary" size="sm" onClick={() => setConfirmation(null)}>Hủy</Button>
        <Button variant="primary" size="sm" onClick={() => void install()} leftIcon={<Download className="w-3.5 h-3.5" />}>Tải về</Button>
      </>}>
        {confirmation && <div className="space-y-2 text-xs text-[var(--text-secondary)]">
          <p>Tải <strong className="text-[var(--text-primary)]">{confirmation.model.name}</strong> về máy?</p>
          <p>Cần tải: {size(confirmation.preparation.remaining_bytes)}</p>
          <p>Dung lượng trống cần có: {size(confirmation.preparation.required_bytes)}</p>
        </div>}
      </Modal>
    </div>
  );
};
