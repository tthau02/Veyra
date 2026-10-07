import React, { useState } from "react";
import {
  Plus,
  Film,
  Search,
  Clock,
  Trash2,
  Calendar,
  X,
} from "lucide-react";
import { Project, NavPage } from "../types";

interface ProjectsPageProps {
  projects: Project[];
  onCreateProject: (name: string, prompt: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onNavigate: (page: NavPage) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onCreateProject,
  onDeleteProject,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectPrompt, setNewProjectPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectPrompt.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateProject(newProjectName.trim(), newProjectPrompt.trim());
      setNewProjectName("");
      setNewProjectPrompt("");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Projects</h2>
          <p className="text-xs text-zinc-400">All local video generation projects and drafts</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-8 pr-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-52 transition-all"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-zinc-900/30 border border-dashed border-white/10">
          <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">
            {searchQuery ? "No matching projects found" : "No projects yet"}
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No projects matched "${searchQuery}". Try a different keyword.`
              : "Get started by creating your first AI video timeline."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group rounded-xl bg-zinc-900/70 border border-white/5 hover:border-white/15 overflow-hidden transition-all flex flex-col justify-between"
            >
              {/* Project Preview Banner */}
              <div className="h-36 bg-gradient-to-br from-zinc-800 to-zinc-950 relative flex items-center justify-center border-b border-white/5 group-hover:bg-zinc-800/80 transition-colors">
                <Film className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors" />

                {/* Aspect Ratio Badge */}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-zinc-300 border border-white/10">
                  {project.aspect_ratio}
                </span>

                {/* Status Badge */}
                <span
                  className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    project.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  }`}
                >
                  {project.status}
                </span>

                {/* Duration */}
                <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {project.duration_seconds}s
                </span>
              </div>

              {/* Project Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {project.prompt}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
                      {project.resolution}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => onNavigate("create")}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      Open in Studio
                    </button>
                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Create New Project</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Neon Samurai Cyberpunk"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Initial Prompt</label>
                <textarea
                  rows={3}
                  required
                  value={newProjectPrompt}
                  onChange={(e) => setNewProjectPrompt(e.target.value)}
                  placeholder="Describe your scene concept..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
