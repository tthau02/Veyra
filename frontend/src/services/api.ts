import {
  HealthInfo,
  SystemInfo,
  Project,
  ModelItem,
  GenerationRequest,
  GenerationJobStatus,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async getHealth(): Promise<HealthInfo | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      return (await res.json()) as HealthInfo;
    } catch {
      return null;
    }
  }

  public async getSystemInfo(): Promise<SystemInfo | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/system/info`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      return (await res.json()) as SystemInfo;
    } catch {
      return null;
    }
  }

  public async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  }

  public async createProject(payload: {
    name: string;
    prompt: string;
    negative_prompt?: string;
    model_name: string;
    aspect_ratio: string;
    resolution: string;
    duration_seconds: number;
    seed?: number;
  }): Promise<Project | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return (await res.json()) as Project;
    } catch {
      return null;
    }
  }

  public async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects/${id}`, {
        method: "DELETE",
      });
      return res.status === 204;
    } catch {
      return false;
    }
  }

  public async getModels(): Promise<ModelItem[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/models`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  public async installModel(modelId: string): Promise<ModelItem | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/models/${modelId}/install`, {
        method: "POST",
      });
      if (!res.ok) return null;
      return (await res.json()) as ModelItem;
    } catch {
      return null;
    }
  }

  public async generateVideo(req: GenerationRequest): Promise<{
    status: string;
    message: string;
    job_id?: string;
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      return await res.json();
    } catch {
      return {
        status: "error",
        message: "Failed to connect to backend engine.",
      };
    }
  }

  public async startSimulateJob(req: GenerationRequest): Promise<GenerationJobStatus | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) return null;
      return (await res.json()) as GenerationJobStatus;
    } catch {
      return null;
    }
  }

  public async getJobStatus(jobId: string): Promise<GenerationJobStatus | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate/jobs/${jobId}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      return (await res.json()) as GenerationJobStatus;
    } catch {
      return null;
    }
  }

  public async getProviders(): Promise<import("../types").CloudProvider[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/providers`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.providers || [];
    } catch {
      return [];
    }
  }

  public async saveProviderKey(
    providerId: string,
    apiKey: string,
    isActive: boolean = true
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/providers/${providerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, is_active: isActive }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async removeProviderKey(providerId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/providers/${providerId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async testProviderKey(
    providerId: string,
    apiKey: string
  ): Promise<{ valid: boolean; message: string; credits_remaining?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/providers/${providerId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      if (!res.ok) {
        return { valid: false, message: "Lỗi kết nối máy chủ backend." };
      }
      return await res.json();
    } catch {
      return { valid: false, message: "Không thể kết nối đến backend." };
    }
  }

  public async getModelDownloadStatus(
    modelId: string
  ): Promise<{ status: string; progress: number; message?: string } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/models/${modelId}/download-status`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const api = new ApiService();
