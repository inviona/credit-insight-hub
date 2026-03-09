import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PredictionPanel } from "@/components/PredictionPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Loader2 } from "lucide-react";
import { FORM_SECTIONS, calcAnnuity } from "@/lib/feature-config";
import { generateMockPrediction, type PredictionResult } from "@/lib/mock-data";

export default function AssessmentPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const updateField = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-calc annuity
      if (["AMT_CREDIT", "INTEREST_RATE", "TERM_MONTHS"].includes(name)) {
        const principal = parseFloat(next.AMT_CREDIT || "0");
        const rate = parseFloat(next.INTEREST_RATE || "0");
        const months = parseInt(next.TERM_MONTHS || "0", 10);
        const annuity = calcAnnuity(principal, rate, months);
        if (annuity > 0) next.AMT_ANNUITY = annuity.toFixed(2);
      }
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("credit-risk-single", {
        body: formData,
      });

      if (error) throw error;
      if (!data) throw new Error("No prediction result received");

      setResult(data as PredictionResult);
    } catch (error) {
      console.error("Prediction error:", error);
      // Fallback to mock on error
      const income = parseFloat(formData.AMT_INCOME_TOTAL || "0");
      const credit = parseFloat(formData.AMT_CREDIT || "0");
      const ratio = credit / (income + 1);
      setResult(generateMockPrediction(ratio < 4));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Credit Assessment</h1>
          <p className="text-sm text-muted-foreground">Enter applicant data to run risk prediction</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Accordion type="multiple" defaultValue={[FORM_SECTIONS[0].title]} className="space-y-3">
            {FORM_SECTIONS.map((section) => (
              <AccordionItem key={section.title} value={section.title} className="border border-border rounded-lg overflow-hidden bg-card">
                <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span>{section.icon}</span> {section.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Label htmlFor={field.name} className="text-xs">{field.label}</Label>
                          {field.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] text-xs">{field.tooltip}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {field.type === "select" ? (
                          <Select value={formData[field.name] || ""} onValueChange={(v) => updateField(field.name, v)}>
                            <SelectTrigger id={field.name} className="h-9">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value || "_empty"}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            required={field.required}
                            className="h-9 font-mono-numbers"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6">
            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Running Assessment…</> : "Run Credit Assessment"}
            </Button>
          </div>
        </form>
      </div>

      {result && <PredictionPanel result={result} onClose={() => setResult(null)} />}
    </DashboardLayout>
  );
}
