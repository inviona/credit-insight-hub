import { useMemo, useState, useEffect, useCallback } from "react";
import { BarChart3, CheckCircle2, AlertTriangle, Activity, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChartModal } from "@/components/ChartModal";
import { fetchCurrentInterestRates, generateHistoricalRates, InterestRateData } from "@/lib/interest-rate-api";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Application = {
  id: string;
  customer_id: string | null;
  full_name: string | null;
  email: string | null;
  person_income: number | null;
  person_age: number | null;
  person_emp_length: number | null;
  monthly_expenses: number | null;
  existing_debt: number | null;
  loan_amount: number | null;
  loan_term: number | null;
  loan_int_rate: number | null;
  credit_score: number | null;
  employment_status: string | null;
  cb_person_default_on_file: string | null;
  loan_purpose: string | null;
  status: string | null;
  created_at: string | null;
};

const COLORS = ['#4ADE80', '#3B82F6', '#F59E0B', '#EF4444'];

function getDecision(status: string | null): string {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "accepted" || s === "likely_approved") return "APPROVED";
  if (s === "rejected" || s === "denied" || s === "unlikely") return "REJECTED";
  if (s === "pending" || s === "pending_review" || s === "borderline") return "PENDING";
  return status?.toUpperCase() || "UNKNOWN";
}

