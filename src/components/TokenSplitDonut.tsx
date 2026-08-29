import { PieChart, Pie, Cell, Tooltip } from "recharts";
import type { ChatMessage } from "../types";
import { useElementSize } from "../hooks/useElementSize";

export function TokenSplitDonut({ messages }: { messages: ChatMessage[] }) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  const promptTokens = messages
    .filter((m) => m.role === "assistant" && m.stats)
    .reduce((sum, m) => sum + (m.stats?.promptTokens ?? 0), 0);
  const generatedTokens = messages
    .filter((m) => m.role === "assistant" && m.stats)
    .reduce((sum, m) => sum + (m.stats?.evalTokens ?? 0), 0);

  const total = promptTokens + generatedTokens;

  if (total === 0) {
    return <div className="stats-empty">No token data yet this session.</div>;
  }

  const data = [
    { name: "Prompt", value: promptTokens },
    { name: "Generated", value: generatedTokens },
  ];
  const colors = ["var(--accent)", "var(--accent-2)"];
  const radius = Math.min(size.width, size.height) / 2 - 2;
  const showRing = radius >= 10;

  return (
    <div className="donut-wrap">
      <div className="donut-canvas" ref={ref}>
        {showRing && (
          <PieChart width={size.width} height={size.height}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={radius * 0.6}
              outerRadius={radius}
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: 11,
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(v) => [`${Number(v).toLocaleString()} tok`, ""]}
            />
          </PieChart>
        )}
      </div>
      <div className="donut-legend">
        <span className="donut-legend-item">
          <i style={{ background: colors[0] }} /> Prompt {promptTokens.toLocaleString()}
        </span>
        <span className="donut-legend-item">
          <i style={{ background: colors[1] }} /> Generated {generatedTokens.toLocaleString()}
        </span>
      </div>
      <div className="donut-total">{total.toLocaleString()} tokens total</div>
    </div>
  );
}
