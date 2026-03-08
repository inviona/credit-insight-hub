import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Zap, Brain, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Zap, title: "Instant Decisions", desc: "Get credit risk scores in under 2 seconds with our XGBoost ML pipeline." },
  { icon: Brain, title: "Explainable AI", desc: "SHAP-powered explanations show exactly why each decision was made." },
  { icon: FileCheck, title: "Compliance Ready", desc: "Full audit trail with business rule adjustments and risk documentation." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground tracking-tight">Credit Predictor</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <Link to="/login">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          ML-Powered Credit Risk Assessment
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4">
          Automate loan risk assessment with{" "}
          <span className="text-primary">explainable AI</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Built for bank compliance teams and loan officers. Every decision is transparent, auditable, and backed by SHAP explanations.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">Create Account</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          © 2025 Credit Predictor — University Diploma Thesis Project
        </p>
      </footer>
    </div>
  );
}
