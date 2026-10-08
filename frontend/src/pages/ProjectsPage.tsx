import React, { useState } from "react";
import {
  Plus,
  Film,
  Search,
  Trash2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Project, NavPage } from "../types";
import {
  Button,
  Input,
  Textarea,
  Modal,
  Card,
  CardContent,
  Badge,
} from "../components/ui";

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

  const getStatusLabel = (st: string) => {
    switch (st) {
      case "completed":
        return "Hoàn thành";
      case "ready":
        return "Sẵn sàng";
      case "generating":
        return "Đang tạo";
      case "queued":
        return "Đang chờ";
      default:
        return "Bản nháp";
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4">
        {/* Search bar */}
        <div className="w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm dự án..."
            leftIcon={<Search className="w-4 h-4 text-zinc-400" />}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Dự án Mới
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-[var(--border-app)]">
          <Film className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            {searchQuery ? "Không tìm thấy dự án phù hợp" : "Chưa có dự án nào"}
          </p>
          {!searchQuery && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Tạo Dự án Mới
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group flex flex-col justify-between overflow-hidden"
            >
              {/* Aspect Ratio Preview Canvas */}
              <div className="h-36 bg-zinc-100 dark:bg-[#0a0b12] relative flex items-center justify-center border-b border-[var(--border-subtle)]">
                <Film className="w-8 h-8 text-zinc-400 dark:text-zinc-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />

                <div className="absolute top-2.5 left-2.5">
                  <Badge variant="outline" size="xs">
                    {project.aspect_ratio}
                  </Badge>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant={
                      project.status === "completed"
                        ? "success"
                        : project.status === "ready"
                        ? "info"
                        : "default"
                    }
                    size="xs"
                    withDot
                  >
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                <div className="absolute bottom-2.5 right-2.5 text-xs font-mono text-white bg-black/75 px-2 py-0.5 rounded backdrop-blur-sm border border-black/30 shadow-sm">
                  {project.duration_seconds}s
                </div>
              </div>

              {/* Project Details */}
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                    {project.prompt}
                  </p>
                </div>

                <div className="space-y-3 pt-2.5 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">{project.resolution}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate("create")}
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      className="flex-1 text-xs"
                    >
                      Mở trong Studio
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeleteProject(project.id)}
                      title="Xóa dự án"
                      className="px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Dự án Mới"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={isSubmitting}
            >
              Tạo Dự án
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Tên Dự án"
            required
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="VD: Thành phố tương lai mưa đêm Cyberpunk"
          />
          <Textarea
            label="Mô tả Video (Prompt)"
            rows={4}
            required
            value={newProjectPrompt}
            onChange={(e) => setNewProjectPrompt(e.target.value)}
            placeholder="Mô tả ý tưởng khung cảnh, ánh sáng, góc máy..."
          />
        </form>
      </Modal>
    </div>
  );
};
