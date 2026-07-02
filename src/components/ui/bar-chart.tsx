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
  fill?: boolean;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div style={{
      background: "#1C1C1E",
      border: "1px solid #2C2C2E",
      borderRadius: 8,
      padding: "7px 12px",
    }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
        {(point.payload as { label: string }).label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", margin: "3px 0 0", fontVariantNumeric: "tabular-nums" }}>
        {currency.format(Number(point.value))}
      </p>
    </div>
  );
}

export function BarChart({ data, height = 140, fill = false }: BarChartProps) {
  return (
    <div className="w-full" style={{ height: fill ? "100%" : height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="label"
            axisLine={{ stroke: "#2C2C2E", strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: "#A1A1AA", fontSize: 10 }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.1]} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "rgba(255,53,0,0.04)" }} />
          <Bar
            dataKey="value"
            fill="#FF3500"
            radius={[0, 0, 0, 0]}
            isAnimationActive={false}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
