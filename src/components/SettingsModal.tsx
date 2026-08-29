import { useEffect, useRef } from "react";
import { X, Sun, Moon, Monitor, RotateCcw } from "lucide-react";
import { DEFAULT_BASE_URL } from "../api/ollama";
import type { AppSettings, ModelShowInfo, ThemeMode } from "../types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onReset: () => void;
  modelInfo: ModelShowInfo | null;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SliderRow({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-head">
        <span className="settings-row-label">{label}</span>
        <span className="settings-hint">{hint}</span>
      </div>
      <div className="settings-row-input">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="settings-number-readout">{format ? format(value) : value}</span>
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose, settings, onUpdate, onReset, modelInfo }: SettingsModalProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const modelCtx = modelInfo?.numCtx ?? modelInfo?.contextLength ?? null;
  const ctxMax = Math.max(32768, modelCtx ?? 32768);
  const effectiveCtx = settings.numCtx ?? modelCtx ?? 4096;
  const effectiveTemp = settings.temperature ?? 0.8;
  const effectiveNumPredict = settings.numPredict ?? -1;

  return (
    <div
      className="settings-backdrop"
      ref={backdropRef}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="settings-modal">
        <div className="settings-header">
          <span>Settings</span>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <div className="settings-section-title">Appearance</div>
            <div className="theme-switch">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`theme-switch-btn ${settings.theme === value ? "active" : ""}`}
                  onClick={() => onUpdate({ theme: value })}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Connection</div>
            <div className="settings-note">
              Ollama server address. Leave blank to use the default.
            </div>
            <div className="settings-row">
              <div className="settings-row-head">
                <span className="settings-row-label">Server URL</span>
                <span className="settings-hint">default {DEFAULT_BASE_URL}</span>
              </div>
              <input
                type="text"
                className="settings-text-input"
                placeholder={DEFAULT_BASE_URL}
                value={settings.serverUrl ?? ""}
                onChange={(e) => onUpdate({ serverUrl: e.target.value || null })}
                spellCheck={false}
              />
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Inference parameters</div>
            <div className="settings-note">
              Applies to chats in this app only — the saved model's own settings are untouched.
            </div>

            <SliderRow
              label="Context length"
              hint={modelCtx ? `model default ${modelCtx.toLocaleString()}` : "num_ctx"}
              value={effectiveCtx}
              onChange={(v) => onUpdate({ numCtx: v })}
              min={512}
              max={ctxMax}
              step={512}
              format={(v) => v.toLocaleString()}
            />

            <SliderRow
              label="Temperature"
              hint="model default 0.8"
              value={effectiveTemp}
              onChange={(v) => onUpdate({ temperature: v })}
              min={0}
              max={2}
              step={0.05}
              format={(v) => v.toFixed(2)}
            />

            <SliderRow
              label="Max output tokens"
              hint="model default unlimited"
              value={effectiveNumPredict}
              onChange={(v) => onUpdate({ numPredict: v })}
              min={-1}
              max={8192}
              step={64}
              format={(v) => (v < 0 ? "Unlimited" : v.toLocaleString())}
            />
          </section>

          <button className="text-btn" onClick={onReset}>
            <RotateCcw size={12} /> Reset to model defaults
          </button>
        </div>
      </div>
    </div>
  );
}
