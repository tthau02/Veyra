import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "./layouts/MainLayout";
// import { DashboardPage } from "./pages/DashboardPage";
import { CreateVideoPage } from "./pages/CreateVideoPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ModelsPage } from "./pages/ModelsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NavPage, SystemInfo, Project, ModelItem } from "./types";
import { api } from "./services/api";

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>("create");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // App data state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "local-proj-1",
      name: "Thành phố mưa đêm Cyberpunk",
      prompt: "Toàn cảnh thành phố tương lai dưới mưa ánh sáng neon phản chiếu, video điện ảnh 8k siêu thực",
      negative_prompt: "mờ, chất lượng kém, rung giật, lỗi hình ảnh",
      model_name: "Veyra Diffusion v1",
      aspect_ratio: "16:9",
      resolution: "1080p",
      duration_seconds: 5,
      seed: 42891,
      status: "completed",
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "local-proj-2",
      name: "Sứa phát quang đại dương sâu",
      prompt: "Đàn sứa biển phát sáng trôi dạt giữa vực thẳm tối tăm, các hạt phát quang sinh học, góc quay lia mượt mà",
      negative_prompt: "hoạt hình, màu quá chói, chuyển động giật cục",
      model_name: "Veyra Diffusion v1",
      aspect_ratio: "9:16",
      resolution: "720p",
      duration_seconds: 10,
      seed: 91823,
      status: "ready",
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [models, setModels] = useState<ModelItem[]>([]);

  // Fetch telemetry and backend status
  const loadSystemInfo = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const health = await api.getHealth();
      if (health) {
        setBackendOnline(true);
        const sys = await api.getSystemInfo();
        if (sys) setSystemInfo(sys);

        // Synchronize projects and models from backend
        const backendProjects = await api.getProjects();
        if (backendProjects.length > 0) {
          setProjects(backendProjects);
        }

        const backendModels = await api.getModels();
        if (backendModels.length > 0) {
          setModels(backendModels);
        }
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic heartbeat check
  useEffect(() => {
    loadSystemInfo();
    const interval = setInterval(loadSystemInfo, 8000);
    return () => clearInterval(interval);
  }, [loadSystemInfo]);

  // Project management handlers
  const handleCreateProject = async (name: string, prompt: string) => {
    const payload = {
      name,
      prompt,
      model_name: "Veyra Diffusion v1",
      aspect_ratio: "16:9",
      resolution: "720p",
      duration_seconds: 5,
    };

    const created = await api.createProject(payload);
    if (created) {
      setProjects((prev) => [created, ...prev]);
    } else {
      // Offline fallback state update
      const newProj: Project = {
        id: `local-${Date.now()}`,
        name,
        prompt,
        model_name: "Veyra Diffusion v1",
        aspect_ratio: "16:9",
        resolution: "720p",
        duration_seconds: 5,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) => [newProj, ...prev]);
    }
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      systemInfo={systemInfo}
      backendOnline={backendOnline}
      onRefreshSystem={loadSystemInfo}
      isRefreshing={isRefreshing}
    >
      {/* Tạm thời ẩn DashboardPage */}
      {/* {currentPage === "dashboard" && (
        <DashboardPage
          onNavigate={setCurrentPage}
          projects={projects}
          models={models}
          systemInfo={systemInfo}
          backendOnline={backendOnline}
        />
      )} */}

      {currentPage === "create" && (
        <CreateVideoPage models={models} />
      )}

      {currentPage === "projects" && (
        <ProjectsPage
          projects={projects}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === "models" && (
        <ModelsPage models={models} onModelsChanged={setModels} />
      )}

      {currentPage === "settings" && (
        <SettingsPage systemInfo={systemInfo} />
      )}
    </MainLayout>
  );
};

export default App;
