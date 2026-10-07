import React, { useState } from "react";
import {
  Folder,
  Zap,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import { AppSettings, SystemInfo } from "../types";

interface SettingsPageProps {
  systemInfo: SystemInfo | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ systemInfo }) => {
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "gpu" | "storage">("general");

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Studio Settings</h2>
        <p className="text-xs text-zinc-400">Configure engine paths, acceleration, and disk management</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-6 text-xs font-medium">
        {[
          { id: "general", label: "General" },
          { id: "ai", label: "AI Engine" },
          { id: "gpu", label: "GPU Acceleration" },
          { id: "storage", label: "Storage & Paths" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 transition-colors relative ${
              activeTab === tab.id
                ? "text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General */}
        {activeTab === "general" && (
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Studio Environment
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <span className="font-medium text-white block">Theme Mode</span>
                  <span className="text-zinc-400 text-[11px]">Desktop studio theme is permanently dark</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                  Dark Studio (Fixed)
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-white block">Telemetry Logging</span>
                  <span className="text-zinc-400 text-[11px]">Output runtime logs to local console</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI */}
        {activeTab === "ai" && (
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Diffusion Engine Parameters
            </h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-200">Default Model Checkpoint</label>
                <select className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-100">
                  <option>Veyra Diffusion v1 (Default)</option>
                  <option>AnimateDiff Lightning</option>
                  <option>CogVideoX-2B Stub</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div>
                  <span className="font-medium text-white block">Attention Slicing</span>
                  <span className="text-zinc-400 text-[11px]">Reduces VRAM usage at slight speed cost</span>
                </div>
                <input type="checkbox" defaultChecked className="rounded bg-zinc-800 accent-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: GPU */}
        {activeTab === "gpu" && (
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Hardware Acceleration</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <span className="font-medium text-white block">Enable GPU Acceleration</span>
                  <span className="text-zinc-400 text-[11px]">
                    Leverage NVIDIA CUDA tensor cores when available
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gpu_acceleration}
                  onChange={(e) =>
                    setSettings({ ...settings, gpu_acceleration: e.target.checked })
                  }
                  className="rounded w-4 h-4 bg-zinc-800 accent-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block">Active Device</span>
                <p className="text-xs font-medium text-white">
                  {systemInfo?.gpu.name || "No dedicated GPU detected (CPU mode active)"}
                </p>
                {systemInfo?.gpu.driver_version && (
                  <p className="text-[11px] text-zinc-400 font-mono">
                    NVIDIA Driver: {systemInfo.gpu.driver_version} • VRAM: {systemInfo.gpu.vram_total_gb} GB
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Storage */}
        {activeTab === "storage" && (
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Directories & Cache Storage</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-300">Model Directory</label>
                <input
                  type="text"
                  value={settings.model_dir}
                  onChange={(e) => setSettings({ ...settings, model_dir: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-300">Output Directory</label>
                <input
                  type="text"
                  value={settings.output_dir}
                  onChange={(e) => setSettings({ ...settings, output_dir: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-300">Cache Directory</label>
                <input
                  type="text"
                  value={settings.cache_dir}
                  onChange={(e) => setSettings({ ...settings, cache_dir: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div>
                  <span className="font-medium text-white block">Auto Cleanup Cache</span>
                  <span className="text-zinc-400 text-[11px]">
                    Automatically purge temporary latent frames after export
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_cleanup_cache}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_cleanup_cache: e.target.checked })
                  }
                  className="rounded w-4 h-4 bg-zinc-800 accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? "Saved Successfully" : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
