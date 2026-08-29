import { lazy, Suspense, useState } from "react";
import { Download, Trash2, RefreshCw } from "lucide-react";
import type { ModelShowInfo, OllamaModel, PullProgress, SystemStats } from "../types";
import type { StatsSample } from "../hooks/useSystemStats";
import { ModelDropdown } from "./ModelDropdown";

const SystemMonitor = lazy(() => import("./SystemMonitor").then((m) => ({ default: m.SystemMonitor })));

interface SidebarProps {
  models: OllamaModel[];
  selectedModel: string | null;
  onSelectModel: (name: string) => void;
  modelInfo: ModelShowInfo | null;
  contextUsedTokens: number;
  onRefreshModels: () => void;
  onPullModel: (name: string) => void;
  pulling: boolean;
  pullProgress: PullProgress | null;
  onDeleteModel: (name: string) => void;
  sysCurrent: SystemStats | null;
  sysHistory: StatsSample[];
  numCtxOverride: number | null;
}

function fmtBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

export function Sidebar(props: SidebarProps) {
  const {
    models,
    selectedModel,
    onSelectModel,
    modelInfo,
    contextUsedTokens,
    onRefreshModels,
    onPullModel,
    pulling,
    pullProgress,
    onDeleteModel,
    sysCurrent,
    sysHistory,
    numCtxOverride,
  } = props;

  const [pullName, setPullName] = useState("");

  const effectiveCtx = numCtxOverride ?? modelInfo?.numCtx ?? modelInfo?.contextLength ?? null;
  const ctxPercent = effectiveCtx ? Math.min(100, (contextUsedTokens / effectiveCtx) * 100) : 0;

  return (
    <aside className="sidebar">
      <section className="sidebar-section sidebar-section-top">
        <div className="sidebar-section-title">
          Model
          <button className="icon-btn" onClick={onRefreshModels} title="Refresh model list">
            <RefreshCw size={13} />
          </button>
        </div>

        <ModelDropdown models={models} selected={selectedModel} onSelect={onSelectModel} />

        {modelInfo && (
          <div className="model-chips">
            {modelInfo.parameterSize && <div className="stat-chip"><span>Params</span><strong>{modelInfo.parameterSize}</strong></div>}
            {modelInfo.quantization && <div className="stat-chip"><span>Quant</span><strong>{modelInfo.quantization}</strong></div>}
            {effectiveCtx && (
              <div className="stat-chip">
                <span>Context{numCtxOverride != null ? " (custom)" : ""}</span>
                <strong>{effectiveCtx.toLocaleString()}</strong>
              </div>
            )}
            {modelInfo.family && <div className="stat-chip"><span>Family</span><strong>{modelInfo.family}</strong></div>}
          </div>
        )}

        {effectiveCtx && (
          <div className="ctx-bar-wrap" title={`${contextUsedTokens} / ${effectiveCtx} tokens used (approx)`}>
            <div className="ctx-bar-label">
              <span>Context used</span>
              <span>
                {contextUsedTokens.toLocaleString()} / {effectiveCtx.toLocaleString()}
              </span>
            </div>
            <div className="ctx-bar-track">
              <div
                className="ctx-bar-fill"
                style={{ width: `${ctxPercent}%`, background: ctxPercent > 85 ? "var(--danger)" : "var(--accent)" }}
              />
            </div>
          </div>
        )}

        {selectedModel && (
          <button className="text-btn danger" onClick={() => onDeleteModel(selectedModel)}>
            <Trash2 size={12} /> Delete this model
          </button>
        )}
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-title">Pull a model</div>
        <div className="pull-hint">
          Model name only, like on <span className="pull-hint-cmd">ollama.com/library</span> — not the full command.
        </div>
        <div className="pull-row">
          <input
            className="pull-input"
            placeholder="qwen2.5-coder:7b"
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            disabled={pulling}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pullName.trim() && !pulling) onPullModel(pullName.trim());
            }}
          />
          <button
            className="icon-btn primary"
            disabled={pulling || !pullName.trim()}
            onClick={() => onPullModel(pullName.trim())}
            title="Pull model"
          >
            <Download size={14} />
          </button>
        </div>
        <div className="pull-example">
          e.g. <code>{"llama3.1:8b"}</code> · <code>{"mistral:7b"}</code>
        </div>
        {pulling && pullProgress && (
          <div className="pull-progress">
            <div className="pull-progress-status">{pullProgress.status}</div>
            {pullProgress.total ? (
              <div className="ctx-bar-track">
                <div
                  className="ctx-bar-fill"
                  style={{
                    width: `${Math.min(100, ((pullProgress.completed ?? 0) / pullProgress.total) * 100)}%`,
                  }}
                />
              </div>
            ) : null}
            {pullProgress.total ? (
              <div className="pull-progress-bytes">
                {fmtBytes(pullProgress.completed ?? 0)} / {fmtBytes(pullProgress.total)}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="sidebar-section sidebar-section-flex">
        <div className="sidebar-section-title">System</div>
        <Suspense fallback={null}>
          <SystemMonitor current={sysCurrent} history={sysHistory} />
        </Suspense>
      </section>
    </aside>
  );
}
