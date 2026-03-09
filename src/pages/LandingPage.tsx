import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  X,
  Check,
  ChevronRight,
  Database,
  Globe,
  Link2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  FileCheck,
  Zap,
  Brain,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Data ────────────────────────────────────────────────────────────────────

const normalMarketData = [
  { month: "Jan", loss: 3.2, volume: 120 },
  { month: "Feb", loss: 3.0, volume: 135 },
  { month: "Mar", loss: 2.8, volume: 150 },
  { month: "Apr", loss: 2.5, volume: 142 },
  { month: "May", loss: 2.3, volume: 160 },
  { month: "Jun", loss: 2.1, volume: 175 },
];

const highRateData = [
  { month: "Jan", loss: 5.8, volume: 90 },
  { month: "Feb", loss: 6.2, volume: 82 },
  { month: "Mar", loss: 6.8, volume: 75 },
  { month: "Apr", loss: 7.1, volume: 68 },
  { month: "May", loss: 7.5, volume: 60 },
  { month: "Jun", loss: 7.9, volume: 55 },
];

const applicants = [
  {
    name: "Sarah Chen",
    status: "Approved",
    score: 87,
    income: "$124,000",
    dti: "28%",
    factors: [
      { label: "Payment History", value: 92, positive: true },
      { label: "Credit Utilization", value: 78, positive: true },
      { label: "DTI Ratio", value: 65, positive: true },
      { label: "Account Age", value: 85, positive: true },
    ],
  },
  {
    name: "Marcus Rivera",
    status: "Rejected",
    score: 34,
    income: "$52,000",
    dti: "67%",
    factors: [
      { label: "High DTI Ratio", value: 95, positive: false },
      { label: "Recent Delinquency", value: 88, positive: false },
      { label: "Short Credit History", value: 72, positive: false },
      { label: "High Utilization", value: 60, positive: false },
    ],
  },
  {
    name: "Aisha Patel",
    status: "Approved",
    score: 72,
    income: "$89,000",
    dti: "35%",
    factors: [
      { label: "Strong Income", value: 82, positive: true },
      { label: "Payment History", value: 75, positive: true },
      { label: "Moderate DTI", value: 50, positive: false },
      { label: "Credit Mix", value: 68, positive: true },
    ],
  },
];

const complianceBadges = [
  "SR 11-7 Compliant",
  "SOC 2 Type II",
  "Fair Lending Validated",
  "ECOA Aligned",
  "Basel III Ready",
  "GDPR Compliant",
  "ISO 27001",
  "Model Risk Governance",
  "OCC Guidelines",
  "CFPB Standards",
];

const features = [
  {
    icon: Zap,
    title: "Millisecond-Level Decisions",
    desc: "Automate approvals for Tier-1 applications in under 2 seconds with an enterprise XGBoost pipeline.",
  },
  {
    icon: Brain,
    title: "Model Governance & Compliance",
    desc: "Gain granular, human-readable SHAP insights for every decision. Satisfy Fair Lending and ECOA requirements.",
  },
  {
    icon: FileCheck,
    title: "SR 11-7 Aligned Audit Trails",
    desc: "Generate immutably audit-ready reports, including feature importance and full version history.",
  },
];

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 1,
  duration = 800,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ─── Section wrapper with scroll animation ───────────────────────────────────

