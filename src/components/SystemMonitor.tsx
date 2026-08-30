import { useState } from "react";
import { AreaChart, Area, YAxis, Tooltip } from "recharts";
import type { StatsSample } from "../hooks/useSystemStats";
import type { SystemStats } from "../types";
import { useElementSize } from "../hooks/useElementSize";
import { Cpu, MemoryStick, Gpu, ChevronDown, ChevronRight } from "lucide-react";

export function SystemMonitor({
  current,
  history,
}: {
  current: SystemStats | null;
  history: StatsSample[];
}) {
  const memPercent = current ? (current.mem_used_mb / current.mem_total_mb) * 100 : 0;
  const gpu = current?.gpus[0] ?? null;
  const [gpuExpanded, setGpuExpanded] = useState(true);
  const [ramRef, ramSize] = useElementSize<HTMLDivElement>();
  const [gpuRef, gpuSize] = useElementSize<HTMLDivElement>();
  const [cpuRef, cpuSize] = useElementSize<HTMLDivElement>();

  return (
    <div className="sysmon">
      <div className="sysmon-row">
        <div className="sysmon-label">
          <MemoryStick size={13} /> RAM
        </div>
        <div className="sysmon-value">
          {current ? `${(current.mem_used_mb / 1024).toFixed(1)}G / ${(current.mem_total_mb / 1024).toFixed(0)}G` : "…"}
        </div>
      </div>
      <div className="sysmon-chart" ref={ramRef}>
        {ramSize.width > 0 && ramSize.height > 0 && (
          <AreaChart width={ramSize.width} height={ramSize.height} data={history}>
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              formatter={() => [`${memPercent.toFixed(1)}%`, "RAM"]}
              labelFormatter={() => ""}
              contentStyle={{
                fontSize: 11,
                padding: "2px 8px",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
              labelStyle={{ color: "var(--text-dim)" }}
              itemStyle={{ color: "var(--text)" }}
            />
            <Area
              type="monotone"
              dataKey={(d: StatsSample) => (d.mem_used_mb / d.mem_total_mb) * 100}
              stroke="var(--accent-2)"
              fill="var(--accent-2)"
              fillOpacity={0.18}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </div>

      <div className="sysmon-gpu-block">
        <div
          className={`sysmon-row ${!gpu ? "sysmon-row-toggle" : ""}`}
          onClick={!gpu ? () => setGpuExpanded((v) => !v) : undefined}
        >
          <div className="sysmon-label">
            <Gpu size={13} /> {gpu ? gpu.name : "GPU"}
          </div>
          <div className="sysmon-value">
            {gpu ? (
              `${gpu.util_percent.toFixed(0)}%`
            ) : gpuExpanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
          </div>
        </div>
        {gpu ? (
          <>
            <div className="sysmon-chart" ref={gpuRef}>
              {gpuSize.width > 0 && gpuSize.height > 0 && (
                <AreaChart width={gpuSize.width} height={gpuSize.height} data={history}>
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    formatter={(v) => [`${Number(v).toFixed(1)}%`, "GPU"]}
                    labelFormatter={() => ""}
                    contentStyle={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}
                    labelStyle={{ color: "var(--text-dim)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={(d: StatsSample) => d.gpus[0]?.util_percent ?? 0}
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.18}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                </AreaChart>
              )}
            </div>
            <div className="sysmon-subhead">
              {(gpu.mem_used_mb / 1024).toFixed(1)}G / {(gpu.mem_total_mb / 1024).toFixed(1)}G VRAM
              {gpu.temp_c != null ? ` · ${gpu.temp_c.toFixed(0)}°C` : ""}
            </div>
            {current && current.gpus.length > 1 && (
              <div className="sysmon-subhead">+{current.gpus.length - 1} more GPU(s) detected</div>
            )}
          </>
        ) : (
          gpuExpanded && (
            <div className="sysmon-note">No supported GPU detected (NVIDIA/AMD only, via nvidia-smi/rocm-smi)</div>
          )
        )}
      </div>

      <div className="sysmon-row">
        <div className="sysmon-label">
          <Cpu size={13} /> CPU
        </div>
        <div className="sysmon-value">
          {current ? `${current.cpu_percent.toFixed(0)}%` : "…"}
          {current?.cpu_temp_c != null ? (
            <span className="sysmon-value-sub"> · {current.cpu_temp_c.toFixed(0)}°C</span>
          ) : null}
        </div>
      </div>
      <div className="sysmon-chart" ref={cpuRef}>
        {cpuSize.width > 0 && cpuSize.height > 0 && (
          <AreaChart width={cpuSize.width} height={cpuSize.height} data={history}>
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              formatter={(v) => [`${Number(v).toFixed(1)}%`, "CPU"]}
              labelFormatter={() => ""}
              contentStyle={{
                fontSize: 11,
                padding: "2px 8px",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
              labelStyle={{ color: "var(--text-dim)" }}
              itemStyle={{ color: "var(--text)" }}
            />
            <Area
              type="monotone"
              dataKey="cpu_percent"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.18}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </div>

      {current && current.per_core_percent.length > 0 && (
        <>
          <div className="sysmon-subhead">{current.per_core_percent.length} cores</div>
          <div className="core-grid">
            {current.per_core_percent.map((pct, i) => (
              <div
                key={i}
                className="core-cell"
                title={`Core ${i}: ${pct.toFixed(0)}%`}
                style={{ opacity: 0.25 + Math.min(1, pct / 100) * 0.75 }}
              />
            ))}
          </div>
        </>
      )}

      {current?.ollama_running && (
        <div className="sysmon-ollama">
          ollama: {current.ollama_cpu_percent.toFixed(0)}% CPU · {(current.ollama_mem_mb / 1024).toFixed(1)} GB RAM
        </div>
      )}
    </div>
  );
}
