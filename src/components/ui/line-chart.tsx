"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";
import { currency } from "@/lib/format";

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
}


function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-strong)",
      borderRadius: "8px",
      padding: "8px 12px",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>
        {(point.payload as { label: string }).label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--fg)", margin: "2px 0 0", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
        {currency.format(Number(point.value))}
      </p>
    </div>
  );
}

export function LineChart({ data, height = 160 }: LineChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--accent-bright)", stopOpacity: 0.12 }} />
              <stop offset="100%" style={{ stopColor: "var(--accent-bright)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.1]} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent-bright)"
            strokeWidth={2}
            fill="url(#chart-area)"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
