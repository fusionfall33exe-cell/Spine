import { useCallback, useEffect, useState } from "react";
import type { AppSettings, ChatOptions } from "../types";

const STORAGE_KEY = "spine-settings";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  numCtx: null,
  temperature: null,
  numPredict: null,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", settings.theme);
    }
  }, [settings.theme]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, theme: prev.theme }));
  }, []);

  return { settings, update, reset };
}

export function buildChatOptions(settings: AppSettings): ChatOptions | undefined {
  const options: ChatOptions = {};
  if (settings.numCtx != null) options.num_ctx = settings.numCtx;
  if (settings.temperature != null) options.temperature = settings.temperature;
  if (settings.numPredict != null) options.num_predict = settings.numPredict;
  return Object.keys(options).length > 0 ? options : undefined;
}
