import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlbaniaNetworkMap } from "@/components/AlbaniaNetworkMap";
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
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-lg p-3 shadow-xl text-slate-200">
        <p className="text-sm font-medium">{payload[0].payload.month || payload[0].payload.name}</p>
        <p className="text-xs text-slate-400">
          {payload[0].name}: <span className="text-blue-400 font-semibold">{payload[0].value}%</span>
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
            background={{ fill: "rgba(255,255,255,0.05)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 text-center text-white">
        <p className="text-3xl font-bold" style={{ color: getColor(score) }}>
          {score}
        </p>
        <p className="text-xs text-slate-400">Risk Score</p>
      </div>
      <div className="flex justify-between w-full px-4 text-[10px] text-slate-500 mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function ApprovalChart() {
  return (
    <div className="h-full w-full text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Approval Rate</span>
        <span className="text-2xl font-bold text-emerald-400">87%</span>
      </div>
      <ResponsiveContainer width="100%" height="75%">
        <AreaChart data={approvalData}>
          <defs>
            <linearGradient id="approvalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <YAxis
            domain={[70, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#34d399"
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
    <div className="h-full w-full text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Default Rate</span>
        <div className="flex items-center gap-1">
          <TrendingDown className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">-0.3%</span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-[70%] mt-2">
        {defaultRateData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col gap-1">
              <div className="w-full bg-blue-500/20 rounded-t-sm relative group">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 group-hover:from-blue-400 group-hover:to-blue-300"
                  style={{ height: `${item.value * 15}px` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.value}%
                </div>
              </div>
              <div className="w-full bg-slate-700/30 rounded-t-sm" style={{ height: `${item.projected * 15}px` }}>
                <div className="w-full h-full bg-slate-600/30 rounded-t-sm border-dashed border border-slate-600/50" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400">{item.name}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400" />
          <span className="text-[10px] text-slate-400">Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm border border-dashed border-slate-600 bg-slate-700/30" />
          <span className="text-[10px] text-slate-400">Projected</span>
        </div>
      </div>
    </div>
  );
}

function PortfolioDonut() {
  return (
    <div className="h-full w-full flex flex-col text-white">
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
              stroke="none"
            >
              {portfolioData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-lg p-2 shadow-xl">
                      <p className="text-xs font-medium text-slate-200">{payload[0]?.payload.name}</p>
                      <p className="text-xs text-slate-400">
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
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors flex-1">
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
  { label: "Default Rate", value: "3.2%", icon: Shield, trend: "-0.3%", up: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-blue-500/30 overflow-hidden font-sans">
      {/* ─── Navbar ─── */}
      <nav className="border-b border-white/5 bg-[#0a0f1c]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <img src="/logo-test.png" alt="Logo" className="h-10 object-contain" />
            <span className="font-bold text-lg tracking-tight text-white">
              Credit Risk IA
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a
              href="#documentation"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Docs
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-20 lg:pt-32 pb-24 lg:pb-32 overflow-hidden">
        {/* Deep background gradients */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-1/2 left-0 w-[40vw] h-[40vw] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none translate-y-1/4 -translate-x-1/2" />
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Hero Text */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="space-y-8 max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Now available for Albanian Financial Institutions
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Automating Consumer Risk Prediction in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Seconds</span>
              </h1>
              
              <p className="text-xl text-slate-400 leading-relaxed font-light">
                Real-time insights. Smarter decisions. Built for Albania. Evaluate borrowers instantly with AI-driven precision and secure APIs.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-[#0a0f1c] hover:bg-slate-200 gap-2 h-14 px-8 text-base shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all">
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-14 px-8 text-base border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm gap-2">
                  <Play className="h-5 w-5" /> View Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-8 border-t border-white/10">
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">99.9%</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Uptime</span>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">&lt;200ms</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">API Latency</span>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">Fully</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Compliant</span>
                 </div>
              </div>
            </motion.div>

            {/* Hero Map Visualization */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1c]/20 to-[#070b14] pointer-events-none z-10" />
                <AlbaniaNetworkMap />
            </div>

          </div>
        </div>
      </section>

      {/* ─── Interactive Dashboard Preview ─── */}
      <section className="container mx-auto px-6 lg:px-12 pb-32">
        <div className="max-w-[1200px] mx-auto">
          {/* Glassmorphism Container */}
          <div className="relative rounded-[2.5rem] overflow-hidden p-px bg-gradient-to-b from-white/10 to-transparent">
            {/* Background Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#0a0f1c] to-[#0a0f1c] pointer-events-none" />

            {/* Main Dashboard Card */}
            <div className="relative bg-[#0d1323] rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-blue-400" />
                  <span className="font-semibold text-xl text-white">Portfolio Analytics</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm text-emerald-400 font-medium">Live Feed</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {kpiCards.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#131c31] border border-white/5 p-5 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <kpi.icon className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <span
                        className={`text-sm font-medium ${
                          kpi.up ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {kpi.trend}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{kpi.value}</p>
                    <p className="text-sm text-slate-400">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Risk Score Gauge */}
                <div className="rounded-2xl bg-[#131c31] border border-white/5 p-5 hover:border-blue-500/30 transition-all duration-300">
                  <RiskGauge score={84} />
                </div>

                {/* Approval Rate Chart */}
                <div className="rounded-2xl bg-[#131c31] border border-white/5 p-5 hover:border-emerald-500/30 transition-all duration-300">
                  <ApprovalChart />
                </div>

                {/* Default Rate Chart */}
                <div className="rounded-2xl bg-[#131c31] border border-white/5 p-5 hover:border-blue-500/30 transition-all duration-300 relative">
                  <DefaultRateChart />
                </div>

                {/* Portfolio Donut */}
                <div className="rounded-2xl bg-[#131c31] border border-white/5 p-5 hover:border-purple-500/30 transition-all duration-300">
                  <PortfolioDonut />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="container mx-auto px-6 lg:px-12 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Comprehensive Risk Architecture
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Powerful tools designed to streamline your lending decisions with unparalleled accuracy and transparent explainability.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/5 bg-[#0d1323] p-8 hover:bg-[#11192b] hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <feature.icon className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="font-semibold text-xl text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Decision Intelligence Section ─── */}
      <section id="how-it-works" className="container mx-auto px-6 lg:px-12 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-[1200px] mx-auto">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Make Smarter Decisions with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Explainable AI</span>
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed">
              Our machine learning models provide not just predictions, but
              detailed explanations for every decision. Understand exactly why a
              borrower was approved or rejected with advanced feature
              importance analysis.
            </p>
            <ul className="space-y-5">
              {[
                "Transparent decision-making process",
                "Regulatory compliance ready for Bank of Albania",
                "Sub-second real-time risk scoring",
                "Comprehensive forensic audit trails",
              ].map((item) => (
                <li key={item} className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                     <CheckCircle className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-slate-300 text-lg">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
               <Link to="/register">
                 <Button className="gap-2 bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                   Start Integration <ArrowRight className="h-4 w-4" />
                 </Button>
               </Link>
            </div>
          </div>

          <div className="space-y-6 relative">
             {/* Decorative blob behind the stats */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-600/10 rounded-full blur-[80px]" />
             
            <div className="grid gap-6 relative z-10">
                <div className="rounded-2xl border border-white/5 bg-[#0d1323]/80 backdrop-blur-xl p-8 flex items-center justify-between hover:border-blue-500/30 transition-all">
                  <div>
                    <p className="text-slate-400 font-medium mb-2">Accuracy Rate</p>
                    <p className="text-4xl font-bold text-white">96.4%</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-[#0d1323]/80 backdrop-blur-xl p-8 flex items-center justify-between hover:border-emerald-500/30 transition-all ml-12">
                  <div>
                    <p className="text-slate-400 font-medium mb-2">Predictions Made in AL</p>
                    <p className="text-4xl font-bold text-white">2.5M+</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-[#0d1323]/80 backdrop-blur-xl p-8 flex items-center justify-between hover:border-cyan-500/30 transition-all">
                  <div>
                    <p className="text-slate-400 font-medium mb-2">P95 Processing Time</p>
                    <p className="text-4xl font-bold text-white">120ms</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-cyan-400" />
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-blue-600/10" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-blue-600/20 blur-[120px] rounded-full" />
         
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              Ready to Upgrade Your Credit Risk Strategy?
            </h2>
            <p className="text-blue-100/70 text-xl font-light">
              Join leading Albanian banks and microfinance institutions making smarter, faster lending decisions with our API.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-slate-200 gap-2 px-10 h-16 text-lg w-full sm:w-auto shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Create Developer Account <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/5 gap-2 px-10 h-16 text-lg w-full sm:w-auto"
                >
                  Contact Sales
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 bg-[#050810] pt-20 pb-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6 md:col-span-1">
              <div className="flex items-center gap-3">
                <img src="/logo-test.png" alt="Logo" className="h-8 object-contain" />
                <span className="font-bold text-xl text-white">
                  Credit Risk IA
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed font-light">
                Secure, compliant infrastructure to automate your underwriting process in Albania. Built for modern financial systems.
              </p>
            </div>

            <div className="md:col-start-2">
              <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Platform</h4>
              <ul className="space-y-4">
                {["Fraud Detection", "Risk Scoring", "API Reference", "Webhooks"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Resources</h4>
              <ul className="space-y-4">
                {["Documentation", "Quickstart", "Compliance (BoA)", "Status"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                {["About", "Customers", "Privacy Policy", "Terms"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
            <p>
              © {new Date().getFullYear()} Credit Risk Intelligent Analyst. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
               <span>Tirana, Albania</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
