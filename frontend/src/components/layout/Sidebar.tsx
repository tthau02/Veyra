import React from "react";
import {
  LayoutDashboard,
  Video,
  FolderKanban,
  Cpu,
  Settings,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";
import { NavPage, SystemInfo } from "../../types";

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  systemInfo: SystemInfo | null;
  backendOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  systemInfo,
  backendOnline,
}) => {
  const navItems: { id: NavPage; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "create", label: "Create Video", icon: Video, badge: "AI" },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "models", label: "Models", icon: Cpu },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0d0d10] border-r border-white/5 flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-white">VEYRA</span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Local AI Video Engine</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm border border-white/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-indigo-400" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry & Status Panels */}
      <div className="p-3 border-t border-white/5 space-y-2 bg-[#0a0a0d]">
        {/* Backend Connectivity Status */}
        <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-zinc-300">Backend Core</span>
              <span className="text-[10px] text-zinc-400">127.0.0.1:8000</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-400"
              }`}
            />
            <span className="text-[10px] text-zinc-400 font-mono">
              {backendOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* GPU Status */}
        <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-zinc-300">GPU Acceleration</span>
            </div>
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                systemInfo?.cuda_available
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {systemInfo?.cuda_available ? "CUDA Active" : "No CUDA"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 truncate" title={systemInfo?.gpu.name || "Detecting..."}>
            {systemInfo?.gpu.name || (backendOnline ? "No GPU Detected" : "Connecting...")}
          </p>
          {systemInfo?.gpu.vram_total_gb ? (
            <div className="mt-1 flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>VRAM Free:</span>
              <span>{systemInfo.gpu.vram_free_gb ?? 0} GB / {systemInfo.gpu.vram_total_gb} GB</span>
            </div>
          ) : null}
        </div>

        {/* AI Engine Status */}
        <div className="px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">AI Engine</span>
          <span className="text-indigo-400 font-medium">Phase 1 (Stub Ready)</span>
        </div>
      </div>
    </aside>
  );
};
