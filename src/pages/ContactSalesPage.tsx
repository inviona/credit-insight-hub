import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const reasons = [
  "Partnership Inquiry",
  "Technical Integration",
  "General Information",
  "Pricing Question",
  "Other",
];

export default function ContactSalesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [contactTime, setContactTime] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !reason) return;

    toast.success("Meeting request submitted!", {
      description: "Our sales team will reach out to you shortly.",
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-blue-500/30 font-sans">
        <nav className="border-b border-white/5 bg-[#0a0f1c]/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-12">
            <Link to="/" className="flex items-center gap-3">
              <img src="/new-updated-logo.png" alt="Logo" className="h-10 object-contain" />
              <span className="font-bold text-lg tracking-tight text-white">
                Credit Risk Intelligent Predictor
              </span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </nav>
        <div className="flex items-center justify-center px-4 py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md space-y-6"
          >
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Thank You!
            </h2>
            <p className="text-slate-400 text-lg">
              Your meeting request has been received. Our sales team will contact you at your preferred time.
            </p>
            <Link to="/">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-500 text-white">
                Return Home <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* ─── Navbar ─── */}
      <nav className="border-b border-white/5 bg-[#0a0f1c]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/new-updated-logo.png" alt="Logo" className="h-10 object-contain" />
            <span className="font-bold text-lg tracking-tight text-white">
              Credit Risk Intelligent Predictor
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#why-us"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Why Us
            </a>
            <a
              href="/#features"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Features
            </a>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* ─── Form ─── */}
      <div className="container mx-auto px-6 lg:px-12 py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <CalendarCheck className="h-4 w-4" />
                Request a Meeting
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Talk to Our{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Sales Team
                </span>
              </h1>
              <p className="mt-4 text-slate-400 text-lg max-w-lg mx-auto">
                Fill out the form below and we'll schedule a meeting to show you how Credit Risk Intelligent Predictor can transform your lending process.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name & Email */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-[#0d1323] border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@bank.com"
                    className="bg-[#0d1323] border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                    required
                  />
                </div>
              </div>

              {/* Reason for Contacting */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-slate-300">
                  Reason for Contacting <span className="text-red-400">*</span>
                </Label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger className="bg-[#0d1323] border-white/10 text-white focus:ring-blue-500/50">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1323] border-white/10 text-slate-200">
                    {reasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Contact Time */}
              <div className="space-y-2">
                <Label htmlFor="contactTime" className="text-slate-300">
                  Preferred Contact Time
                </Label>
                <Input
                  id="contactTime"
                  value={contactTime}
                  onChange={(e) => setContactTime(e.target.value)}
                  placeholder="e.g. Weekdays 10:00 - 14:00, or Friday afternoon"
                  className="bg-[#0d1323] border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-300">
                  Additional Details
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more about your needs, timeline, or any questions you have..."
                  className="bg-[#0d1323] border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 min-h-[120px]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 text-base shadow-[0_0_15px_rgba(37,99,235,0.3)] gap-2"
              >
                Request Meeting <CalendarCheck className="h-5 w-5" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
