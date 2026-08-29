import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Box } from "lucide-react";
import type { OllamaModel } from "../types";

function fmtBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

export function ModelDropdown({
  models,
  selected,
  onSelect,
}: {
  models: OllamaModel[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedModel = models.find((m) => m.name === selected);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="model-dropdown" ref={rootRef}>
      <button className="model-dropdown-trigger" onClick={() => setOpen((v) => !v)} disabled={models.length === 0}>
        <span className="model-dropdown-icon">
          <Box size={15} />
        </span>
        <span className="model-dropdown-label">
          <span className="model-dropdown-name">{selectedModel?.name ?? "No models"}</span>
          {selectedModel && (
            <span className="model-dropdown-meta">
              {selectedModel.details?.parameter_size ?? ""}
              {selectedModel.details?.quantization_level ? ` · ${selectedModel.details.quantization_level}` : ""}
            </span>
          )}
        </span>
        <ChevronDown size={15} className={`model-dropdown-chevron ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="model-dropdown-menu">
          {models.map((m) => (
            <button
              key={m.name}
              className={`model-dropdown-item ${m.name === selected ? "active" : ""}`}
              onClick={() => {
                onSelect(m.name);
                setOpen(false);
              }}
            >
              <div className="model-dropdown-item-main">
                <span className="model-dropdown-item-name">{m.name}</span>
                <span className="model-dropdown-item-tags">
                  {m.details?.parameter_size && <span className="tag">{m.details.parameter_size}</span>}
                  {m.details?.quantization_level && <span className="tag">{m.details.quantization_level}</span>}
                  <span className="tag tag-dim">{fmtBytes(m.size)}</span>
                </span>
              </div>
              {m.name === selected && <Check size={14} className="model-dropdown-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
