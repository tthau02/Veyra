import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "./layouts/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateVideoPage } from "./pages/CreateVideoPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ModelsPage } from "./pages/ModelsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NavPage, SystemInfo, Project, ModelItem } from "./types";
import { api } from "./services/api";

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>("dashboard");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // App data state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "local-proj-1",
      name: "Cyberpunk Neo-Tokyo Rain",
      prompt: "Futuristic city with neon rain reflections, cinematic 8k photorealistic video, glowing billboards",
      negative_prompt: "blurry, low quality, jitter, artifact",
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
      name: "Deep Ocean Bioluminescence",
      prompt: "Ethereal glowing jellyfish drifting through dark abyss, bioluminescent particles, smooth camera pan",
      negative_prompt: "cartoon, oversaturated, jerky motion",
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

  const [models, setModels] = useState<ModelItem[]>([
    {
      id: "model-example",
      name: "Example Video Model",
      type: "Text to Video",
      size_gb: 0.0,
      status: "Not Installed",
      description: "Lightweight reference model specification for architectural verification.",
    },
    {
      id: "model-veyra-v1",
      name: "Veyra Diffusion v1",
      type: "Text to Video",
      size_gb: 4.2,
      status: "Installed",
      description: "Default latent diffusion pipeline optimized for local generation.",
    },
    {
      id: "model-animatediff",
      name: "AnimateDiff Lightning",
      type: "Image/Text to Video",
      size_gb: 2.8,
      status: "Not Installed",
      description: "High-speed distilled motion adapter for rapid prototype sequences.",
    },
    {
      id: "model-cogvideox",
      name: "CogVideoX-2B Stub",
      type: "Text to Video",
      size_gb: 5.1,
      status: "Not Installed",
      description: "Next-generation transformer-based video synthesis architecture.",
    },
  ]);

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

  // Model installation handler
  const handleInstallModel = async (modelId: string) => {
    const installed = await api.installModel(modelId);
    if (installed) {
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: "Installed" } : m))
      );
    } else {
      // Local state fallback
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: "Installed" } : m))
      );
    }
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
      {currentPage === "dashboard" && (
        <DashboardPage
          onNavigate={setCurrentPage}
          projects={projects}
          models={models}
          systemInfo={systemInfo}
          backendOnline={backendOnline}
        />
      )}

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
        <ModelsPage models={models} onInstallModel={handleInstallModel} />
      )}

      {currentPage === "settings" && (
        <SettingsPage systemInfo={systemInfo} />
      )}
    </MainLayout>
  );
};

export default App;
