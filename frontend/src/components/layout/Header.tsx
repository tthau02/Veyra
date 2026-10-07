import React from "react";
import { Plus, RefreshCw, Cpu, HardDrive } from "lucide-react";
import { NavPage, SystemInfo } from "../../types";

interface HeaderProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  systemInfo: SystemInfo | null;
  onRefreshSystem: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  systemInfo,
  onRefreshSystem,
  isRefreshing,
}) => {
  const titles: Record<NavPage, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Studio Dashboard",
      subtitle: "Overview of your local AI rendering resources and activity",
    },
    create: {
      title: "Create Video",
      subtitle: "Configure diffusion parameters, motion dynamics, and prompt canvas",
    },
    projects: {
      title: "Video Projects",
      subtitle: "Manage all generated timelines, assets, and project configurations",
    },
    models: {
      title: "Model Management",
      subtitle: "Installed checkpoints, LoRAs, and motion modules",
    },
    settings: {
      title: "Application Settings",
      subtitle: "Configure hardware acceleration, paths, and local storage limits",
    },
  };

  const { title, subtitle } = titles[currentPage];

  return (
    <header className="h-16 px-6 bg-[#0b0b0e] border-b border-white/5 flex items-center justify-between select-none">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* System telemetry snapshot */}
        {systemInfo && (
          <div className="hidden lg:flex items-center gap-3 text-xs text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>CPU:</span>
              <span className="font-mono text-zinc-200">{systemInfo.cpu_usage_percent}%</span>
            </div>
            <div className="w-[1px] h-3 bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span>RAM:</span>
              <span className="font-mono text-zinc-200">
                {systemInfo.ram_usage_percent}% ({systemInfo.ram_available_gb} GB free)
              </span>
            </div>
          </div>
        )}

        {/* Refresh telemetry button */}
        <button
          onClick={onRefreshSystem}
          disabled={isRefreshing}
          title="Refresh hardware stats"
          className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
        </button>

        {/* Global CTA */}
        {currentPage !== "create" && (
          <button
            onClick={() => onNavigate("create")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Video</span>
          </button>
        )}
      </div>
    </header>
  );
};
