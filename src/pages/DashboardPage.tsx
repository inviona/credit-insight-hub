import { useMemo, useState, useEffect } from "react";
import { BarChart3, CheckCircle2, AlertTriangle, Activity, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateMockHistory, generateDailyStats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ChartModal } from "@/components/ChartModal";
import { fetchCurrentInterestRates, generateHistoricalRates, InterestRateData } from "@/lib/interest-rate-api";
import { useNavigate } from "react-router-dom";

const COLORS = ['#4ADE80', '#3B82F6', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const history = useMemo(() => generateMockHistory(20), []);
  const dailyStats = useMemo(() => generateDailyStats(30), []);
  const historicalRates = useMemo(() => generateHistoricalRates(12), []);

  const [currentRates, setCurrentRates] = useState<InterestRateData | null>(null);
  const [selectedChart, setSelectedChart] = useState<{
    title: string;
    description: string;
    analysis: string;
    chart: React.ReactNode;
    trend?: "up" | "down" | "stable";
  } | null>(null);

  useEffect(() => {
    fetchCurrentInterestRates().then(setCurrentRates);
  }, []);

  const totalAssessments = history.length;
  const approvedCount = history.filter((h) => h.decision === "APPROVED").length;
  const approvalRate = totalAssessments ? Math.round((approvedCount / totalAssessments) * 100) : 0;
  const portfolioValue = 10.4; // $10.4M
  const expectedLoss = 2.15; // 2.15%
  const highRiskCount = history.filter((h) => h.decision === "REJECTED").length;

  // Portfolio quality breakdown
  const portfolioQuality = [
    { name: "Excellent (Prime+)", value: 3.5, color: COLORS[0] },
    { name: "Good (Prime)", value: 4.2, color: COLORS[1] },
    { name: "Fair (Near-Prime)", value: 2.1, color: COLORS[2] },
    { name: "Subprime", value: 0.6, color: COLORS[3] },
  ];

  // Delinquency pipeline data
  const delinquencyData = [
    { period: "Current", value: 13.6 },
    { period: "30 Days Late", value: 12.5 },
    { period: "60 Days Late", value: 8.8 },
    { period: "90+ Days Late", value: 0.9 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard — Portfolio Intelligence</h1>
            <p className="text-sm text-muted-foreground">Advanced credit risk assessment overview for banking portfolios</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Pipeline Volume" 
            value={`$${portfolioValue}M`} 
            subtitle={`${totalAssessments} assessments this month`} 
            icon={DollarSign}
            onClick={() => setSelectedChart({
              title: "Pipeline Volume Analysis",
              description: "Total loan portfolio volume and assessment count",
              trend: "up",
              analysis: `The pipeline volume has reached $${portfolioValue}M across ${totalAssessments} assessments this month.\n\nThis represents a healthy growth trajectory, with strong demand across multiple credit tiers. The diversification of the portfolio minimizes concentration risk while maintaining quality standards.\n\nKey Insight: The current volume indicates robust market activity and suggests opportunities for strategic expansion in high-performing segments.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="approved" fill={COLORS[0]} name="Approved Volume" />
                    <Bar dataKey="rejected" fill={COLORS[3]} name="Rejected Volume" />
                  </BarChart>
                </ResponsiveContainer>
              )
            })}
          />
          <KpiCard 
            title="Portfolio Approval Rate" 
            value={`${approvalRate}%`} 
            subtitle={`${approvedCount} / ${totalAssessments} approved`} 
            icon={CheckCircle2} 
            trend="up"
            onClick={() => setSelectedChart({
              title: "Approval Rate Trends",
              description: "Historical approval rate performance and quality metrics",
              trend: "stable",
              analysis: `Current approval rate of ${approvalRate}% reflects a balanced approach to risk management and business growth.\n\nThe rate has remained stable within the target range of 55-65%, indicating consistent underwriting standards and effective risk assessment models. This balance ensures sustainable portfolio growth while maintaining credit quality.\n\nRecommendation: Monitor for any significant deviations from this range, as they may signal market changes or model drift requiring recalibration.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="approved" stroke={COLORS[0]} strokeWidth={2} name="Approved" />
                    <Line type="monotone" dataKey="rejected" stroke={COLORS[3]} strokeWidth={2} name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              )
            })}
          />
          <KpiCard 
            title="Expected Loss Ratio (EL)" 
            value={`${expectedLoss}%`} 
            subtitle={`Current 30-day projected NCO`} 
            icon={Activity}
            onClick={() => setSelectedChart({
              title: "Expected Loss (EL) Analysis",
              description: "30-day projected Net Charge-Offs (NCO) and risk exposure",
              trend: "down",
              analysis: `The Expected Loss Ratio of ${expectedLoss}% represents the projected dollar impact of defaults over the next 30 days.\n\nThis metric is calculated using probability of default (PD), loss given default (LGD), and exposure at default (EAD). The current rate is within acceptable parameters for a mixed-quality portfolio.\n\nProjected Impact: Approximately $${(portfolioValue * expectedLoss / 100).toFixed(0)}k in potential net charge-offs.\n\nMitigation Strategy: Focus on early-stage delinquency management and targeted collection efforts to minimize realized losses.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyStats.map((d, i) => ({ ...d, el: 2.0 + Math.sin(i / 5) * 0.3 }))}>
                    <defs>
                      <linearGradient id="gEL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="el" stroke={COLORS[2]} fill="url(#gEL)" strokeWidth={2} name="Expected Loss %" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            })}
          />
          <KpiCard 
            title="Critical Review Needed" 
            value={highRiskCount} 
            subtitle="High-risk alerts requiring manual review" 
            icon={AlertTriangle} 
            trend="down"
            onClick={() => setSelectedChart({
              title: "High-Risk Alert Analysis",
              description: "Applications flagged for manual underwriter review",
              trend: "down",
              analysis: `${highRiskCount} applications have been flagged for manual review due to elevated risk scores or policy exceptions.\n\nThese cases require human expertise to evaluate contextual factors not captured by automated models, such as:\n• Recent major life events (medical, divorce, job loss)\n• Complex income structures (self-employed, commission-based)\n• Thin credit files with limited history\n• Borderline debt-to-income ratios requiring verification\n\nWorkflow Impact: Average review time is 15-20 minutes per case. Prioritize based on loan size and applicant engagement level.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats.slice(-14).map(d => ({ date: d.date, alerts: Math.floor(d.rejected * 0.7) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="alerts" fill={COLORS[3]} name="Manual Review Required" />
                  </BarChart>
                </ResponsiveContainer>
              )
            })}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Macro Environment Chart */}
          <Card 
            className="lg:col-span-2 cursor-pointer transition-all hover:border-primary/50"
            onClick={() => setSelectedChart({
              title: "Macro Environment vs. Portfolio Yield",
              description: "Benchmark interest rates compared to portfolio performance over the last year",
              trend: "up",
              analysis: `This chart compares your portfolio's average yield against key macroeconomic benchmarks:\n\n• **US Prime Rate** (${currentRates?.usPrimeRate}%): The baseline rate for most consumer and commercial loans\n• **Federal Funds Rate** (${currentRates?.federalFundsRate}%): The Fed's target rate, influencing all other rates\n• **Portfolio Average Yield** (${currentRates?.portfolioYield}%): Your weighted average return\n\nKey Insight: Your portfolio maintains a healthy spread of ${currentRates ? (currentRates.portfolioYield - currentRates.usPrimeRate).toFixed(2) : '1.8'}% above prime rate, compensating for credit risk while remaining competitive.\n\nThe gradual upward trend in benchmark rates has been successfully passed through to borrowers, preserving net interest margin (NIM) and profitability.`,
              chart: (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={historicalRates}>
                    <defs>
                      <linearGradient id="gPrime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gFed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v: string) => v.slice(5, 7) + "/" + v.slice(2, 4)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 10]} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="usPrimeRate" stroke="#64748B" fill="url(#gPrime)" strokeWidth={1.5} name="US Prime Rate" />
                    <Area type="monotone" dataKey="federalFundsRate" stroke="#94A3B8" fill="url(#gFed)" strokeWidth={1.5} name="Federal Funds Rate (EFFR)" />
                    <Area type="monotone" dataKey="portfolioYield" stroke={COLORS[0]} fill="url(#gPortfolio)" strokeWidth={2.5} name="Your Portfolio Avg Yield" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            })}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Macro Environment vs. Portfolio Yield</CardTitle>
              <CardDescription>Interest rate benchmarks over the last year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historicalRates}>
                  <defs>
                    <linearGradient id="gPrimeSmall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFedSmall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPortfolioSmall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} tickFormatter={(v: string) => v.slice(5, 7)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 10]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
                  <Area type="monotone" dataKey="usPrimeRate" stroke="#64748B" fill="url(#gPrimeSmall)" strokeWidth={1} name="US Prime" />
                  <Area type="monotone" dataKey="federalFundsRate" stroke="#94A3B8" fill="url(#gFedSmall)" strokeWidth={1} name="Fed Funds (EFFR)" />
                  <Area type="monotone" dataKey="portfolioYield" stroke={COLORS[0]} fill="url(#gPortfolioSmall)" strokeWidth={2} name="Portfolio Yield" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Portfolio Quality Donut */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => setSelectedChart({
              title: "Portfolio Quality by Credit Tier",
              description: "Distribution of $10.4M portfolio value across credit quality segments",
              trend: "stable",
              analysis: `Portfolio composition by credit tier:\n\n• **Excellent (Prime+)**: $${portfolioQuality[0].value}M (${((portfolioQuality[0].value / portfolioValue) * 100).toFixed(1)}%) - FICO 740+, strongest creditworthiness\n• **Good (Prime)**: $${portfolioQuality[1].value}M (${((portfolioQuality[1].value / portfolioValue) * 100).toFixed(1)}%) - FICO 670-739, solid repayment history\n• **Fair (Near-Prime)**: $${portfolioQuality[2].value}M (${((portfolioQuality[2].value / portfolioValue) * 100).toFixed(1)}%) - FICO 580-669, acceptable risk with monitoring\n• **Subprime**: $${portfolioQuality[3].value}M (${((portfolioQuality[3].value / portfolioValue) * 100).toFixed(1)}%) - FICO <580, higher risk requiring premium pricing\n\nStrategic Insight: The portfolio is well-balanced with ${((portfolioQuality[0].value + portfolioQuality[1].value) / portfolioValue * 100).toFixed(0)}% in prime+ segments, providing stability and lower default rates. The limited subprime exposure (${((portfolioQuality[3].value / portfolioValue) * 100).toFixed(1)}%) minimizes tail risk while still serving underbanked segments.`,
              chart: (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={portfolioQuality}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value}M`}
                    >
                      {portfolioQuality.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )
            })}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portfolio Quality (by Credit Tier)</CardTitle>
              <CardDescription>Total ${portfolioValue}M portfolio value</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={portfolioQuality}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {portfolioQuality.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Decision Trends */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => setSelectedChart({
              title: "Decision Trends — Approvals vs. Rejection Volume",
              description: "Daily approval and rejection counts over the last 30 days",
              trend: "stable",
              analysis: `This chart tracks the daily volume of credit decisions, showing the balance between approved and rejected applications.\n\n**Pattern Analysis:**\n• Approval volume (green) shows consistent demand with weekday peaks\n• Rejection volume (red) remains proportionally stable, indicating effective pre-screening\n• Weekend dips are normal due to reduced application intake\n\n**Quality Signals:**\nThe relatively stable approval-to-rejection ratio suggests:\n• Marketing channels are attracting qualified prospects\n• Underwriting criteria are well-calibrated\n• No sudden market shifts or adverse selection patterns\n\n**Anomaly Detection:** Watch for sudden spikes in rejections, which may indicate:\n• Economic stress in specific geographic or demographic segments\n• Model drift requiring recalibration\n• Fraudulent application attempts`,
              chart: (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="gApprovedLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRejectedLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="approved" stroke={COLORS[0]} fill="url(#gApprovedLarge)" strokeWidth={2} name="Approved" />
                    <Area type="monotone" dataKey="rejected" stroke={COLORS[3]} fill="url(#gRejectedLarge)" strokeWidth={2} name="Rejected" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            })}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Decision Trends — Approvals vs. Rejection Volume (Last 30 Days)</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-success/10 border-success/30">30 days</Badge>
                <Badge variant="outline" className="text-xs bg-muted/10">3 Months</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="approved" stroke={COLORS[0]} fill="url(#gApproved)" strokeWidth={2} name="Approved" />
                  <Area type="monotone" dataKey="rejected" stroke={COLORS[3]} fill="url(#gRejected)" strokeWidth={2} name="Rejected" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Delinquency Pipeline */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => setSelectedChart({
              title: "Portfolio Health — Delinquency Pipeline",
              description: "Health status of existing loans by delinquency stage",
              trend: "down",
              analysis: `This aging analysis shows the health distribution of your existing loan portfolio:\n\n• **Current** (${delinquencyData[0].value}M): ${((delinquencyData[0].value / 35.8) * 100).toFixed(0)}% of loans are current - excellent\n• **30 Days Late** (${delinquencyData[1].value}M): Early-stage delinquency, typically recoverable with outreach\n• **60 Days Late** (${delinquencyData[2].value}M): Moderate concern, requires intensive collection efforts\n• **90+ Days Late** (${delinquencyData[3].value}M): High probability of charge-off, legal action may be needed\n\n**Health Assessment:** The sharp decline from current to 90+ days indicates effective collection processes and strong borrower quality.\n\n**Roll Rate Analysis:** The ${((delinquencyData[3].value / delinquencyData[0].value) * 100).toFixed(1)}% progression from current to 90+ suggests a ${(delinquencyData[3].value * 1000).toFixed(0)}k potential charge-off exposure over the next quarter.\n\n**Action Items:** Focus collection resources on the 30-60 day buckets to prevent roll-forward into 90+ days.`,
              chart: (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={delinquencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="value" fill={COLORS[0]} name="Portfolio Value ($M)">
                      {delinquencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[Math.min(index, 3)]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portfolio Health — Delinquency Pipeline</CardTitle>
              <CardDescription>Health of existing loans</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={delinquencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="value" fill={COLORS[0]} name="Value ($M)">
                    {delinquencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[Math.min(index, 3)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Applications (Portfolio Ledger)</CardTitle>
              <CardDescription>Latest credit risk assessments</CardDescription>
            </div>
            <button 
              onClick={() => navigate("/history")}
              className="text-sm text-primary hover:underline font-medium"
            >
              View More →
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead>Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, 10).map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/history")}>
                    <TableCell className="font-mono-numbers text-xs">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-mono-numbers">${app.amt_income.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono-numbers">${app.amt_credit.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono-numbers">{(app.adj_probability * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant={app.decision === "APPROVED" ? "default" : "destructive"} className={cn(
                        "text-xs",
                        app.decision === "APPROVED" && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                      )}>
                        {app.decision}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Chart Analysis Modal */}
      {selectedChart && (
        <ChartModal
          open={!!selectedChart}
          onOpenChange={(open) => !open && setSelectedChart(null)}
          title={selectedChart.title}
          description={selectedChart.description}
          analysis={selectedChart.analysis}
          chart={selectedChart.chart}
          trend={selectedChart.trend}
        />
      )}
    </DashboardLayout>
  );
}
