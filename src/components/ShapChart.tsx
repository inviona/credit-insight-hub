import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts";

const FEATURE_LABELS: Record<string, string> = {
  CREDIT_TO_INCOME: "Loan-to-Income Ratio",
  ANNUITY_TO_INCOME: "Monthly Payment Burden",
  INCOME_PER_PERSON: "Income per Household Member",
  YEARS_EMPLOYED: "Employment Stability (Years)",
  AGE_YEARS: "Applicant Age",
  YEARS_REGISTRATION: "Registration Length (Years)",
  YEARS_ID_CHANGE: "Time Since ID Change",
  EXT_MEAN: "Average External Credit Score",
  EXT_SOURCE_1: "External Credit Source 1",
  EXT_SOURCE_2: "External Credit Source 2",
  EXT_SOURCE_3: "External Credit Source 3",
  AMT_GOODS_PRICE: "Goods Price (Loan Purpose)",
  AMT_CREDIT: "Credit Amount",
  AMT_ANNUITY: "Annuity Amount",
  AMT_INCOME_TOTAL: "Total Income",
  DAYS_BIRTH: "Age (Days)",
  DAYS_EMPLOYED: "Days Employed",
  LOAN_TO_INCOME_RATIO: "Loan-to-Income Ratio",
  OCCUPATION_TYPE: "Occupation Type",
  EDUCATION_TYPE: "Education Level",
  CODE_GENDER: "Gender",
  DAYS_REGISTRATION: "Days Since Registration",
};

function readableName(name: string): string {
  return FEATURE_LABELS[name] || name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ShapChartProps {
  riskFactors: [string, number][];
  protectFactors: [string, number][];
  maxItems?: number;
}

export function ShapChart({ riskFactors, protectFactors, maxItems = 8 }: ShapChartProps) {
  const data = useMemo(() => {
    const risks = riskFactors.slice(0, maxItems).map(([name, val]) => ({
      name: readableName(name),
      value: Math.round(val * 1000) / 1000,
    }));
    const protects = protectFactors.slice(0, maxItems).map(([name, val]) => ({
      name: readableName(name),
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
