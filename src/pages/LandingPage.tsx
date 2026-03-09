import { Link } from "react-router-dom";
import {
  Shield,
  Zap,
  Brain,
  FileCheck,
  ArrowRight,
  X,
  Check,
  ChevronDown,
  BarChart3,
  Database,
  Globe,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Millisecond-Level Decisions",
    desc: "Automate approvals for Tier-1 applications in under 2 seconds with an enterprise XGBoost pipeline. Drastically increase origination volume without increasing operational overhead.",
  },
  {
    icon: Brain,
    title: "Model Governance & Compliance",
    desc: "Gain granular, human-readable SHAP insights for every decision. Satisfy Fair Lending, ECOA, and Internal Model Risk requirements with ease. Go beyond black-box models.",
  },
  {
    icon: FileCheck,
    title: "SR 11-7 Aligned Audit Trails",
    desc: "Generate immutably audit-ready reports, including feature importance and full version history. Designed to align with regulatory guidance for robust Model Risk Management.",
  },
];

const manualPains = [
  "Slow points",
  "Manual points",
  "High op-ex points",
  "Opaque points",
];

const advantages = ["Instant", "Efficient", "Transparent", "Explainable"];

const partners = [
  { name: "Financial Integration Partners", icon: Link2 },
  { name: "CORE CONNECT", icon: Database },
  { name: "LENDING SYNC", icon: Globe },
  { name: "GLOBAL BANK DATA", icon: BarChart3 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">Credit Predictor</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Optimize Lending Outcomes with Explainable, Data-Driven{" "}
              <span className="text-primary">Credit Intelligence</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Leverage predictive AI to minimize risk and accelerate
              origination. Built for internal compliance teams and lending
              officers. Decisions are transparent, auditable, and backed by
              detailed SHAP explanations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
              <Link to="/register" className="flex-1">
                <Button size="lg" className="w-full gap-2">
                  Request a Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  View Documentation
                </Button>
              </a>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative">
            <div className="rounded-xl border border-border bg-card p-4 shadow-2xl shadow-primary/5 transform perspective-1000 rotate-y-[-3deg] rotate-x-[2deg]">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
                <span className="text-xs text-muted-foreground ml-2">
                  Credit Predictor — Dashboard
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">
                    Expected Loss Ratio
                  </p>
                  <p className="text-xl font-bold text-primary">50%</p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">
                    Interest Rate Trend
                  </p>
                  <div className="flex items-end gap-1 mt-1">
                    {[30, 45, 35, 55, 40, 50, 57].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/60"
                        style={{ height: `${h * 0.5}px` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">
                    Portfolio of Loans
                  </p>
                  <div className="flex items-center justify-center mt-1">
                    <div className="relative h-12 w-12">
                      <svg viewBox="0 0 36 36" className="h-12 w-12">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          className="stroke-secondary"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          className="stroke-success"
                          strokeWidth="3"
                          strokeDasharray="51 49"
                          strokeDashoffset="25"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                        51%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Risk Distribution
                  </p>
                  <div className="flex items-end gap-1">
                    {[80, 60, 45, 30, 20, 25, 35, 50, 65, 87].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h * 0.4}px`,
                          backgroundColor:
                            h > 70
                              ? "hsl(var(--destructive))"
                              : h > 50
                                ? "hsl(var(--warning))"
                                : "hsl(var(--success))",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Approval Rate
                  </p>
                  <p className="text-2xl font-bold text-success">87%</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              See your comprehensive portfolio command center.
            </p>
          </div>
        </div>
      </section>

      {/* Partners Bar */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-8">
          Trusted to Integrate with Core Banking Systems
        </h2>
        <div className="max-w-4xl mx-auto rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-around py-5 px-6 flex-wrap gap-6">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <p.icon className="h-5 w-5" />
                <span className="text-sm font-medium tracking-wide uppercase">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-colors"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Manual Underwriting */}
          <div className="rounded-xl border border-border bg-card p-8 space-y-5">
            <h3 className="text-xl font-semibold">
              The Cost of Manual Underwriting
            </h3>
            <div className="space-y-3">
              {manualPains.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <X className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Predictor Advantage */}
          <div className="rounded-xl border border-primary/30 bg-card p-8 space-y-5">
            <h3 className="text-xl font-semibold">
              The Credit Predictor{" "}
              <span className="text-primary">Advantage</span>
            </h3>
            <div className="space-y-3">
              {advantages.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Explainability Deep Dive */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              A deep dive on{" "}
              <span className="text-primary">explainability</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Gain granular, human-readable SHAP insights for every
              decision. Satisfy Fair Lending, chart annotated feature
              importance.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "Feature Importance",
                "Sankey",
                "Annotated",
                "Internal Model",
                "Nature basis",
                "Feature Importance",
                "SHAP",
                "Feature data",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded-full bg-secondary text-muted-foreground border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {/* SHAP Chart Mockup */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs text-muted-foreground mb-4 text-center">
              SHAP values features importance
            </p>
            <div className="space-y-2">
              {[
                { label: "SHAP value", value: 85, color: "bg-destructive" },
                {
                  label: "Frequency",
                  value: 70,
                  color: "bg-primary",
                },
                {
                  label: "Feature importance",
                  value: 60,
                  color: "bg-accent",
                },
                { label: "Sankey", value: 45, color: "bg-success" },
                {
                  label: "Internal Model",
                  value: 35,
                  color: "bg-warning",
                },
                { label: "Nature basis", value: 30, color: "bg-primary/60" },
                {
                  label: "Feature Importance",
                  value: 55,
                  color: "bg-accent/60",
                },
                { label: "Feature data", value: 20, color: "bg-muted" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 text-right shrink-0">
                    {bar.label}
                  </span>
                  <div className="flex-1 h-4 bg-secondary rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded-sm`}
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* XGBoost Architecture */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-xl border border-border bg-card p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Inputs */}
            <div className="flex flex-col gap-2">
              {["Bureau", "Internal", "Macro"].map((src) => (
                <div
                  key={src}
                  className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm font-medium text-center"
                >
                  {src}
                </div>
              ))}
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

            {/* Core */}
            <div className="px-6 py-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
              <p className="font-bold text-primary">XGBoost</p>
              <p className="text-xs text-muted-foreground">Core</p>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

            {/* Outputs */}
            <div className="flex flex-col gap-2">
              {["Predicted Score", "Decision", "Explainability Report"].map(
                (out) => (
                  <div
                    key={out}
                    className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm font-medium text-center"
                  >
                    {out}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-xl border border-border bg-card p-10 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            Future-Proof Your Lending Strategy
          </h2>
          <p className="text-muted-foreground">
            Request with an implementation specialist.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/register">
              <Button variant="outline" size="lg">
                Request a demo
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg">Request a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Credit Predictor</span>
              </div>
            </div>
            {[
              { title: "Links", items: ["Pricing", "Press", "Responsibility"] },
              { title: "Links", items: ["Prose", "Contact"] },
              { title: "Regions", items: ["Blog", "Contact"] },
            ].map((col) => (
              <div key={col.title + col.items[0]}>
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
            Copyright © Credit Predictor — University Diploma Thesis Project
          </p>
        </div>
      </footer>
    </div>
  );
}
