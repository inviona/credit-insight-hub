import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts";

interface ShapChartProps {
  riskFactors: [string, number][];
  protectFactors: [string, number][];
  maxItems?: number;
}

export function ShapChart({ riskFactors, protectFactors, maxItems = 8 }: ShapChartProps) {
  const data = useMemo(() => {
    const risks = riskFactors.slice(0, maxItems).map(([name, val]) => ({
      name,
      value: Math.round(val * 1000) / 1000,
    }));
    const protects = protectFactors.slice(0, maxItems).map(([name, val]) => ({
      name,
      value: Math.round(val * 1000) / 1000,
    }));
    return [...protects.reverse(), ...risks];
  }, [riskFactors, protectFactors, maxItems]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={Math.max(280, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 160, right: 20, top: 8, bottom: 8 }}>
          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--foreground))",
              fontSize: 12,
            }}
            formatter={(val: number) => [`${val > 0 ? "+" : ""}${val.toFixed(4)}`, "SHAP Impact"]}
          />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={20}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.value > 0 ? "hsl(var(--destructive))" : "hsl(var(--success))"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2 px-2">
        <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ background: "hsl(var(--destructive))" }} />
        Increases risk
        <span className="inline-block w-3 h-3 rounded-sm mr-1 ml-4 align-middle" style={{ background: "hsl(var(--success))" }} />
        Decreases risk
      </p>
    </div>
  );
}
