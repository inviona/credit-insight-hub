import { useMemo } from "react";
import { BarChart3, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateMockHistory, generateDailyStats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const history = useMemo(() => generateMockHistory(20), []);
  const dailyStats = useMemo(() => generateDailyStats(30), []);

  const totalAssessments = history.length;
  const approvedCount = history.filter((h) => h.decision === "APPROVED").length;
  const approvalRate = totalAssessments ? Math.round((approvedCount / totalAssessments) * 100) : 0;
  const avgRisk = totalAssessments
    ? Math.round((history.reduce((s, h) => s + h.adj_probability, 0) / totalAssessments) * 100)
    : 0;
  const highRiskCount = history.filter((h) => h.decision === "REJECTED").length;

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