function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [marketMode, setMarketMode] = useState<"normal" | "high">("normal");
  const [sliderValue, setSliderValue] = useState(50);
  const [hoveredApplicant, setHoveredApplicant] = useState<number | null>(null);

  const chartData = marketMode === "normal" ? normalMarketData : highRateData;
  const expectedLoss = marketMode === "normal" ? 2.1 : 7.9;
  const approvalRate = marketMode === "normal" ? 87 : 42;

  const ncoSavings = sliderValue * 0.012;
  const hoursSaved = Math.round(sliderValue * 18.5);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">Credit Predictor</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Features
            </a>
            <a
              href="#calculator"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              ROI
            </a>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. PLAYABLE HERO SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left: Copy */}
          <FadeInSection>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                ML-Powered Credit Risk Assessment
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1]">
                Optimize Lending Outcomes with{" "}
                <span className="text-primary">Explainable Credit Intelligence</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Leverage predictive AI to minimize risk and accelerate
                origination. Built for compliance teams and lending officers.
                Every decision is transparent, auditable, and backed by SHAP
                explanations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/register">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Request a Demo <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    View Documentation
                  </Button>
                </a>
              </div>
            </div>
          </FadeInSection>

          {/* Right: Interactive Mini Dashboard */}
          <FadeInSection delay={0.2}>
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xl shadow-primary/5">
              {/* Window chrome */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                  <span className="text-xs text-muted-foreground ml-2">
                    Portfolio Command Center
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-center mb-5">
                <div className="inline-flex rounded-lg border border-border bg-secondary p-0.5">
                  <button
                    onClick={() => setMarketMode("normal")}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      marketMode === "normal"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Normal Market
                  </button>
                  <button
                    onClick={() => setMarketMode("high")}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      marketMode === "high"
                        ? "bg-destructive text-destructive-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    High Interest Rate
                  </button>
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-secondary/80 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Expected Loss
                  </p>
                  <p className="text-xl font-bold mt-1">
                    <span
                      className={
                        marketMode === "normal"
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      <AnimatedNumber value={expectedLoss} suffix="%" />
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/80 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Approval Rate
                  </p>
                  <p className="text-xl font-bold mt-1">
                    <AnimatedNumber
                      value={approvalRate}
                      suffix="%"
                      decimals={0}
                    />
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/80 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Model Health
                  </p>
                  <p className="text-xl font-bold text-success mt-1">
                    {marketMode === "normal" ? "Stable" : "Stressed"}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={marketMode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-lg bg-secondary/50 p-3"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Loss Ratio Trend
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 10]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        stroke={
                          marketMode === "normal"
                            ? "hsl(var(--success))"
                            : "hsl(var(--destructive))"
                        }
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "hsl(var(--background))" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
              <p className="text-center text-[10px] text-muted-foreground mt-3">
                Toggle between market scenarios to see portfolio impact →
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRUST & COMPLIANCE MARQUEE
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-border/50 bg-card/30 overflow-hidden py-4">
        <div className="marquee-track flex gap-12 whitespace-nowrap">
          {[...complianceBadges, ...complianceBadges].map((badge, i) => (
            <span
              key={i}
              className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] font-medium flex items-center gap-2 shrink-0"
            >
              <Lock className="h-3 w-3" />
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="container mx-auto px-4 py-20">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Built for Enterprise Lending
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Every component designed for regulatory scrutiny and operational
              scale.
            </p>
          </div>
        </FadeInSection>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <FadeInSection key={f.title} delay={i * 0.1}>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. INTERACTIVE ROI CALCULATOR
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="calculator"
        className="container mx-auto px-4 py-20"
      >
        <FadeInSection>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Calculate Your <span className="text-primary">Portfolio Impact</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                See how Credit Predictor reduces charge-offs and saves
                underwriting hours at your origination volume.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-8 md:p-10">
              {/* Slider */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Monthly Loan Origination Volume
                  </label>
                  <span className="text-2xl font-bold text-primary">
                    ${sliderValue}M
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-primary
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-foreground"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>$5M</span>
                  <span>$500M</span>
                </div>
              </div>

              {/* Results */}
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  className="rounded-xl bg-success/5 border border-success/20 p-6 text-center"
                  animate={{ scale: [1, 1.01, 1] }}
                  transition={{ duration: 0.3 }}
                  key={`nco-${sliderValue}`}
                >
                  <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Est. Reduction in Net Charge-Offs
                  </p>
                  <p className="text-4xl font-bold text-success">
                    <AnimatedNumber
                      value={ncoSavings}
                      prefix="$"
                      suffix="M"
                      decimals={2}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per month
                  </p>
                </motion.div>

                <motion.div
                  className="rounded-xl bg-primary/5 border border-primary/20 p-6 text-center"
                  animate={{ scale: [1, 1.01, 1] }}
                  transition={{ duration: 0.3 }}
                  key={`hrs-${sliderValue}`}
                >
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Underwriting Hours Saved
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    <AnimatedNumber
                      value={hoursSaved}
                      decimals={0}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    hours per month
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. EXPLAINABLE AI HOVER EXPERIENCE
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Decisions You Can{" "}
              <span className="text-primary">Defend to Regulators</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Hover over any applicant to see exactly why the model made its
              decision, powered by SHAP feature importance.
            </p>
          </div>
        </FadeInSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {applicants.map((app, idx) => (
            <FadeInSection key={app.name} delay={idx * 0.1}>
              <div
                className="relative rounded-xl border border-border bg-card p-6 cursor-pointer group overflow-hidden h-full"
                onMouseEnter={() => setHoveredApplicant(idx)}
                onMouseLeave={() => setHoveredApplicant(null)}
              >
                {/* Base content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{app.name}</p>
                      <span
                        className={`text-xs font-medium ${
                          app.status === "Approved"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Risk Score
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          app.score > 60 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {app.score}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Income
                      </p>
                      <p className="text-lg font-bold">{app.income}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        DTI
                      </p>
                      <p className="text-lg font-bold">{app.dti}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/60 pt-2 group-hover:opacity-0 transition-opacity">
                    Hover to see SHAP explanation →
                  </p>
                </div>

                {/* Hover overlay with SHAP bars */}
                <AnimatePresence>
                  {hoveredApplicant === idx && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 bg-card/98 backdrop-blur-sm p-5 flex flex-col justify-center rounded-xl border border-primary/20"
                    >
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        SHAP Feature Importance
                      </p>
                      <p className="text-sm font-semibold mb-4">
                        Why{" "}
                        <span
                          className={
                            app.status === "Approved"
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          {app.status}
                        </span>
                        ?
                      </p>
                      <div className="space-y-3">
                        {app.factors.map((factor, fi) => (
                          <motion.div
                            key={factor.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: fi * 0.08 }}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                {factor.label}
                              </span>
                              <span
                                className={
                                  factor.positive
                                    ? "text-success"
                                    : "text-destructive"
                                }
                              >
                                {factor.positive ? "+" : "-"}
                                {factor.value}%
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${factor.value}%` }}
                                transition={{
                                  duration: 0.5,
                                  delay: fi * 0.08,
                                }}
                                className={`h-full rounded-full ${
                                  factor.positive
                                    ? "bg-success"
                                    : "bg-destructive"
                                }`}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── Comparison Section ─── */}
      <section className="container mx-auto px-4 py-20">
        <FadeInSection>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-8 space-y-5">
              <h3 className="text-xl font-semibold">
                The Cost of Manual Underwriting
              </h3>
              <div className="space-y-3">
                {[
                  "Slow processing times",
                  "Manual & error-prone",
                  "High operational costs",
                  "Opaque decision making",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <X className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-muted-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-card p-8 space-y-5">
              <h3 className="text-xl font-semibold">
                The Credit Predictor{" "}
                <span className="text-primary">Advantage</span>
              </h3>
              <div className="space-y-3">
                {["Instant decisions", "Fully automated", "Transparent & explainable", "Audit-ready compliance"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span className="text-muted-foreground text-sm">{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ─── XGBoost Architecture ─── */}
      <section className="container mx-auto px-4 pb-20">
        <FadeInSection>
          <div className="max-w-3xl mx-auto rounded-xl border border-border bg-card p-8">
            <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider">
              Model Architecture
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="flex flex-col gap-2">
                {["Bureau Data", "Internal Data", "Macro Indicators"].map(
                  (src) => (
                    <motion.div
                      key={src}
                      whileHover={{ x: 4 }}
                      className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm font-medium text-center"
                    >
                      {src}
                    </motion.div>
                  )
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rotate-0 md:rotate-0 rotate-90 md:!rotate-0" />
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-8 py-5 rounded-xl bg-primary/10 border border-primary/30 text-center"
              >
                <p className="font-bold text-primary text-lg">XGBoost</p>
                <p className="text-xs text-muted-foreground">Core Engine</p>
              </motion.div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex flex-col gap-2">
                {["Predicted Score", "Decision", "Explainability Report"].map(
                  (out) => (
                    <motion.div
                      key={out}
                      whileHover={{ x: -4 }}
                      className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm font-medium text-center"
                    >
                      {out}
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ─── CTA ─── */}
      <section className="container mx-auto px-4 pb-20">
        <FadeInSection>
          <div className="max-w-3xl mx-auto rounded-xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-10 text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              Future-Proof Your Lending Strategy
            </h2>
            <p className="text-muted-foreground">
              Speak with an implementation specialist.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Request a demo
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Credit Predictor</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enterprise-grade credit risk intelligence.
              </p>
            </div>
            {[
              { title: "Product", items: ["Features", "Pricing", "Documentation"] },
              { title: "Company", items: ["About", "Blog", "Contact"] },
              { title: "Legal", items: ["Privacy", "Terms", "Compliance"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item}>
                      <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground border-t border-border pt-6">
            © 2025 Credit Predictor — University Diploma Thesis Project
          </p>
        </div>
      </footer>
    </div>
  );
}
