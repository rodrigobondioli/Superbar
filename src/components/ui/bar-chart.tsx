"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-strong)",
      borderRadius: "4px",
      padding: "8px 12px",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
        {(point.payload as { label: string }).label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)", margin: "2px 0 0", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
        {currency.format(Number(point.value))}
      </p>
    </div>
  );
}

export function BarChart({ data, height = 140 }: BarChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="16%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.15]} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "color-mix(in srgb, var(--fg) 4%, transparent)" }} />
          <Bar
            dataKey="value"
            fill="var(--accent)"
            radius={[2, 2, 0, 0]}
            isAnimationActive
            animationDuration={500}
            animationEasing="ease-out"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
