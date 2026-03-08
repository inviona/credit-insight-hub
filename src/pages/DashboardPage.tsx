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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Credit risk assessment overview</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Assessments" value={totalAssessments} subtitle="This month" icon={BarChart3} />
          <KpiCard title="Approval Rate" value={`${approvalRate}%`} subtitle={`${approvedCount} approved`} icon={CheckCircle2} trend="up" />
          <KpiCard title="Avg Risk Score" value={`${avgRisk}%`} subtitle="Adjusted probability" icon={Activity} />
          <KpiCard title="High-Risk Alerts" value={highRiskCount} subtitle="Rejected applications" icon={AlertTriangle} trend="down" />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assessment Trend — Last 30 Days</CardTitle>
            <CardDescription>Approved vs Rejected decisions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="approved" stroke="hsl(var(--success))" fill="url(#gApproved)" strokeWidth={2} name="Approved" />
                <Area type="monotone" dataKey="rejected" stroke="hsl(var(--destructive))" fill="url(#gRejected)" strokeWidth={2} name="Rejected" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <CardDescription>Latest credit risk assessments</CardDescription>
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
                  <TableRow key={app.id} className="cursor-pointer">
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
    </DashboardLayout>
  );
}