function getRiskScore(app: Application): number {
  const annualIncome = app.person_income || 0;
  const loanAmount = app.loan_amount || 0;
  const monthlyExpenses = app.monthly_expenses || 0;
  const existingDebt = app.existing_debt || 0;
  const yearsEmployed = app.person_emp_length || 0;
  const empStatus = (app.employment_status || "").toLowerCase();
  const hasDefaults = (app.cb_person_default_on_file || "").toUpperCase() === "Y";

  if (annualIncome <= 0) return 50;

  const dti = (monthlyExpenses + existingDebt) / annualIncome * 12;
  const lti = loanAmount / annualIncome;

  let score = 50;
  score -= dti * 25;
  score -= lti * 15;
  if (hasDefaults) score -= 15;
  if (yearsEmployed >= 2) score += 5;
  if (empStatus === "full_time" || empStatus === "self_employed") score += 5;
  if (empStatus === "unemployed") score -= 15;

  return Math.max(0, Math.min(99, Math.round(score * 10) / 10));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRates, setCurrentRates] = useState<InterestRateData | null>(null);
  const [selectedChart, setSelectedChart] = useState<{
    title: string;
    description: string;
    analysis: string;
    chart: React.ReactNode;
    trend?: "up" | "down" | "stable";
  } | null>(null);

  useEffect(() => {
    fetchApplications();
    fetchCurrentInterestRates().then(setCurrentRates);
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("loan_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setApplications(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dailyStats = useMemo(() => {
    const stats: Record<string, { date: string; approved: number; rejected: number; pending: number }> = {};
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      stats[key] = { date: key, approved: 0, rejected: 0, pending: 0 };
    }

    applications.forEach(app => {
      if (!app.created_at) return;
      const key = new Date(app.created_at).toISOString().split("T")[0];
      if (stats[key]) {
        const decision = getDecision(app.status);
        if (decision === "APPROVED") stats[key].approved++;
        else if (decision === "REJECTED") stats[key].rejected++;
        else if (decision === "PENDING") stats[key].pending++;
      }
    });

    return Object.values(stats);
  }, [applications]);

  const totalAssessments = applications.length;
  const approvedCount = applications.filter(a => getDecision(a.status) === "APPROVED").length;
  const approvalRate = totalAssessments ? Math.round((approvedCount / totalAssessments) * 100) : 0;
  const highRiskCount = applications.filter(a => getDecision(a.status) === "REJECTED").length;

  const portfolioValue = useMemo(() => {
    const total = applications.reduce((sum, a) => sum + (a.loan_amount || 0), 0);
    return total > 0 ? Math.round((total / 1000000) * 100) / 100 : 0;
  }, [applications]);

  const expectedLoss = useMemo(() => {
    if (applications.length === 0) return 0;
    const avgRisk = applications.reduce((sum, a) => sum + getRiskScore(a), 0) / applications.length;
    return Math.round(avgRisk * 10) / 10;
  }, [applications]);

  const portfolioQuality = useMemo(() => {
    const ranges = [
      { name: "Excellent (Prime+)", color: COLORS[0], min: 0, max: 20 },
      { name: "Good (Prime)", color: COLORS[1], min: 20, max: 40 },
      { name: "Fair (Near-Prime)", color: COLORS[2], min: 40, max: 60 },
      { name: "Subprime", color: COLORS[3], min: 60, max: 100 },
    ];

    const counts = ranges.map(r => ({
      name: r.name,
      color: r.color,
      value: applications.filter(a => {
        const score = getRiskScore(a);
        return score >= r.min && score < r.max;
      }).length,
    }));

    return counts.filter(c => c.value > 0);
  }, [applications]);

  const delinquencyData = useMemo(() => {
    return [
      { period: "Approved", value: applications.filter(a => getDecision(a.status) === "APPROVED").length },
      { period: "Borderline", value: applications.filter(a => getDecision(a.status) === "PENDING").length },
      { period: "Rejected", value: applications.filter(a => getDecision(a.status) === "REJECTED").length },
    ].filter(d => d.value > 0);
  }, [applications]);

  const historicalRates = useMemo(() => generateHistoricalRates(12), []);

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
            value={portfolioValue > 0 ? `$${portfolioValue}M` : "$0"}
            subtitle={`${totalAssessments} assessments this month`}
            icon={DollarSign}
            onClick={() => setSelectedChart({
              title: "Pipeline Volume Analysis",
              description: "Total loan portfolio volume and assessment count",
              trend: "up",
              analysis: `The pipeline volume has reached $${portfolioValue}M across ${totalAssessments} assessments.\n\nThis represents the total value of all processed applications. The diversification of the portfolio minimizes concentration risk while maintaining quality standards.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="approved" fill={COLORS[0]} name="Approved" />
                    <Bar dataKey="rejected" fill={COLORS[3]} name="Rejected" />
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
            trend={approvalRate >= 50 ? "up" : "down"}
            onClick={() => setSelectedChart({
              title: "Approval Rate Trends",
              description: "Historical approval rate performance and quality metrics",
              trend: "stable",
              analysis: `Current approval rate of ${approvalRate}% reflects a balanced approach to risk management and business growth.\n\nThe rate indicates consistent underwriting standards and effective risk assessment models.`,
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
            subtitle={`Average risk score across portfolio`}
            icon={Activity}
            onClick={() => setSelectedChart({
              title: "Expected Loss (EL) Analysis",
              description: "Average risk score and portfolio exposure",
              trend: expectedLoss < 50 ? "down" : "up",
              analysis: `The Expected Loss Ratio of ${expectedLoss}% represents the average risk score across your portfolio.\n\nLower values indicate a healthier portfolio with lower default probability. Monitor this metric over time to detect changes in portfolio quality.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyStats.map((d, i) => ({ ...d, el: applications.length > 0 ? applications.reduce((sum, a) => sum + getRiskScore(a), 0) / applications.length : 0 }))}>
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
                    <Area type="monotone" dataKey="el" stroke={COLORS[2]} fill="url(#gEL)" strokeWidth={2} name="Risk Score %" />
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
            trend={highRiskCount <= totalAssessments * 0.3 ? "down" : "up"}
            onClick={() => setSelectedChart({
              title: "High-Risk Alert Analysis",
              description: "Applications flagged for manual underwriter review",
              trend: "down",
              analysis: `${highRiskCount} applications have been flagged for manual review due to elevated risk scores or policy exceptions.\n\nThese cases require human expertise to evaluate contextual factors not captured by automated models.`,
              chart: (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats.slice(-14).map(d => ({ date: d.date, alerts: d.rejected }))}>
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
              analysis: `This chart compares your portfolio's average yield against key macroeconomic benchmarks:\n\n• **US Prime Rate** (${currentRates?.usPrimeRate}%): The baseline rate for most consumer and commercial loans\n• **Federal Funds Rate** (${currentRates?.federalFundsRate}%): The Fed's target rate\n• **Portfolio Average Yield** (${currentRates?.portfolioYield}%): Your weighted average return\n\nThe gradual upward trend in benchmark rates has been successfully passed through to borrowers, preserving net interest margin (NIM) and profitability.`,
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
              description: "Distribution of portfolio applications across risk segments",
              trend: "stable",
              analysis: `Portfolio composition by risk tier:\n\n${portfolioQuality.map(q => `• **${q.name}**: ${q.value} applications (${totalAssessments > 0 ? ((q.value / totalAssessments) * 100).toFixed(1) : 0}%)`).join('\n')}\n\nA balanced portfolio with higher concentration in prime+ segments indicates strong underwriting standards.`,
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
                      label={({ name, value }) => `${name}: ${value}`}
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
              <CardDescription>{totalAssessments} total applications</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {portfolioQuality.length > 0 ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
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
              analysis: `This chart tracks the daily volume of credit decisions, showing the balance between approved and rejected applications.\n\nThe relatively stable approval-to-rejection ratio suggests effective pre-screening and well-calibrated underwriting criteria.`,
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
              title: "Portfolio Health — Application Status Pipeline",
              description: "Distribution of applications by approval status",
              trend: "down",
              analysis: `This analysis shows the health distribution of your applications:\n\n${delinquencyData.map(d => `• **${d.period}**: ${d.value} applications`).join('\n')}\n\nA healthy portfolio should show higher approved counts with minimal rejections.`,
              chart: (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={delinquencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="value" name="Count">
                      {delinquencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portfolio Health — Application Status</CardTitle>
              <CardDescription>Distribution by approval status</CardDescription>
            </CardHeader>
            <CardContent>
              {delinquencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={delinquencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="value" name="Count">
                      {delinquencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              )}
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
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No applications yet. <button onClick={() => navigate("/assess")} className="text-primary hover:underline">Create one</button></div>
            ) : (
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
                  {applications.slice(0, 10).map((app) => {
                    const decision = getDecision(app.status);
                    const riskScore = getRiskScore(app);
                    return (
                      <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/history")}>
                        <TableCell className="font-mono-numbers text-xs">{app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell className="text-right font-mono-numbers">${(app.person_income || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono-numbers">${(app.loan_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono-numbers">{riskScore.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={decision === "APPROVED" ? "default" : "destructive"} className={cn(
                            "text-xs",
                            decision === "APPROVED" && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                          )}>
                            {decision}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
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
