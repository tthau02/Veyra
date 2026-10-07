import React from "react";
import {
  FolderKanban,
  Film,
  Cpu,
  Zap,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { NavPage, Project, SystemInfo, ModelItem } from "../types";

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
  projects: Project[];
  models: ModelItem[];
  systemInfo: SystemInfo | null;
  backendOnline: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  projects,
  models,
  systemInfo,
  backendOnline,
}) => {
  const installedModelsCount = models.filter((m) => m.status === "Installed").length;
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 p-8 border border-white/5 shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Veyra Engine • Phase 1 Architecture</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            Welcome to Local AI Video Studio
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Generate high-fidelity videos directly on your local Windows hardware. Complete control,
            zero cloud subscriptions, and full hardware privacy.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => onNavigate("create")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Video</span>
            </button>
            <button
              onClick={() => onNavigate("models")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-xs font-semibold border border-white/5 transition-all"
            >
              <Cpu className="w-4 h-4" />
              <span>Manage Models</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projects */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Saved timelines and drafts</p>
        </div>

        {/* Card 2: Generated Videos */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Generated Videos</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {projects.filter((p) => p.status === "completed").length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Rendered video outputs</p>
        </div>

        {/* Card 3: Installed Models */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Installed Models</span>
            <Cpu className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-white">{installedModelsCount}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Available for local synthesis</p>
        </div>

        {/* Card 4: GPU Status */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">GPU Status</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-white truncate" title={systemInfo?.gpu.name}>
            {systemInfo?.gpu.name || (backendOnline ? "Not Detected" : "Offline")}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                systemInfo?.cuda_available ? "bg-emerald-400" : "bg-zinc-600"
              }`}
            />
            <span className="text-[11px] text-zinc-400 font-mono">
              {systemInfo?.cuda_available ? "CUDA Accelerated" : "CPU Fallback"}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Projects</h3>
            <p className="text-xs text-zinc-400">Continue where you left off</p>
          </div>
          {projects.length > 0 && (
            <button
              onClick={() => onNavigate("projects")}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-zinc-900/30 border border-dashed border-white/10">
            <Film className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-300">No projects yet</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              You haven't generated any video projects yet. Create your first video project to get started.
            </p>
            <button
              onClick={() => onNavigate("create")}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Video</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onNavigate("projects")}
                className="group p-4 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/15 cursor-pointer transition-all flex gap-4"
              >
                {/* Thumbnail placeholder */}
                <div className="w-28 h-20 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 shrink-0 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                  <Film className="w-6 h-6 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-zinc-400">
                    {project.duration_seconds}s
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {project.name}
                      </h4>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          project.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-indigo-500/20 text-indigo-300"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1">
                      {project.prompt}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{project.aspect_ratio}</span>
                    <span>•</span>
                    <span>{project.resolution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Host Architecture & Environment Card */}
      {systemInfo && (
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Host Environment Telemetry
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 text-[11px] block">OS & Platform</span>
              <span className="font-medium text-white">
                {systemInfo.os_name} {systemInfo.os_release} ({systemInfo.os_architecture})
              </span>
            </div>
            <div>
              <span className="text-zinc-400 text-[11px] block">Python Runtime</span>
              <span className="font-mono text-white">v{systemInfo.python_version}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[11px] block">CPU Configuration</span>
              <span className="font-medium text-white">
                {systemInfo.cpu_cores_physical} cores / {systemInfo.cpu_cores_logical} threads
              </span>
            </div>
            <div>
              <span className="text-zinc-400 text-[11px] block">RAM Installed</span>
              <span className="font-medium text-white">
                {systemInfo.ram_total_gb} GB ({systemInfo.ram_available_gb} GB available)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
