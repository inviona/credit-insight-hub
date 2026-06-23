import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Upload,
  LayoutDashboard,
  BarChart3,
  Brain,
  CheckCircle,
  TrendingUp,
  Activity,
  Play,
  Lock,
  Zap,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlbaniaNetworkMap } from "@/components/AlbaniaNetworkMap";

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

const whyChooseUs = [
  {
    icon: Brain,
    title: "High Accuracy",
    description: "Reliable credit decisions backed by models tuned for precision and consistency.",
    iconBg: "bg-violet-500/15",
    iconBorder: "border-violet-500/25",
    iconColor: "text-violet-400",
    hoverBorder: "hover:border-violet-500/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
  },
  {
    icon: Lock,
    title: "Secure Data",
    description: "Bank-grade encryption and strict access controls keep borrower data protected end to end.",
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/25",
    iconColor: "text-blue-400",
    hoverBorder: "hover:border-blue-500/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]",
  },
  {
    icon: Zap,
    title: "Faster Decisions",
    description: "Cut underwriting time with sub-second scoring on every application.",
    iconBg: "bg-emerald-500/15",
    iconBorder: "border-emerald-500/25",
    iconColor: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]",
  },
  {
    icon: ShieldCheck,
    title: "Reduce Risk",
    description: "Minimize defaults with smarter, data-driven risk assessment and monitoring.",
    iconBg: "bg-amber-500/15",
    iconBorder: "border-amber-500/25",
    iconColor: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]",
  },
  {
    icon: Layers,
    title: "Instant Multi-Application Scoring",
    description: "Run one application or thousands in seconds—faster delivery from intake to decision.",
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/25",
    iconColor: "text-purple-400",
    hoverBorder: "hover:border-purple-500/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-blue-500/30 overflow-hidden font-sans">
      {/* ─── Navbar ─── */}
      <nav className="border-b border-white/5 bg-[#0a0f1c]/50 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <img src="/new-updated-logo.png" alt="Logo" className="h-10 object-contain" />
            <span className="font-bold text-lg tracking-tight text-white">
              Credit Risk Intelligent Analyst
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#why-us"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Why Us
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <Link
              to="/contact-sales"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Contact Sales
            </Link>
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
                <Link to="/personal">
                  <Button variant="secondary" size="lg" className="h-14 px-8 text-base gap-2">
                    Free individual try <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-8 border-t border-white/10">
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">Speed</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Efficient</span>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">Inovative</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Automatic</span>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">Fully</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Compliant</span>
                 </div>
              </div>
            </motion.div>

            {/* Hero Map Visualization */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-32 h-[70%] bg-gradient-to-r from-[#070b14] to-transparent pointer-events-none z-10 hidden lg:block" />
              <AlbaniaNetworkMap />
            </div>

          </div>
        </div>
      </section>

      {/* ─── Why Choose Us (Business Value) ─── */}
      <section id="why-us" className="relative container mx-auto px-6 lg:px-12 pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-4xl h-[60%] bg-blue-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto mb-14 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Why Banks Choose{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Credit Risk Intelligent Analyst
              </span>
            </h2>
            <p className="mt-5 text-slate-400 text-lg md:text-xl leading-relaxed">
              Built for Albanian lenders who need speed, security, and decisions they can trust.
            </p>
          </motion.div>

          {/* Top row: 3 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {whyChooseUs.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className={`group relative flex flex-col rounded-3xl bg-[#0d1323] border border-white/5 p-8 md:p-10 min-h-[260px] ${item.hoverBorder} ${item.glow} hover:bg-[#11192b] hover:-translate-y-1 transition-all duration-300`}
              >
                <div
                  className={`mb-8 h-16 w-16 rounded-2xl ${item.iconBg} border ${item.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-base leading-relaxed flex-1">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom row: 2 wide cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyChooseUs.slice(3).map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.3 + index * 0.1 }}
                className={`group relative flex flex-col rounded-3xl bg-[#0d1323] border border-white/5 p-8 md:p-10 min-h-[240px] ${item.hoverBorder} ${item.glow} hover:bg-[#11192b] hover:-translate-y-1 transition-all duration-300`}
              >
                <div
                  className={`mb-8 h-16 w-16 rounded-2xl ${item.iconBg} border ${item.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-base leading-relaxed flex-1">
                  {item.description}
                </p>
              </motion.div>
            ))}
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

      {/* ─── Trusted By Section ─── */}
      <section className="border-t border-white/5 py-20 overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 mb-12">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-white tracking-tight">
            Trusted by Leading{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Financial Institutions
            </span>
          </h2>
        </div>
        <div className="relative">
          <div className="flex gap-24 items-center marquee-track">
            {[
              "intesa-sanpaolo-logo.png",
              "credins-logo.png",
              "otp-logo.png",
              "FI_Bank.png",
              "raiffaisen-logo.png",
              "union-bank.png",
              "intesa-sanpaolo-logo.png",
              "credins-logo.png",
              "otp-logo.png",
              "FI_Bank.png",
              "raiffaisen-logo.png",
              "union-bank.png",
            ].map((src, i) => {
              const isSmall = src === "otp-logo.png" || src === "intesa-sanpaolo-logo.png";
              return (
                <img
                  key={i}
                  src={`/logo-banks/${src}`}
                  alt="Bank logo"
                  className={`shrink-0 h-10 object-contain opacity-40 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300 ${isSmall ? "scale-[3]" : ""}`}
                />
              );
            })}
          </div>
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
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-slate-200 gap-2 px-10 h-16 text-lg w-full sm:w-auto shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Log in if already registered <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact-sales">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/5 gap-2 px-10 h-16 text-lg w-full sm:w-auto"
                >
                  Contact Sales
                </Button>
              </Link>
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
                <img src="/new-updated-logo.png" alt="Logo" className="h-8 object-contain" />
                <span className="font-bold text-xl text-white">
                  Credit Risk Intelligent Analyst
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
