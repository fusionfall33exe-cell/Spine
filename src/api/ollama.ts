import type { ChatOptions, ModelShowInfo, OllamaModel, PullProgress } from "../types";

export const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
let baseUrl = DEFAULT_BASE_URL;

export function getBaseUrl(): string {
  return baseUrl;
}

export function setBaseUrl(url: string | null | undefined): void {
  const trimmed = url?.trim().replace(/\/+$/, "");
  baseUrl = trimmed || DEFAULT_BASE_URL;
}

export async function checkOllamaAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/version`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<OllamaModel[]> {
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new Error(`Failed to list models: ${res.status}`);
  const data = await res.json();
  return data.models ?? [];
}

export async function showModel(name: string): Promise<ModelShowInfo> {
  const res = await fetch(`${baseUrl}/api/show`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: name }),
  });
  if (!res.ok) throw new Error(`Failed to show model: ${res.status}`);
  const data = await res.json();

  let numCtx: number | null = null;
  if (typeof data.parameters === "string") {
    const match = data.parameters.match(/num_ctx\s+(\d+)/);
    if (match) numCtx = parseInt(match[1], 10);
  }

  let contextLength: number | null = null;
  const modelInfo = data.model_info ?? {};
  for (const key of Object.keys(modelInfo)) {
    if (key.endsWith(".context_length")) {
      contextLength = modelInfo[key];
      break;
    }
  }

  return {
    contextLength,
    numCtx,
    parameterSize: data.details?.parameter_size,
    quantization: data.details?.quantization_level,
    family: data.details?.family,
  };
}

export async function deleteModel(name: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: name }),
  });
  if (!res.ok) throw new Error(`Failed to delete model: ${res.status}`);
}

export async function* pullModel(
  name: string,
  signal?: AbortSignal,
): AsyncGenerator<PullProgress> {
  const res = await fetch(`${baseUrl}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: name, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Failed to pull model: ${res.status}`);
  yield* readNdjsonStream<PullProgress>(res.body);
}

export interface ChatChunk {
  message?: { role: string; content: string };
  done: boolean;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  total_duration?: number;
  load_duration?: number;
}

export async function* streamChat(
  model: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
  options?: ChatOptions,
): AsyncGenerator<ChatChunk> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true, ...(options ? { options } : {}) }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Chat request failed: ${res.status}`);
  yield* readNdjsonStream<ChatChunk>(res.body);
}

async function* readNdjsonStream<T>(body: ReadableStream<Uint8Array>): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        yield JSON.parse(trimmed) as T;
      }
    }
    const trimmed = buffer.trim();
    if (trimmed) {
      yield JSON.parse(trimmed) as T;
    }
  } finally {
    reader.releaseLock();
  }
}
