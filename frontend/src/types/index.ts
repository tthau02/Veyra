export type NavPage = "dashboard" | "create" | "projects" | "models" | "settings";

export interface HealthInfo {
  status: string;
  app: string;
  version: string;
}

export interface GPUInfo {
  name: string;
  cuda_available: boolean;
  device_count: number;
  driver_version?: string;
  vram_total_gb?: number;
  vram_used_gb?: number;
  vram_free_gb?: number;
  gpu_usage_percent?: number | null;
  vram_used_percent?: number | null;
  temperature_celsius?: number | null;
}

export interface SystemInfo {
  python_version: string;
  os_name: string;
  os_release: string;
  os_architecture: string;
  cpu_name: string;
  cpu_cores_physical: number;
  cpu_cores_logical: number;
  cpu_usage_percent: number;
  cpu_temperature_celsius?: number | null;
  ram_total_gb: number;
  ram_available_gb: number;
  ram_usage_percent: number;
  cuda_available: boolean;
  gpu: GPUInfo;
  backend_status: string;
}

export type AspectRatio = "16:9" | "9:16" | "1:1";
export type Resolution = "512p" | "720p" | "1080p";
export type Duration = 5 | 10;

export interface Project {
  id: string;
  name: string;
  prompt: string;
  negative_prompt?: string;
  model_name: string;
  aspect_ratio: AspectRatio;
  resolution: Resolution;
  duration_seconds: Duration;
  seed?: number;
  status: "draft" | "queued" | "generating" | "completed" | "ready";
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelItem {
  id: string;
  name: string;
  type: string;
  size_gb: number;
  status: "Installed" | "Not Installed" | "Downloading";
  description: string;
  download_progress?: number;
  supported: boolean;
  download_status: ModelDownloadState;
  downloaded_bytes: number;
  total_bytes: number;
  error_message?: string | null;
  files_complete: boolean;
}

export type ModelDownloadState = "idle" | "queued" | "downloading" | "verifying" | "completed" | "interrupted" | "failed" | "paused" | "waiting_network";

export interface ModelDownloadStatus {
  model_id: string;
  status: ModelDownloadState;
  progress: number;
  downloaded_bytes: number;
  total_bytes: number;
  error_message?: string | null;
}

export interface ModelPreparation {
  model_id: string;
  total_bytes: number;
  remaining_bytes: number;
  required_bytes: number;
}

export interface GenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model_name: string;
  aspect_ratio: AspectRatio;
  resolution: Resolution;
  duration_seconds: Duration;
  seed?: number;
  simulate_progress?: boolean;
  engine_mode?: "local" | "cloud";
}

export interface GenerationJobStatus {
  job_id: string;
  status: "queued" | "generating" | "decoding" | "muxing" | "completed" | "failed";
  progress: number;
  current_step: string;
  output_url?: string | null;
  error_message?: string | null;
  width?: number | null;
  height?: number | null;
  frame_count?: number | null;
  seed?: number | null;
}

export interface AppSettings {
  model_dir: string;
  output_dir: string;
  cache_dir: string;
  gpu_acceleration: boolean;
  auto_cleanup_cache: boolean;
}

export interface CloudProvider {
  provider_id: string;
  name: string;
  description: string;
  is_active: boolean;
  has_key: boolean;
  masked_key?: string;
  credits_remaining?: number;
  status: "active" | "unconfigured" | "invalid_key" | "error";
}
