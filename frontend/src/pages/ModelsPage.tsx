import React, { useState } from "react";
import {
  Cpu,
  Download,
  CheckCircle2,
  HardDrive,
  Info,
} from "lucide-react";
import { ModelItem } from "../types";

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
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Models</h2>
          <p className="text-xs text-zinc-400">
            Local weights, diffusion checkpoints, and motion modules
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/80 px-3.5 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-300">
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local Storage Used:</span>
          <span className="font-mono font-semibold text-white">{totalSize.toFixed(1)} GB</span>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          In <strong>Phase 1</strong>, model files are cataloged as architectural stubs. Clicking{" "}
          <strong className="text-zinc-300">Install Model</strong> exercises the backend service
          dispatcher without initiating gigabyte-scale network downloads or PyTorch weights allocation.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => {
          const isInstalled = model.status === "Installed";
          const isCurrentInstalling = installingId === model.id;

          return (
            <div
              key={model.id}
              className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{model.name}</h3>
                      <span className="text-[11px] text-zinc-400">{model.type}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      isInstalled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isInstalled ? "Installed" : "Not Installed"}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{model.description}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{model.size_gb > 0 ? `${model.size_gb} GB` : "0 GB (Stub)"}</span>
                </div>

                {isInstalled ? (
                  <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready for Inference</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleInstall(model.id)}
                    disabled={isCurrentInstalling}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isCurrentInstalling ? "animate-bounce" : ""}`} />
                    <span>{isCurrentInstalling ? "Installing..." : "Install Model"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
