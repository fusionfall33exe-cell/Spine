export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  stats?: MessageStats;
}

export interface MessageStats {
  promptTokens: number;
  evalTokens: number;
  promptDurationMs: number;
  evalDurationMs: number;
  totalDurationMs: number;
  loadDurationMs: number;
  tokensPerSec: number;
  ttftMs: number;
}

export interface OllamaModelDetails {
  parameter_size?: string;
  quantization_level?: string;
  family?: string;
  format?: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
  details: OllamaModelDetails;
}

export interface ModelShowInfo {
  contextLength: number | null;
  numCtx: number | null;
  parameterSize?: string;
  quantization?: string;
  family?: string;
}

export interface GpuStats {
  name: string;
  util_percent: number;
  mem_used_mb: number;
  mem_total_mb: number;
  temp_c: number | null;
}

export interface SystemStats {
  cpu_percent: number;
  per_core_percent: number[];
  mem_used_mb: number;
  mem_total_mb: number;
  ollama_cpu_percent: number;
  ollama_mem_mb: number;
  ollama_running: boolean;
  cpu_temp_c: number | null;
  gpus: GpuStats[];
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemeMode;
  numCtx: number | null;
  temperature: number | null;
  numPredict: number | null;
  serverUrl: string | null;
}

export interface ChatOptions {
  num_ctx?: number;
  temperature?: number;
  num_predict?: number;
}
