import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { ChatMessage } from "../types";
import { useElementSize } from "../hooks/useElementSize";

export function StatsChart({ messages }: { messages: ChatMessage[] }) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  const data = messages
    .filter((m) => m.role === "assistant" && m.stats)
    .map((m, i) => ({
      name: `#${i + 1}`,
      tokensPerSec: Number(m.stats!.tokensPerSec.toFixed(2)),
      ttft: Math.round(m.stats!.ttftMs),
    }));

  if (data.length === 0) {
    return <div className="stats-empty">No responses yet this session.</div>;
  }

  return (
    <div className="stats-chart">
      <div className="stats-chart-title">Tokens/sec per response</div>
      <div className="stats-chart-canvas" ref={ref}>
        {size.width > 0 && size.height > 0 && (
          <BarChart width={size.width} height={size.height} data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              cursor={{ fill: "var(--panel-3)", radius: 4 }}
              contentStyle={{
                fontSize: 11,
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              labelStyle={{ color: "var(--text-dim)" }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(v, key) => [
                key === "tokensPerSec" ? `${v} tok/s` : `${v}ms`,
                key === "tokensPerSec" ? "Speed" : "TTFT",
              ]}
            />
            <Bar dataKey="tokensPerSec" fill="var(--accent)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        )}
      </div>
    </div>
  );
}
