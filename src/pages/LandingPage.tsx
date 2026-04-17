import { Link } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  FileText,
  Upload,
  LayoutDashboard,
  BarChart3,
  Brain,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const features = [
  {
    icon: FileText,
    title: "Single Assessment Form",
    description:
      "Input borrower data and receive instant credit risk predictions with detailed explanations.",
  },
  {
    icon: Upload,
    title: "Bulk CSV Processing",
    description:
      "Upload CSV files containing multiple loan applications for batch risk assessment.",
  },
  {
    icon: LayoutDashboard,
    title: "Interactive Dashboard",
    description:
      "Monitor portfolio health with real-time KPIs, charts, and trend analysis.",
  },
  {
    icon: BarChart3,
    title: "Historical Analytics",
    description:
      "Track past assessments, analyze patterns, and export reports for compliance.",
  },
];

const approvalData = [
  { month: "Jan", rate: 82 },
  { month: "Feb", rate: 85 },
  { month: "Mar", rate: 79 },
  { month: "Apr", rate: 88 },
  { month: "May", rate: 91 },
  { month: "Jun", rate: 87 },
];

const defaultRateData = [
  { name: "Current", value: 3.2, projected: 3.8 },
  { name: "Q1", value: 2.9, projected: 3.2 },
  { name: "Q2", value: 3.5, projected: 3.6 },
  { name: "Q3", value: 3.1, projected: 3.4 },
];

const portfolioData = [
  { name: "Tech", value: 35, color: "#3b82f6" },
  { name: "Retail", value: 25, color: "#06b6d4" },
  { name: "Manufacturing", value: 20, color: "#8b5cf6" },
  { name: "Healthcare", value: 12, color: "#10b981" },
  { name: "Other", value: 8, color: "#6b7280" },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { month?: string; name?: string }; value: number; name: string }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium">{payload[0].payload.month || payload[0].payload.name}</p>
        <p className="text-xs text-muted-foreground">
          {payload[0].name}: <span className="text-blue-500 font-semibold">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

function RiskGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s <= 40) return "#ef4444";
    if (s <= 70) return "#eab308";
    return "#22c55e";
  };

  const data = [
    { name: "score", value: score },
    { name: "remaining", value: 100 - score },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="80%">
        <RadialBarChart
          cx="50%"
          cy="80%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            fill="url(#gaugeGradient)"
            background={{ fill: "hsl(var(--secondary))" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 text-center">
        <p className="text-3xl font-bold" style={{ color: getColor(score) }}>
          {score}
        </p>
        <p className="text-xs text-muted-foreground">Risk Score</p>
      </div>
      <div className="flex justify-between w-full px-4 text-[10px] text-muted-foreground mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function ApprovalChart() {
  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Approval Rate</span>
        <span className="text-2xl font-bold text-emerald-500">87%</span>
      </div>
      <ResponsiveContainer width="100%" height="75%">
        <AreaChart data={approvalData}>
          <defs>
            <linearGradient id="approvalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            domain={[70, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#approvalGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DefaultRateChart() {
  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Default Rate</span>
        <div className="flex items-center gap-1">
          <TrendingDown className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-emerald-500">-0.3%</span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-[70%] mt-2">
        {defaultRateData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col gap-1">
              <div className="w-full bg-blue-600/30 rounded-t-sm relative group">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-300"
                  style={{ height: `${item.value * 15}px` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.value}%
                </div>
              </div>
              <div className="w-full bg-gray-600/20 rounded-t-sm" style={{ height: `${item.projected * 15}px` }}>
                <div className="w-full h-full bg-gray-500/30 rounded-t-sm border-dashed border border-gray-500/50" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400" />
          <span className="text-[10px] text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm border border-dashed border-gray-500 bg-gray-500/20" />
          <span className="text-[10px] text-muted-foreground">Projected</span>
        </div>
      </div>
    </div>
  );
}

function PortfolioDonut() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Portfolio Distribution</span>
      </div>
      <div className="flex items-center gap-2 flex-1">
        <ResponsiveContainer width="50%" height="100%">
          <PieChart>
            <Pie
              data={portfolioData}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {portfolioData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl">
                      <p className="text-xs font-medium">{payload[0]?.payload.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0]?.value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {portfolioData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 group cursor-pointer">
              <div
                className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                {item.name}
              </span>
              <span className="text-xs font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const kpiCards = [
  { label: "Total Loans", value: "$2.4M", icon: DollarSign, trend: "+12%", up: true },
  { label: "Active Borrowers", value: "1,284", icon: Users, trend: "+8%", up: true },
  { label: "Avg. Score", value: "72", icon: CreditCard, trend: "-2%", up: false },
  { label: "Default Rate", value: "3.2%", icon: AlertCircle, trend: "-0.3%", up: true },
];

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navbar ─── */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src="/credit-intelligent-logo.png" alt="Logo" className="h-10 w-auto" />
            <span className="font-bold text-lg tracking-tight">
              Credit Risk Intelligent Predictor
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#documentation"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="container mx-auto px-4 pt-12 pb-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Intelligent Credit Risk Prediction
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Leverage machine learning to assess creditworthiness with precision.
            Make faster, data-driven lending decisions backed by explainable AI
            insights.
          </p>
        </div>
      </section>

      {/* ─── Interactive Dashboard Preview ─── */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Glassmorphism Container */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-500/10 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Main Dashboard Card */}
            <div className="relative backdrop-blur-xl bg-card/60 border border-border/50 rounded-3xl p-6 shadow-2xl">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Portfolio Analytics</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-emerald-500 font-medium">Live Data Feed</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {kpiCards.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-card/80 border border-border/50 p-4 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <kpi.icon className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={`text-xs font-medium ${
                          kpi.up ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {kpi.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Risk Score Gauge */}
                <div className="rounded-xl bg-card/80 border border-border/50 p-4 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                  <RiskGauge score={72} />
                </div>

                {/* Approval Rate Chart */}
                <div className="rounded-xl bg-card/80 border border-border/50 p-4 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                  <ApprovalChart />
                </div>

                {/* Default Rate Chart */}
                <div className="rounded-xl bg-card/80 border border-border/50 p-4 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                  <DefaultRateChart />
                </div>

                {/* Portfolio Donut */}
                <div className="rounded-xl bg-card/80 border border-border/50 p-4 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                  <PortfolioDonut />
                </div>
              </div>

              {/* Dashboard Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Updated 2s ago
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span>Data refreshes automatically</span>
                </div>
                <div className="flex gap-4 mt-2 sm:mt-0">
                  <Link to="/register">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
                      Start Assessing Risk <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#documentation">
                    <Button variant="outline" size="lg">
                      View Documentation
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Everything You Need to Assess Credit Risk
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Powerful tools designed to streamline your lending decisions with
            accuracy and transparency.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card hover:border-blue-600/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5"
            >
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Decision Intelligence Section ─── */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Make Smarter Decisions with Explainable AI
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Our machine learning models provide not just predictions, but
              detailed explanations for every decision. Understand exactly why a
              borrower was approved or rejected with SHAP-based feature
              importance analysis.
            </p>
            <ul className="space-y-4">
              {[
                "Transparent decision-making process",
                "Regulatory compliance ready",
                "Real-time risk scoring",
                "Comprehensive audit trails",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <Card className="border-border/50 bg-card hover:border-blue-600/30 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                  <p className="text-3xl font-bold mt-1">94%</p>
                </div>
                <Brain className="h-12 w-12 text-blue-600/20" />
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card hover:border-blue-600/30 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Predictions Made</p>
                  <p className="text-3xl font-bold mt-1">50K+</p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-600/20" />
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card hover:border-blue-600/30 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processing Time</p>
                  <p className="text-3xl font-bold mt-1">&lt;2s</p>
                </div>
                <Activity className="h-12 w-12 text-blue-600/20" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Your Credit Assessment?
            </h2>
            <p className="text-blue-100 text-lg">
              Join hundreds of lenders who are making smarter, faster decisions
              with our AI-powered platform.
            </p>
            <div className="pt-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 gap-2 px-8 py-6"
                >
                  Create Free Account <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/credit-intelligent-logo.png" alt="Logo" className="h-8 w-auto" />
                <span className="font-bold text-lg">
                  Credit Risk Intelligent Predictor
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered credit risk assessment platform helping lenders make
                smarter, faster, and more compliant decisions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "API Documentation", "Integrations"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                {["Documentation", "Tutorials", "Case Studies", "Blog"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                {["About Us", "Contact", "Privacy Policy", "Terms of Service"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Credit Risk Intelligent Predictor. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
